import moment from 'moment-timezone'

import {
  type LevelInfo,
  type LevelsProgress,
  type LevelProgress,
} from 'app/types/roowards'

// eslint-disable-next-line no-restricted-globals
const worker = self

// levelInfo
let levelInfo: LevelInfo | null = null

// currentLevels
let currentLevels: LevelsProgress | null = null

// timerHandler is a map of running level timers
let timerHandler = null

// totalWagered is the amount the current user has wagered
let totalWagered = 0

const countdownSecondsRemaining = {
  /* eslint-disable id-length */
  d: 86400,
  w: 604800,
  m: 2592000,
  /* eslint-enable id-length */
}

const decrementSecondsRemaining = type => {
  return countdownSecondsRemaining[type]--
}

const updateSecondsRemaining = (type, secondsRemaining) => {
  countdownSecondsRemaining[type] = secondsRemaining
}

function start(data: {
  levels: LevelsProgress
  levelInfo: LevelInfo
  hasReload: boolean
}) {
  stop()

  try {
    levelInfo = data.levelInfo
    currentLevels = data.levels

    worker.postMessage({
      event: 'updateRewards',
      rewards: levelsToArray(),
      hasReload: data.hasReload,
    })
  } catch (error) {
    console.error('RoowardsWorker error:', error)
  }
}

function stop() {
  if (timerHandler) {
    clearInterval(timerHandler)
    timerHandler = null
  }
}

function updateTotalWagered(newTotalWagered) {
  totalWagered = newTotalWagered

  if (currentLevels && levelInfo) {
    // consider removing this rule as it is the only way
    // to get typings when iterating over keys of an obj with known keys
    // eslint-disable-next-line init-declarations
    let level: keyof typeof currentLevels

    for (level in currentLevels) {
      const currentLevel = currentLevels[level]
      const tiers = levelInfo[level].tiers

      let tierIndex = 0

      for (tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
        if (totalWagered < tiers[tierIndex].wagerRequired) {
          break
        }
      }

      // Set it back one more level since this one is too high
      tierIndex = Math.max(0, Math.min(tierIndex - 1, tiers.length - 1))

      // TODO: Start after 2024-04-01 at 1PM Eastern Time, and remove after Q2 2024
      const promoStartDate = new Date('2024-04-01T13:00:00-04:00')
      const promoHasStarted = Date.now() >= promoStartDate.getTime()
      // Suppress level up events if the promo has started
      if (!promoHasStarted && tiers[tierIndex].level !== currentLevel.level) {
        currentLevels[level].level = tiers[tierIndex].level
        currentLevels[level].wagerRequired = tiers[tierIndex].wagerRequired
        currentLevels[level].nextLevel =
          tiers[Math.min(tierIndex + 1, tiers.length - 1)]

        worker.postMessage({
          event: 'levelUp',
          type: level,
          currentLevel: currentLevels[level],
          currentLevelInfo: levelInfo[level],
        })

        worker.postMessage({
          event: 'updateRewards',
          rewards: levelsToArray(),
        })
      }
    }
  }
}

function levelsToArray(): Array<
  (LevelProgress & { type: string; info: string }) | []
> {
  if (!currentLevels || !levelInfo) {
    return []
  }

  return Object.entries(currentLevels).map(([key, value]) => ({
    ...value,
    type: key,
    info: levelInfo![key],
  }))
}

function updateClaim(type, secondsRemaining) {
  updateSecondsRemaining(type, secondsRemaining)

  if (secondsRemaining <= 0) {
    worker.postMessage({
      type,
      canClaim: true,
      event: 'updateClaim',
    })
    return
  }

  let intervalHandle: ReturnType<typeof setInterval> | null = null

  const tick = () => {
    const diff = decrementSecondsRemaining(type)

    if (diff <= 0) {
      worker.postMessage({
        type,
        canClaim: true,
        event: 'updateClaim',
      })

      worker.postMessage({
        type,
        event: 'rewardIsReady',
        currentLevel: currentLevels![type],
        currentLevelInfo: levelInfo![type],
      })

      if (intervalHandle) {
        clearInterval(intervalHandle)
      }
      return
    }

    const duration = moment.duration(diff * 1000)
    const days = duration.days()
    const hours = duration.hours()
    const minutes = duration.minutes()
    const seconds = duration.seconds()

    let timerText = ''

    if (diff >= 86400) {
      timerText += `${days.toString().padStart(2, '0')}`
    }

    if (diff >= 3600) {
      timerText += `${timerText.length >= 1 ? ':' : ''}${hours
        .toString()
        .padStart(2, '0')}`
    }

    if (diff >= 60) {
      timerText += `${timerText.length >= 1 ? ':' : ''}${minutes
        .toString()
        .padStart(2, '0')}`
    }

    if (diff >= 0) {
      timerText += `${timerText.length >= 1 ? ':' : ''}${seconds
        .toString()
        .padStart(2, '0')}`
    }

    if (!timerText.length) {
      timerText = 'Preparing reward...'
    }

    worker.postMessage({
      type,
      timerText,
      event: 'updateClaimTimerText',
    })
  }

  tick()
  intervalHandle = setInterval(tick, 1000)

  worker.postMessage({
    type,
    canClaim: secondsRemaining <= 0,
    event: 'updateClaim',
    intervalHandle,
  })
}

worker.addEventListener('message', ({ data }) => {
  if (data.event === 'start') {
    updateTotalWagered(data.totalWagered)
    start(data)
  }

  if (data.event === 'stop') {
    stop()
  }

  if (data.event === 'updateTotalWagered') {
    updateTotalWagered(data.totalWagered)
  }

  if (data.event === 'updateClaim') {
    updateClaim(data.type, data.secondsRemaining)
  }

  if (data.event === 'clearInterval') {
    clearInterval(data.intervalHandle)
  }
})
