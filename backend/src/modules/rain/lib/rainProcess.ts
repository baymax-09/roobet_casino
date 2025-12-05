import moment from 'moment'

import { sleep } from 'src/util/helpers/timer'

import { payoutAllRainUsers, changeRainStatus } from '../documents/rain'
import type * as Types from '../types'
import { rainLogger } from './logger'

export const RainStatus = {
  Countdown: 'countdown',
  Active: 'active',
  Ended: 'ended',
}

export async function countdownState(
  rain: Types.Rain,
): Promise<Types.RainCountdownState> {
  return {
    newStatus: RainStatus.Active,
    timeToWait: moment(rain.rainStartTime).diff(moment()),
  }
}

export async function activeState(
  rain: Types.Rain,
): Promise<Types.RainCountdownState> {
  return {
    newStatus: RainStatus.Ended,
    timeToWait: moment(rain.rainEndTime).diff(moment()),
  }
}

export async function endedState(
  rain: Types.Rain,
): Promise<Types.RainCountdownState> {
  await payoutAllRainUsers(rain.id)
  return {
    newStatus: null,
    timeToWait: 1000,
  }
}

const stateFunctions = {
  [RainStatus.Countdown]: countdownState,
  [RainStatus.Active]: activeState,
  [RainStatus.Ended]: endedState,
}

export async function runRain(currentRain: Types.Rain): Promise<void> {
  const processToRun = stateFunctions[currentRain.status]
  const { newStatus, timeToWait } = await processToRun(currentRain)

  await sleep(timeToWait)

  if (newStatus) {
    await changeRainStatus(currentRain.id, newStatus)
    currentRain.status = newStatus
    await runRain(currentRain)
  } else {
    rainLogger('runRain', { userId: currentRain.creatorUserId }).info(
      'Rain complete!',
      currentRain,
    )
  }
}
