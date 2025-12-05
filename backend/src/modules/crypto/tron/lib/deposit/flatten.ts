import TronWeb from 'tronweb'

import {
  TransferContractV,
  TriggerSmartContractV,
} from 'src/types/tronweb/controls'
import { type Crypto, type CryptoLowercase } from 'src/modules/crypto/types'

import {
  convertHexAddressToBase58,
  derivePoolingWallet,
  derivePrimaryWallet,
} from '../wallet'
import {
  type Transaction,
  TransactionType,
  type TronAddressBase58,
  TRC20TokenAddressMap,
  TronAddressBase58V,
  TronAddressHexV,
} from '../../types'
import { ContractDepositMap, parseDataParams } from './util'

interface ValueDataArgs {
  tronWeb: TronWeb
  transaction: Transaction
  isTRC20FeatureAvailable: boolean
}

type TronCryptoType = Extract<Crypto, 'Tron' | 'Tether' | 'USDC'>
type TronDepositType = Extract<CryptoLowercase, 'tron' | 'tether' | 'usdc'>

export const isRecipientOurWallet = (
  sender: TronAddressBase58,
  recipient: TronAddressBase58,
) => {
  const primaryWalletAddress = derivePrimaryWallet().address
  const poolingWalletAddress = derivePoolingWallet().address
  const isOurWalletReceipient =
    recipient === poolingWalletAddress || recipient === primaryWalletAddress
  const isPoolingWalletSender = sender === poolingWalletAddress
  const isMainWalletSender = sender === primaryWalletAddress

  return {
    isMainWalletSender,
    isPoolingWalletSender,
    isOurWalletReceipient,
  }
}

function getValueDataForTRC20(transaction: Transaction) {
  const { ret, raw_data } = transaction
  const { contract } = raw_data
  const contractAddress = TronWeb.address.fromHex(
    contract[0].parameter.value.contract_address,
  )
  const { data, owner_address } = contract[0].parameter.value
  const tokenInfo = ContractDepositMap[contractAddress]
  if (!contractAddress || !owner_address || !data || !tokenInfo) {
    return undefined
  }

  // check if transaction is successful
  if (ret[0].contractRet !== 'SUCCESS') {
    return undefined
  }

  const result = parseDataParams(data)
  if (!result) {
    return undefined
  }
  const { recipient, value } = result
  const valueNum = value.toNumber()

  const contractInfo = Object.values(TRC20TokenAddressMap).find(
    obj => obj.address === contractAddress,
  )
  const isTronAddress =
    TronAddressHexV.is(recipient) || TronAddressBase58V.is(recipient)
  if (!tokenInfo || !contractInfo || !isTronAddress || valueNum === 0) {
    return undefined
  }

  // technically we should use BigNumber to do the math here, but it does some rounding
  // and its unlikely that these transfer amounts would ever exceed what JS could handle
  const factor = 10 ** contractInfo.decimals
  const rawAmount = value.toNumber() / factor
  return {
    sender: owner_address,
    recipient: convertHexAddressToBase58(recipient),
    rawAmount,
    depositType: tokenInfo.depositType,
    cryptoType: tokenInfo.cryptoType,
  }
}

function getValueDataForTRX(tronWeb: TronWeb, transaction: Transaction) {
  const { raw_data } = transaction
  const { contract } = raw_data

  const recipient = contract[0].parameter.value.to_address
  const amount = contract[0].parameter.value.amount
  const sender = contract[0].parameter.value.owner_address
  if (!recipient || !sender || !amount) {
    return undefined
  }

  const rawAmount = parseFloat(parseFloat(tronWeb.fromSun(amount)).toFixed(6))
  const isTronAddress =
    TronAddressHexV.is(recipient) || TronAddressBase58V.is(recipient)
  if (!isTronAddress) {
    return undefined
  }

  const depositType: TronDepositType = 'tron'
  const cryptoType: TronCryptoType = 'Tron'

  return {
    sender,
    recipient: convertHexAddressToBase58(recipient),
    rawAmount,
    depositType,
    cryptoType,
  }
}

export const getValueData = async ({
  tronWeb,
  transaction,
  isTRC20FeatureAvailable,
}: ValueDataArgs): Promise<
  | {
      depositType: TronDepositType
      cryptoType: TronCryptoType
      recipient: TronAddressBase58
      rawAmount: number
      sender: string
    }
  | undefined
> => {
  const { raw_data } = transaction
  const { contract } = raw_data
  const { type } = contract[0]
  if (type === TransactionType.Transfer && TransferContractV.is(contract[0])) {
    return getValueDataForTRX(tronWeb, transaction)
  }

  if (
    isTRC20FeatureAvailable &&
    type === TransactionType.TRC20 &&
    TriggerSmartContractV.is(contract[0])
  ) {
    return getValueDataForTRC20(transaction)
  }
}
