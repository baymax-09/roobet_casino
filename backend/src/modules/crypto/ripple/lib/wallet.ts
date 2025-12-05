import { Client, Wallet as XrpWallet, type Wallet } from 'xrpl'

import { config } from 'src/system'
import {
  convertCurrencyToUserBalance,
  convertUserBalanceToCurrency,
} from 'src/modules/currency'

import {
  createUserRippleTag,
  getRippleTag,
  getRippleTagByUserId,
} from '../documents/ripple_tags'
import { updateCryptoNonce } from '../../lib/nonce'
import { cryptoLogger } from '../../lib/logger'

interface DestinationTagResult {
  id: string
  destinationAddress: string
  destinationTag: number
  userId: string
  type: 'ripple'
}

export function derivePrimaryWallet(): Wallet {
  return XrpWallet.fromSecret(config.ripple.xrpSecret)
}

export async function getRipplePrimaryWalletBalance(): Promise<{
  xrp: number
  usd: number
}> {
  const xrp = Number(
    await getRippleBalance(derivePrimaryWallet().classicAddress),
  )
  const usd = await convertXrpToUserBalance(xrp)

  return { xrp, usd }
}

export async function createDestinationTag(
  userId: string,
): Promise<DestinationTagResult> {
  let primaryAddr
  let destTag
  let rippleTag
  try {
    primaryAddr = derivePrimaryWallet().classicAddress
    destTag = await updateCryptoNonce('Ripple', config.ripple.xrpDestTagInit)

    rippleTag = await createUserRippleTag({
      userId,
      destinationTag: destTag.nonce,
    })

    return {
      userId,
      destinationTag: rippleTag.destinationTag,
      id: rippleTag._id.toString(),
      destinationAddress: primaryAddr,
      type: 'ripple',
    }
  } catch (error) {
    cryptoLogger('ripple/wallet/createDestinationTag', { userId }).error(
      `Failed to create new destination tag: ${error.message}`,
      { destTag, primaryAddr, rippleTag },
      error,
    )
    throw error
  }
}

export async function getRippleTagForUser(userId: string) {
  const destinationTagDoc = await getRippleTagByUserId(userId)
  if (destinationTagDoc) {
    const primaryAddr = derivePrimaryWallet().classicAddress
    return {
      id: destinationTagDoc._id.toString(),
      destinationTag: destinationTagDoc.destinationTag,
      userId,
      destinationAddress: primaryAddr,
      type: 'ripple',
    }
  }

  const { id, destinationTag, destinationAddress, type } =
    await createDestinationTag(userId)
  return {
    id,
    destinationTag,
    userId,
    destinationAddress,
    type,
  }
}

export async function getRippleWalletByTag(destinationTag: number) {
  const destinationTagDoc = await getRippleTag(destinationTag)
  if (destinationTagDoc) {
    const primaryAddr = derivePrimaryWallet().classicAddress
    return {
      id: destinationTagDoc._id.toString(),
      destinationTag: destinationTagDoc.destinationTag,
      userId: destinationTagDoc.userId,
      destinationAddress: primaryAddr,
      type: 'ripple',
    }
  }
}

export async function convertXrpToUserBalance(amount: number): Promise<number> {
  const xrpBaseConversion = await convertCurrencyToUserBalance(amount, 'xrp')
  return parseFloat(xrpBaseConversion.toFixed(6))
}

export async function convertUserBalanceToXrp(amount: number): Promise<number> {
  return parseFloat(
    (await convertUserBalanceToCurrency(amount, 'xrp')).toFixed(6),
  )
}

export async function getRippleBalance(address: string): Promise<string> {
  const client = new Client(config.ripple.wsProvider)
  await client.connect()

  try {
    const balance = await client.getXrpBalance(address)
    return balance
  } catch (error) {
    cryptoLogger('ripple/wallet/getRippleBalance', { userId: null }).error(
      'Failed to get xrp balance',
      { address },
      error,
    )
    throw error
  } finally {
    await client.disconnect()
  }
}
