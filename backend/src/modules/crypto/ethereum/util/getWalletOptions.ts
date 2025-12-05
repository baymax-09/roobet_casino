import { config } from 'src/system'
import { type Signer } from '../types'

/**
 * Helper function to get the appropriate HDWalletProvider constructor arguments
 * for the given signer
 * @param signer | Signer object
 * @returns HDWalletProvider constructor arguments
 */
export function getWalletOptions(signer: Signer) {
  const { wallet, walletIndex } = signer
  return {
    mnemonic:
      wallet === 'main' ? config.ethereum.ethSecret : config.ethereum.mnemonic,
    providerOrUrl: config.ethereum.httpProvider,
    addressIndex: walletIndex ?? config.ethereum.ethSecretIndex,
  }
}
