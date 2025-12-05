import styles from './harlem-shake-style.module.scss'

/**
 * Modernized version of the harlem shake script.
 * https://github.com/moovweb/harlem_shaker/blob/master/harlem-shake-script.js
 */

/**
 * Currently playing promise.
 */
let currentlyPlaying: Promise<void> | null = null

/**
 * Shakable element constraints.
 */
const MIN_HEIGHT = 30
const MIN_WIDTH = 30
const MAX_HEIGHT = 350
const MAX_WIDTH = 350

/**
 * Constants
 */
const PATH_TO_SONG = '/sounds/harlem_shake.mp3'
const CSS_WILL_SHAKE = styles.harlem_will_shake
const CSS_BASE_CLASS = styles.harlem_shake_me
const CSS_SLOW_CLASS = styles.harlem_shake_slow
const CSS_FIRST_CLASS = styles.im_first
const CSS_OTHER_CLASSES = [
  styles.im_drunk,
  styles.im_baked,
  styles.im_trippin,
  styles.im_blown,
]
const CSS_STROBE_CLASS = styles.strobe_light
const CSS_ALL_CLASSES = [
  CSS_WILL_SHAKE,
  CSS_BASE_CLASS,
  CSS_SLOW_CLASS,
  CSS_FIRST_CLASS,
  ...CSS_OTHER_CLASSES,
  CSS_STROBE_CLASS,
]

const removeNode = (node: HTMLElement): void => {
  node.parentElement?.removeChild(node)
}

const removeClasses = (node: HTMLElement): void => {
  node.classList.remove(...CSS_ALL_CLASSES)
}

const flashScreen = (): void => {
  const flash = document.createElement('div')
  flash.classList.add(CSS_STROBE_CLASS)
  document.body.appendChild(flash)
  setTimeout(() => document.body.removeChild(flash), 100)
}

const size = (node: HTMLElement) => ({
  height: node.offsetHeight,
  width: node.offsetWidth,
})

const withinBounds = (node: HTMLElement) => {
  const { height, width } = size(node)
  return (
    height > MIN_HEIGHT &&
    height < MAX_HEIGHT &&
    width > MIN_WIDTH &&
    width < MAX_WIDTH
  )
}

const posY = (elm: HTMLElement) => {
  let top = 0
  do {
    top += elm.offsetTop
    elm = elm.offsetParent as HTMLElement
  } while (elm)
  return top
}

const viewPortHeight = (): number =>
  window.innerHeight || document.documentElement.clientHeight

const scrollY = (): number =>
  window.scrollY || document.documentElement.scrollTop

const isVisible = (node: HTMLElement) => {
  const y = posY(node)
  const vpH = viewPortHeight()
  const st = scrollY()
  return y >= st && y <= vpH + st
}

/**
 * Adds the will-change class to the node to ensure smooth animations.
 */
const willShake = (node: HTMLElement) => {
  node.classList.add(CSS_WILL_SHAKE)
}

const shakeFirst = (node: HTMLElement) => {
  node.classList.add(CSS_BASE_CLASS, CSS_FIRST_CLASS)
}

const shakeOther = (node: HTMLElement) => {
  node.classList.add(
    CSS_BASE_CLASS,
    CSS_OTHER_CLASSES[Math.floor(Math.random() * CSS_OTHER_CLASSES.length)],
  )
}

const shakeSlow = (node: HTMLElement): void => {
  node.classList.replace(CSS_BASE_CLASS, CSS_SLOW_CLASS)
}

const stopShakeAll = (node: HTMLElement): void => {
  node.classList.remove(CSS_BASE_CLASS)
}

const playSong = () =>
  new Promise<void>((resolve, reject) => {
    const allNodes = Array.from(
      document.getElementsByTagName('*'),
    ) as HTMLElement[]
    const firstNode = allNodes.find(
      node => withinBounds(node) && isVisible(node),
    )

    if (!firstNode) {
      return reject(
        'Could not find a node of the right size. Please try a different page.',
      )
    }

    const allShakeableNodes = allNodes.filter(withinBounds)
    allShakeableNodes.forEach(willShake)

    const audioTag = document.createElement('audio')
    audioTag.src = PATH_TO_SONG
    audioTag.loop = false

    let harlem = false
    let shake = false
    let slowmo = false

    audioTag.addEventListener(
      'timeupdate',
      () => {
        const time = audioTag.currentTime

        if (time >= 0.5 && !harlem) {
          harlem = true
          shakeFirst(firstNode)
        }

        if (time >= 15.5 && !shake) {
          shake = true
          flashScreen()
          allShakeableNodes.forEach(shakeOther)
        }

        if (audioTag.currentTime >= 28.4 && !slowmo) {
          slowmo = true
          allShakeableNodes.forEach(shakeSlow)
        }
      },
      true,
    )

    audioTag.addEventListener(
      'ended',
      () => {
        allShakeableNodes.forEach(stopShakeAll)
        allShakeableNodes.forEach(removeClasses)
        removeNode(audioTag)

        currentlyPlaying = null
        resolve()
      },
      true,
    )

    document.body.appendChild(audioTag)
    audioTag.play()
  })

/**
 * Plays the harlem shake.
 *
 * It shakes the first element it can find and then shakes all the other
 * elements of the right size.
 */
export const play = () => {
  if (!currentlyPlaying) {
    currentlyPlaying = playSong()
  }
  return currentlyPlaying
}
