import bip39 from 'bip39'
import { hdkey } from 'ethereumjs-wallet'

import { config } from 'src/system'
import { BasicCache } from 'src/util/redisModels'
import { deriveEthWalletAddress } from 'src/modules/crypto/ethereum'

import { updateCryptoNonce } from '../../lib/nonce'
import { cryptoLogger } from '../../lib/logger'
import {
  getLatestWallet,
  createUserWallet,
} from '../documents/ethereum_wallets'

const walletHDPath = "m/44'/60'/0'/0/"

async function getMaxEthereumNonce(): Promise<number> {
  try {
    const fromCache = await BasicCache.get('maxWalletId', '')
    if (fromCache) {
      return fromCache
    }
    const maxWallet = await getLatestWallet()
    const mongoMaxWalletNum = maxWallet ? maxWallet[0].nonce : 0
    return mongoMaxWalletNum
  } catch (error) {
    cryptoLogger('ethereum/getMaxEthereumNonce', { userId: null }).error(
      `User Wallet failed to fetch max nonce - ${error.message}`,
      error,
    )
    return 0
  }
}

export async function createEthereumWallet(userId: string) {
  // this cached nonce is temporary and can be removed in any future PR
  // the cached nonce will only be used the first time this function runs
  const cachedNonce = await getMaxEthereumNonce()

  const { nonce } = await updateCryptoNonce('Ethereum', cachedNonce + 1)
  const address = await deriveEthWalletAddress(nonce)
  const walletInsert = {
    nonce,
    type: 'Ethereum',
    address,
    userId,
    hasBalance: false,
  }

  // this cached nonce is temporary and can be removed in any future PR
  await BasicCache.set('maxWalletId', '', nonce, 60 * 60 * 24)

  return await createUserWallet(walletInsert)
}

export async function getKeysForUserWallet(index: number) {
  const mnemonic = config.ethereum.mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic)
  const hdwallet = hdkey.fromMasterSeed(seed)

  const wallet = hdwallet.derivePath(walletHDPath + index).getWallet()
  const address = '0x' + wallet.getAddress().toString('hex')
  const privateKey = wallet.getPrivateKey().toString('hex')

  return {
    address,
    privateKey,
  }
}
