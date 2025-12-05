import EventEmitter from 'events'

type EventMap = Record<string, any>
type EventKey<T extends EventMap> = string & keyof T
type EventReceiver<T> = (params: T) => void

export interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  once<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
  emit<K extends EventKey<T>>(
    eventName: K,
    ...params: T[K] extends never ? [undefined?] : [T[K]]
  ): void
  removeAllListeners(): void
}

export const createEmitter = <T extends EventMap>(): Emitter<T> => {
  return new EventEmitter()
}
