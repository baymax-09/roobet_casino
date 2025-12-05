import { type Request } from 'express'
type ReqBody = Request['body']

function extractBasicFields<T extends Readonly<string[]>>(
  requestWithDefaults: Record<string, any>,
  fieldsToExtract: T,
): Record<T[number], any> {
  const extracted: Record<string, any> = {}
  for (const field of fieldsToExtract) {
    extracted[field] = requestWithDefaults[field]
      ? requestWithDefaults[field][0]
      : null
  }
  return extracted
}

export const authenticate = (body: ReqBody) => {
  const { authenticate } = body
  const defaults = {
    ticket: null,
    username: null,
  }

  const requestWithDefaults = {
    ...defaults,
    ...authenticate,
  }
  const fieldsToExtract = [
    'ticket',
    'username',
    'password',
    'extra',
    'productid',
    'client',
    'cid',
    'clientip',
    'contextid',
    'accesstoken',
    'language',
    'gameid',
    'channel',
  ] as const
  const extracted = extractBasicFields<typeof fieldsToExtract>(
    requestWithDefaults,
    fieldsToExtract,
  )
  return {
    ...extracted,
  }
}

export const balance = (body: ReqBody) => {
  const { balance } = body
  const defaults = {}

  const requestWithDefaults = {
    ...defaults,
    ...balance,
  }
  const fieldsToExtract = [
    'externalid',
    'productid',
    'currency',
    'gameid',
    'accesstoken',
    'externalgamesessionid',
    'channel',
  ] as const
  const extracted = extractBasicFields<typeof fieldsToExtract>(
    requestWithDefaults,
    fieldsToExtract,
  )
  return {
    ...extracted,
  }
}

export const reserve = (body: ReqBody) => {
  const { reserve } = body
  const defaults = {
    jackpots: [{ jackpot: [] }],
  }

  const requestWithDefaults = {
    ...defaults,
    ...reserve,
  }
  const fieldsToExtract = [
    'externalid',
    'productid',
    'transactionid',
    'real',
    'currency',
    'gameid',
    'gamesessionid',
    'contextid',
    'accesstoken',
    'roundid',
    'externalgamesessionid',
    'channel',
    'freegameexternalid',
    'actualvalue',
  ] as const
  const extracted = extractBasicFields<typeof fieldsToExtract>(
    requestWithDefaults,
    fieldsToExtract,
  )
  return {
    ...extracted,
    jackpots: requestWithDefaults.jackpots[0].jackpot.map(
      // @ts-expect-error TODO add more types based on playngo docs
      ({ id: [id], loss: [loss] }) => ({ id, loss }),
    ),
  }
}

export const cancelReserve = (body: ReqBody) => {
  const { cancelreserve } = body
  const defaults = {
    jackpots: [{ jackpot: [] }],
  }

  const requestWithDefaults = {
    ...defaults,
    ...cancelreserve,
  }
  const fieldsToExtract = [
    'externalid',
    'productid',
    'transactionid',
    'real',
    'currency',
    'gamesessionid',
    'accesstoken',
    'roundid',
    'gameid',
    'externalgamesessionid',
    'channel',
    'freegameexternalid',
    'actualvalue',
  ] as const
  const extracted = extractBasicFields<typeof fieldsToExtract>(
    requestWithDefaults,
    fieldsToExtract,
  )
  return {
    ...extracted,
    jackpots: requestWithDefaults.jackpots[0].jackpot.map(
      // @ts-expect-error TODO add more types based on playngo docs
      ({ id: [id], loss: [loss] }) => ({ id, loss }),
    ),
  }
}

export const release = (body: ReqBody) => {
  const { release } = body
  const defaults = {
    jackpots: [{ jackpot: [] }],
  }

  const requestWithDefaults = {
    ...defaults,
    ...release,
  }

  const fieldsToExtract = [
    'externalid',
    'productid',
    'transactionid',
    'real',
    'currency',
    'gamesessionid',
    'contextid',
    'state',
    'type',
    'gameid',
    'accesstoken',
    'roundid',
    'jackpotgain',
    'jackpotloss',
    'jackpotgainid',
    'jackpotgainseed',
    'freegameexternalid',
    'turnover',
    'freegamefinished',
    'externalgamesessionid',
    'channel',
    'jackpots',
    'freegametotalgain',
    'freegameloss',
    'totalgain',
    'totalloss',
    'numrounds',
  ] as const
  const extracted = extractBasicFields<typeof fieldsToExtract>(
    requestWithDefaults,
    fieldsToExtract,
  )
  return {
    ...extracted,
    jackpots: requestWithDefaults.jackpots[0].jackpot.map(
      // @ts-expect-error TODO add more types based on playngo docs
      ({ id: [id], win: [win] }) => ({ id, win }),
    ),
  }
}
