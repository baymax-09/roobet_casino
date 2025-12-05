import { type Commands } from 'redis'
import { type EventEmitter } from 'events'

/**
 * We currently promisify the old Redis client. When we upgrade, hopefully to IORedis, we can delete this file
 * and there will be promise based methods available to us. Bluebird does not expose its PromisifyAll type otherwise
 * I would have just used that. I tried to extract the type where we promisifyAll but it does weird stuff to the method
 * signatures.
 */
declare module 'redis' {
  export interface RedisClient extends Commands<boolean>, EventEmitter {
    pingAsync(): Promise<'PONG'>
    setAsync(key: string, value: any, mode: string, ttl: number): Promise<any>
    getAsync(key: string): Promise<any>
    delAsync(key: string): Promise<any>
    ttlAsync(key: string): Promise<any>
    incrbyAsync(key: string, value: number): Promise<any>
    decrbyAsync(key: string, value: number): Promise<any>
    incrbyfloatAsync(key: string, value: number): Promise<any>
  }
}
