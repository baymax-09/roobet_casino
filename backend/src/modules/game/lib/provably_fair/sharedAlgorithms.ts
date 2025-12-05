import crypto from 'crypto'

import { config } from 'src/system'

import { type HouseGameName } from '../../types'

export function generateHash(gameName: HouseGameName, serverSeed: string) {
  return crypto.createHash('sha256').update(serverSeed.toString()).digest('hex')
}

export function generateHmac(serverSeed: string, salt: string) {
  return crypto
    .createHmac('sha256', salt.toString())
    .update(serverSeed.toString())
    .digest('hex')
}

export function saltHash(gameName: HouseGameName, hash: string) {
  return crypto
    .createHmac('sha256', hash)
    .update(config[gameName].salt)
    .digest('hex')
}

/**
 * Usually used with games where users generate their own clientSeeds or we generate roundSeeds.
 * This is a separate function to preserve the nomenclature in the config.
 */
export function saltWithNewSeed(serverSeed: string, newSeed: string) {
  return crypto
    .createHmac('sha512', newSeed.toString())
    .update(serverSeed.toString())
    .digest('hex')
}

export function saltWithClientSeed(serverSeed: string, clientSeed: string) {
  return crypto
    .createHmac('sha512', serverSeed.toString())
    .update(clientSeed.toString())
    .digest('hex')
}
