import { BigNumber } from '@ethersproject/bignumber'

import { type Crypto, type CryptoLowercase } from 'src/modules/crypto/types'
import { scopedLogger } from 'src/system/logger'

import { TRC20TokenAddressMap, type TronAddressBase58 } from '../../types'
import { useAbiDecoder } from '../../util/useAbiDecoder'
import { fromHex } from '../../util/address'

type TronCryptoType = Extract<Crypto, 'Tron' | 'Tether' | 'USDC'>
type TronDepositType = Extract<CryptoLowercase, 'tron' | 'tether' | 'usdc'>

const tronLogger = scopedLogger('tron-deposit-util')

export const ContractDepositMap: Record<
  string,
  { depositType: TronDepositType; cryptoType: TronCryptoType }
> = {
  [TRC20TokenAddressMap.usdt.address]: {
    depositType: 'tether',
    cryptoType: 'Tether',
  },
  [TRC20TokenAddressMap.usdc.address]: {
    depositType: 'usdc',
    cryptoType: 'USDC',
  },
}

export const parseDataParams = (
  data: string,
): { recipient: TronAddressBase58; value: BigNumber } | undefined => {
  const logger = tronLogger('parseDataParams', { userId: null })
  const { decodeDataParam, isValidMethod } = useAbiDecoder()
  if (!isValidMethod(data)) {
    return undefined
  }

  try {
    const result = decodeDataParam(data)
    if (!result.success) {
      logger.error('failed to decode data params', { data }, result.error)
      return undefined
    }

    return {
      recipient: fromHex(result.result.decodedInput.to) as TronAddressBase58,
      value: BigNumber.from(result.result.decodedInput.value),
    }
  } catch (error) {
    logger.error('unknown error when parsing data params', { data }, error)
    return undefined
  }
}
