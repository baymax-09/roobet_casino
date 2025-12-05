import crypto from 'crypto'
import rp from 'request-promise'

import { scopedLogger } from 'src/system/logger'
import { type Types as UserTypes, updateUser } from 'src/modules/user'
import { getIpsForUserId } from 'src/modules/fraud/geofencing'

import { addPostback } from '../documents/cpa_postbacks'

const adnetworksLogger = scopedLogger('adnetworks')

const offers = [
  {
    isComplete: async (user: UserTypes.User) =>
      !(
        user.hiddenTotalBet < 15 ||
        user.hiddenTotalDeposited < 10 ||
        user.postback?.transactionSource !== 'mxb'
      ),
    makePostback: async (user: UserTypes.User) => {
      if (!user.postback?.transactionId) {
        return false
      }
      const opts = {
        uri: 'https://www.maxbounty.com/lead_nc.asp',
        qs: {
          /* eslint-disable id-length */
          o: '18828',
          r: 'ROO',
          i: `${user.postback.transactionId}`,
          d: `${user.id}`,
          /* eslint-enable id-length */
        },
        json: true,
      }
      const response = await rp(opts)
      return response
    },
  },
  {
    isComplete: async (user: UserTypes.User) =>
      !(
        user.hiddenTotalBet < 10 ||
        user.hiddenTotalDeposited < 15 ||
        user.postback?.transactionSource !== 'adscend'
      ),
    makePostback: async (user: UserTypes.User) => {
      if (!user.postback?.transactionId) {
        return false
      }
      const opts = {
        uri: 'https://adscendmedia.com/pbs2s/s2s.php',
        qs: {
          sid: `${user.postback.transactionId}`,
          adv: '1196',
          key: 'icDPeSTmCHXm35W7',
          comm: '20',
        },
        json: true,
      }
      const response = await rp(opts)
      return response
    },
  },
  {
    isComplete: async (user: UserTypes.User) =>
      !(
        user.hiddenTotalBet < 10 ||
        user.hiddenTotalDeposited < 15 ||
        user.postback?.transactionSource !== 'adgate'
      ),
    makePostback: async (user: UserTypes.User) => {
      if (!user.postback?.transactionId) {
        return false
      }
      const opts = {
        uri: 'http://post.adgatemedia.com/aff_lsr',
        qs: {
          transaction_id: `${user.postback.transactionId}`,
          security_token: '6382d6657c742f0611a675209d7ac4e5',
        },
        json: true,
      }
      const response = await rp(opts)
      return response
    },
  },
  {
    isComplete: async (user: UserTypes.User) =>
      !(
        user.hiddenTotalBet < 10 ||
        user.hiddenTotalDeposited < 15 ||
        user.postback?.transactionSource !== 'offertoro'
      ),
    makePostback: async (user: UserTypes.User) => {
      if (!user.postback?.transactionId) {
        return false
      }
      const opts = {
        uri: 'http://offertoro.go2cloud.org/aff_lsr',
        qs: {
          transaction_id: `${user.postback.transactionId}`,
        },
        json: true,
      }
      const response = await rp(opts)
      return response
    },
  },
  {
    isComplete: async (user: UserTypes.User) =>
      !(
        user.hiddenTotalBet < 10 ||
        user.hiddenTotalDeposited < 15 ||
        user.postback?.transactionSource !== 'cointiply'
      ),
    makePostback: async (user: UserTypes.User) => {
      if (!user.postback?.transactionId) {
        return false
      }
      const transactionId = user.postback.transactionId
      // transactionId will have uid---cid
      const uid = transactionId.split('---')[0]
      const cid = transactionId.split('---')[1]
      const opts = {
        uri: 'https://cointiply.com/api/postbacks/roobet',
        qs: {
          key: '446943C4BG10C47EF98EA6A9DFT7A69B',
          hash: crypto
            .createHash('md5')
            .update(`${uid}-${cid}-${'Ttn5DjpYs6ZgR2lfPh6B9QJNgB1k0kUmtVq'}`)
            .digest('hex'),
          uid,
          cid,
        },
        json: true,
      }
      const response = await rp(opts)
      return response
    },
  },
]

export async function processOffer(user: UserTypes.User) {
  const logger = adnetworksLogger('processOffer', { userId: user.id })

  if (
    !user.postback ||
    user.postback.offerComplete ||
    !user.postback.transactionSource ||
    !user.postback.transactionId
  ) {
    return
  }

  const transactionId = user.postback.transactionId
  const transactionSource = user.postback.transactionSource
  const subId = user.postback.subId

  let postbackFired = false
  for (const offer of offers) {
    const isComplete = await offer.isComplete(user)
    if (isComplete) {
      try {
        await completeOffer(user)
        const success = await offer.makePostback(user)
        if (!success) {
          await updateUser(user.id, {
            postback: {
              offerComplete: false,
            },
          })
          return
        }
        postbackFired = true
      } catch {
        await updateUser(user.id, {
          postback: {
            offerComplete: false,
          },
        })
        return
      }
    }
  }

  if (!postbackFired) {
    return
  }

  let ipAddress
  try {
    const ips = await getIpsForUserId(user.id)
    if (ips.length > 0) {
      ipAddress = ips[0].ip
    }
  } catch (error) {
    logger.error('Tried to get IP postback', {}, error)
  }

  try {
    logger.info('Postback sent.', { transactionId, transactionSource, subId })

    addPostback(
      {
        userId: user.id,
        transactionId,
        transactionSource,
        subId,
        ipAddress,
      },
      {},
    )
  } catch (error) {
    logger.error('Postback Get Request Error:', {}, error)
  }
}

export async function completeOffer(user: UserTypes.User) {
  const update = {
    postback: {
      offerComplete: true,
    },
  }

  await updateUser(user.id, update)
}
