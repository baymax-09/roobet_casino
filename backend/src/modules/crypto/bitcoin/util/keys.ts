import ecpair from 'ecpair'
import { BIP32Factory } from 'bip32'
import ecc from 'tiny-secp256k1'

import { config } from 'src/system'

import {
  type ChainCodeType,
  derivationPath,
  type BitcoinNetworkInfo,
  type BitcoinTestNetworkInfo,
} from './constants'

type Network = BitcoinNetworkInfo | BitcoinTestNetworkInfo

const bip32PrivateKey = config.bitcoin.privateKey

export function generateExtendedPublicKey(network: Network) {
  return ecpair.ECPair.fromWIF(bip32PrivateKey, network).publicKey.toString(
    'hex',
  )
}

export function getKeyAtPath(
  network: Network,
  index: number,
  chainCodeType: ChainCodeType,
) {
  // returns the key object at a given path

  const pathParts = derivationPath.split('/')

  // m
  const bip32 = BIP32Factory(ecc)
  const extendedKey = bip32.fromBase58(bip32PrivateKey, network)

  if (chainCodeType === 'nonstandard') {
    extendedKey.chainCode = Buffer.from(
      extendedKey.chainCode.toString('hex').replace(/^(00)+/, ''),
      'hex',
    )
  }

  // m/i
  const child = extendedKey.derive(
    pathParts[1] === 'i' ? index : parseInt(pathParts[1]),
  )

  if (chainCodeType === 'nonstandard') {
    child.chainCode = Buffer.from(
      child.chainCode.toString('hex').replace(/^(00)+/, ''),
      'hex',
    )
  }

  // m/i/j
  const leaf = child.derive(
    pathParts[2] === 'i' ? index : parseInt(pathParts[2]),
  )
  if (!leaf.privateKey) {
    return undefined
  }

  return ecpair.ECPair.fromPrivateKey(leaf.privateKey, { network })
}
