export type { Rain } from '../documents/rain'

export interface RainCountdownState {
  newStatus: string | null
  timeToWait: number
}
