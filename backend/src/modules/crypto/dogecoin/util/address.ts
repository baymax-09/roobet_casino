import bitcoin from 'bitcoinjs-lib'
import { type ECPair } from 'ecpair'

import { exists } from 'src/util/helpers/types'
import { scopedLogger } from 'src/system/logger'

import {
  ChainCodeTypes,
  type ChainCodeType,
  type AddressType,
  type DogecoinNetworkInfo,
  type DogecoinTestNetworkInfo,
  AddressTypes,
} from './constants'
import { generateExtendedPublicKey, getKeyAtPath } from './keys'

type Network = DogecoinNetworkInfo | DogecoinTestNetworkInfo

interface AddressOutput {
  payment: bitcoin.payments.Payment
  addressType: AddressType
  chainCodeType: ChainCodeType
  primaryKey: ECPair
}

interface P2MSOptions {
  m: 2
  pubkeys: Buffer[]
  network: Network
}

const dogecoinLogger = scopedLogger('dogecoin-address')
const logger = dogecoinLogger('util', { userId: null })

function getP2MSOptions(
  primaryKey: ECPair,
  extendedPublicKey: string,
  network: Network,
): P2MSOptions {
  const publicKeys = [
    primaryKey.publicKey,
    Buffer.from(extendedPublicKey, 'hex'),
  ]

  return {
    m: 2,
    pubkeys: publicKeys,
    network,
  }
}

function generateAddressOutput(options: P2MSOptions): bitcoin.payments.Payment {
  /** P2SH addresses are exactly 34 characters in length, and they begin with a prefix of 3, as specified by BIP 13. */
  return bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2ms(options),
  })
}

function generateAddresses(
  addressType: AddressType,
  network: Network,
  index: number,
): AddressOutput | [AddressOutput, AddressOutput] | undefined {
  // generates P2SH, P2WSH-P2SH, or WITNESS_V0 addresses

  const extendedPublicKey = generateExtendedPublicKey(network)
  const outputs = []

  for (const chainCodeType of ChainCodeTypes) {
    // get addresses with both standard and non-standard chain codes

    const primaryKey = getKeyAtPath(network, index, chainCodeType)
    if (!primaryKey) {
      logger.error('No private key could be derived', {
        network,
        index,
        chainCodeType,
      })
      return
    }

    const options = getP2MSOptions(primaryKey, extendedPublicKey, network)
    const output = generateAddressOutput(options)

    if (!output) {
      logger.error('No output could be derived', { options })
      return
    }

    outputs.push({
      payment: output,
      addressType,
      chainCodeType,
      primaryKey,
    })
  }

  if (
    outputs[0].primaryKey.publicKey.toString('hex') ===
    outputs[1].primaryKey.publicKey.toString('hex')
  ) {
    // remove duplicate if standard and non-standard derivations match
    return outputs[0]
  }

  return [outputs[0], outputs[1]]
}

export function determineAddressOutput(
  address: string,
  network: Network,
  index: number,
): AddressOutput | undefined {
  return AddressTypes.map(type => {
    const outputs = generateAddresses(type, network, index)
    if (!outputs) {
      return undefined
    }

    return outputs
  })
    .flat()
    .filter(exists)
    .find(output => output.payment.address === address)
}

/** Only create addresses in P2WSH (aka WITNESS_V0) format */
export function createNewAddress(
  network: Network,
  index: number,
):
  | { output: bitcoin.payments.Payment; address: string | undefined }
  | undefined {
  const chainCodeType: ChainCodeType = 'standard'
  const extendedPublicKey = generateExtendedPublicKey(network)
  const primaryKey = getKeyAtPath(network, index, chainCodeType)
  if (!primaryKey) {
    logger.error('No private key could be derived', {
      network,
      index,
      chainCodeType,
    })
    return
  }
  const options = getP2MSOptions(primaryKey, extendedPublicKey, network)
  const output = generateAddressOutput(options)
  if (!output) {
    logger.error('No output could be derived', { options })
    return
  }

  return {
    output,
    address: output.address,
  }
}
