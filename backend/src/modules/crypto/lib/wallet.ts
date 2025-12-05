import Web3 from 'web3'

import { exists } from 'src/util/helpers/types'
import { createEthereumWallet } from 'src/modules/crypto/ethereum/lib/wallet'
import { deriveLitecoinWalletAddress } from 'src/modules/crypto/litecoin/lib'
import { deriveDogecoinWalletAddress } from 'src/modules/crypto/dogecoin'
import { deriveBitcoinWalletAddress } from 'src/modules/crypto/bitcoin'
import {
  createDestinationTag,
  derivePrimaryWallet,
} from 'src/modules/crypto/ripple/lib'
import { createTronUserWallet } from 'src/modules/crypto/tron/lib'

import {
  createUserWallet as createBlockioUserWallet,
  getUserWallet as getBlockioWalletByUserIdMongo,
  getWalletForAddressAndType as getBlockioWalletForAddressAndType,
  getWalletByAddress as getBlockioWalletByAddressMongo,
  getUserWallets as getBlockioWallets,
  type BlockioWallet,
} from '../documents/blockio_wallets'
import {
  updateUserWalletByAddress as updateEthereumWalletByAddress,
  getWalletByAddress as getEthereumWalletByAddress,
  getWalletByUserId as getEthereumWalletByUserIdMongo,
} from '../ethereum/documents/ethereum_wallets'
import { getRippleTagByUserId } from '../ripple/documents/ripple_tags'
import { getTronWalletForUser } from '../tron/lib/wallet'
import {
  isBlockioCryptoProperName,
  type BlockioCryptoProperName,
  type Crypto,
  type IUserWallet,
  type CryptoNetwork,
} from '../types'
import { isEthereumCryptoProperName } from '../ethereum/types'

async function createBlockioWallet(
  userId: string,
  crypto: BlockioCryptoProperName,
) {
  let address = ''

  if (crypto === 'Bitcoin') {
    address = await deriveBitcoinWalletAddress(userId)
  }

  if (crypto === 'Litecoin') {
    address = await deriveLitecoinWalletAddress(userId)
  }

  if (crypto === 'Dogecoin') {
    address = await deriveDogecoinWalletAddress(userId)
  }

  const wallet = {
    address,
    userId,
    type: crypto,
  }

  return await createBlockioUserWallet(wallet)
}

/**
 * @deprecated in favor of GQL fields
 * @todo replace with GQL fields on the user object type
 */
export async function createUserWallet(
  userId: string,
  network: CryptoNetwork,
): Promise<IUserWallet> {
  // TODO BD this map type is incorrect
  // eslint-disable-next-line @typescript-eslint/ban-types
  const actionMap: Record<CryptoNetwork, Function> = {
    Bitcoin: (userId: string) => createBlockioWallet(userId, 'Bitcoin'),
    Ethereum: createEthereumWallet,
    Litecoin: (userId: string) => createBlockioWallet(userId, 'Litecoin'),
    Ripple: createDestinationTag,
    Dogecoin: (userId: string) => createBlockioWallet(userId, 'Dogecoin'),
    Tron: createTronUserWallet,
  }

  return await actionMap[network](userId)
}

export async function getUserWallet(userId: string, type: Crypto) {
  if (isEthereumCryptoProperName(type)) {
    return await getEthereumWalletByUserIdMongo(userId)
  } else if (isBlockioCryptoProperName(type)) {
    return await getBlockioWalletByUserIdMongo(userId, type)
  } else if (type === 'Tron') {
    return await getTronWalletForUser(userId)
  }
}

export async function updateEthereumWallet(address: string, update: object) {
  await updateEthereumWalletByAddress(address, update)
}

export async function getEthereumWallet(address: string) {
  return await getEthereumWalletByAddress(address)
}

export async function getBlockioWallet(
  address: string,
  type: BlockioCryptoProperName,
) {
  return await getBlockioWalletForAddressAndType(address, type)
}

export async function getBlockioWalletByAddress(address: string) {
  return await getBlockioWalletByAddressMongo(address)
}

export async function fetchBlockioOrEthereumWallet(address: string) {
  const validEthereumAddress = Web3.utils.isAddress(address)

  if (validEthereumAddress) {
    return await getEthereumWallet(address)
  }

  const blockioWallet = await getBlockioWalletByAddress(address)
  if (blockioWallet) {
    return blockioWallet
  }

  return null
}

export async function getEthereumWalletByUserId(userId: string) {
  return await getEthereumWalletByUserIdMongo(userId)
}

export async function getBlockioWalletByUserId(
  userId: string,
  type: BlockioCryptoProperName,
): Promise<BlockioWallet | undefined> {
  return await getBlockioWalletByUserIdMongo(userId, type)
}

export async function fetchBlockioOrEthereumWalletByUserId(
  userId: string,
  type: Crypto,
) {
  if (isEthereumCryptoProperName(type)) {
    return await getEthereumWalletByUserId(userId)
  } else if (isBlockioCryptoProperName(type)) {
    return await getBlockioWalletByUserId(userId, type)
  }
}

export async function getAllWalletsForUser(userId: string) {
  const blockioWallets = await getBlockioWallets(userId)
  const ethereumWallet = await getEthereumWalletByUserId(userId)
  const rippleWallet = derivePrimaryWallet().classicAddress
  const rippleTag = await getRippleTagByUserId(userId)
  const tronWallet = await getTronWalletForUser(userId)

  const userWallets = [
    ...blockioWallets,
    ethereumWallet && { ...ethereumWallet, type: 'Ethereum' },
    rippleWallet &&
      rippleTag && {
        wallet: rippleWallet,
        tag: rippleTag.destinationTag,
        type: 'Ripple',
      },
    tronWallet && {
      address: tronWallet.address,
      type: 'Tron',
    },
  ].filter(exists)

  return userWallets
}
