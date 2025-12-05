import TronWeb from 'tronweb'
import { BigNumber } from '@ethersproject/bignumber'

import { config } from 'src/system'
import { scopedLogger } from 'src/system/logger'

import {
  convertCurrencyToUserBalance,
  convertUserBalanceToCurrency,
} from 'src/modules/currency'
import {
  getProvider,
  getTRC20ContractProvider,
  getProviderForTrxTransactionSignatures,
} from 'src/modules/crypto/tron/util/getProvider'

import {
  type TronWallet,
  type TRC20Token,
  type TronAddressHex,
  type TronAddressBase58,
  type TronStakeMode,
  type TronFrozenAsset,
  type AccountStakeResource,
  TransactionType,
  TRC20TokenAddressMap,
} from '../types'
import { type IOResult } from '../../types'

import {
  createUserTronWallet,
  getTronWallet,
  getTronWalletByUserId,
} from '../documents/tron_wallets'
import { updateCryptoNonce } from '../../lib/nonce'
import { fromHex } from '../util/address'

type TronAddress = TronAddressBase58 | TronAddressHex

const tronWalletLogger = scopedLogger('TronUserWallet')

const formatPrivateKey = (privateKey: string): string => {
  if (privateKey.startsWith('0x')) {
    return privateKey.substring(2)
  } else {
    return privateKey
  }
}

export const convertHexAddressToBase58 = (
  address: TronAddress,
): TronAddressBase58 => fromHex(address) as TronAddressBase58

export function deriveTronUserWallet(index: number): {
  address: TronAddressBase58
  privateKey: string
} {
  try {
    const tronWeb = getProvider()
    // use the same mnemonic for ethereum user wallets
    const { address, privateKey } = tronWeb.fromMnemonic(
      config.tron.userWalletMnemonic,
      `m/44'/195'/0'/0/${index}`,
    )
    return { address, privateKey: formatPrivateKey(privateKey) }
  } catch (error) {
    throw new Error(`Invalid private key generated with addressIndex ${index}`)
  }
}

export function derivePrimaryWallet(): {
  address: TronAddressBase58
  privateKey: string
} {
  const tronWeb = new TronWeb({
    fullHost: config.tron.httpProvider,
  })
  const { address, privateKey } = tronWeb.fromMnemonic(
    config.tron.mainWalletMnemonic,
    `m/44'/195'/0'/0/${config.tron.mainWalletIndex}`,
  )

  return { address, privateKey: formatPrivateKey(privateKey) }
}

export function derivePoolingWallet(): {
  address: TronAddressBase58
  privateKey: string
} {
  const tronWeb = new TronWeb({
    fullHost: config.tron.httpProvider,
  })
  const { address, privateKey } = tronWeb.fromMnemonic(
    config.tron.pooling.poolingMnemonic,
    `m/44'/195'/0'/0/${config.tron.pooling.poolingIndex}`,
  )

  return { address, privateKey: formatPrivateKey(privateKey) }
}

export async function getTronPrimaryWalletBalance(): Promise<{
  trx: number
  usd: number
}> {
  return await getTrxBalance(derivePrimaryWallet().address)
}

export async function getTronPoolingWalletBalance(): Promise<{
  trx: number
  usd: number
}> {
  return await getTrxBalance(derivePoolingWallet().address)
}

export async function createTronUserWallet(
  userId: string,
): Promise<TronWallet> {
  try {
    const { nonce } = await updateCryptoNonce('Tron', config.tron.trxNonceInit)
    const { address } = deriveTronUserWallet(nonce)
    const newWallet = {
      nonce,
      address,
      userId,
    }
    const tronWallet = await createUserTronWallet(newWallet)
    return {
      ...newWallet,
      id: tronWallet._id.toString(),
      type: 'Tron',
    }
  } catch (error) {
    tronWalletLogger('creation', { userId }).error(
      'Tron Wallet creation failed',
      {},
      error,
    )
    throw error
  }
}

export async function getTronWalletForUser(
  userId: string,
): Promise<TronWallet | null> {
  const wallet = await getTronWalletByUserId(userId)
  if (!wallet) {
    return null
  }

  return {
    ...wallet,
    type: 'Tron',
    id: wallet._id.toString(),
  }
}

export async function getTronWalletByAddress(
  address: TronAddress,
): Promise<TronWallet | null> {
  const addressFormatted = convertHexAddressToBase58(address)
  const wallet = await getTronWallet(addressFormatted)
  if (!wallet) {
    return null
  }

  return {
    ...wallet,
    type: 'Tron',
    id: wallet._id.toString(),
  }
}

export async function convertTrxToUserBalance(amount: number): Promise<number> {
  const trxBaseConversion = await convertCurrencyToUserBalance(amount, 'trx')
  return parseFloat(trxBaseConversion.toFixed(6))
}

export async function convertUserBalanceToTrx(amount: number): Promise<number> {
  const trxBaseConversion = await convertUserBalanceToCurrency(amount, 'trx')
  return parseFloat(trxBaseConversion.toFixed(6))
}

// TODO refactor this -- it is not ALWAYS the case that we want to convert to USD
export async function getTrxBalance(address: TronAddress): Promise<{
  trx: number
  usd: number
}> {
  try {
    const tronWeb = getProvider()
    const { balance } = await tronWeb.trx.getAccount(address)
    const trx = parseFloat(tronWeb.fromSun(balance))
    const usd = await convertTrxToUserBalance(trx)

    return { trx, usd }
  } catch (error) {
    tronWalletLogger('accountBalance', { userId: null }).error(
      'failed to get trx balance',
      { address },
      error,
    )
    throw error
  }
}

export async function getTRC20Allowance(
  owner: TronAddressBase58,
  spender: TronAddressBase58,
  index: number,
  token: TRC20Token,
): Promise<number> {
  try {
    const { decimals } = TRC20TokenAddressMap[token]
    const { contract } = await getTRC20ContractProvider(index, token)
    // result is BigNumber with a hex string value
    const [tokenAllowanceBN] = await contract.methods
      .allowance(owner, spender)
      .call()
    if (!BigNumber.isBigNumber(tokenAllowanceBN)) {
      const message = 'unexpected result type'
      tronWalletLogger('accountBalance', { userId: null }).error(message, {
        result: tokenAllowanceBN,
      })
      throw message
    }

    const factor = 10 ** decimals
    return tokenAllowanceBN.div(factor).toNumber()
  } catch (error) {
    tronWalletLogger('accountBalance', { userId: null }).error(
      'failed to get trc-20 balance',
      { owner, spender },
      error,
    )
    throw error
  }
}

/** returns balance denominated in the specified token */
export async function getTRC20Balance(
  address: TronAddress,
  index: number,
  token: TRC20Token,
): Promise<number> {
  try {
    const { decimals } = TRC20TokenAddressMap[token]
    const { contract } = await getTRC20ContractProvider(index, token)
    // result is BigNumber with a hex string value
    const tokenBalanceBN = await contract.methods.balanceOf(address).call()
    if (!BigNumber.isBigNumber(tokenBalanceBN)) {
      const message = 'unexpected result type'
      tronWalletLogger('accountBalance', { userId: null }).error(message, {
        result: tokenBalanceBN,
      })
      throw message
    }

    const factor = 10 ** decimals
    return tokenBalanceBN.div(factor).toNumber()
  } catch (error) {
    tronWalletLogger('accountBalance', { userId: null }).error(
      'failed to get trc-20 balance',
      { address },
      error,
    )
    throw error
  }
}

export async function stakeTrxBalance(
  address: TronAddressBase58,
  privateKey: string,
  amount: number,
  asset: TronFrozenAsset,
  mode: TronStakeMode,
): Promise<IOResult<boolean, Error>> {
  try {
    const poolingWallet = getProviderForTrxTransactionSignatures(privateKey)
    const tx =
      mode === 'freeze'
        ? await poolingWallet.transactionBuilder.freezeBalanceV2(
            amount,
            asset,
            address,
            { visible: true },
          )
        : await poolingWallet.transactionBuilder.unfreezeBalanceV2(
            amount,
            asset,
            address,
            { visible: true },
          )

    const signed = await poolingWallet.trx.sign(tx, privateKey)
    const {
      result,
      transaction: {
        raw_data: { contract },
      },
    } = await poolingWallet.trx.sendRawTransaction(signed)

    if (
      result &&
      (contract[0].type === TransactionType.Freeze ||
        contract[0].type === TransactionType.Unfreeze)
    )
      return {
        success: true,
        result: true,
        error: undefined,
      }
    else {
      return {
        success: false,
        result: undefined,
        error: Error('Can not proceed staking/unstaking'),
      }
    }
  } catch (error) {
    return {
      success: false,
      result: undefined,
      error: Error(error),
    }
  }
}

export async function getAccountResources(): Promise<
  IOResult<AccountStakeResource, Error>
> {
  const provider = getProvider()

  try {
    const { address } = derivePoolingWallet()
    const accountData = await provider.trx.getAccount(address)

    let bandwidthAmount = 0
    let energyAmount = 0
    accountData?.frozenV2?.forEach(
      (item: { amount?: number; type?: 'ENERGY' | 'TRON_POWER' }) => {
        if (item?.type === 'ENERGY' && item?.amount) {
          energyAmount = item?.amount
        }
        if (item?.type !== 'ENERGY' && item?.amount) {
          bandwidthAmount = item?.amount
        }
      },
    )

    const resource = await provider.trx.getAccountResources(address)

    return {
      success: true,
      result: {
        energyAmount,
        bandwidthAmount,
        unFrozen: accountData?.unfrozenV2 ?? [],
        netLimit: resource?.NetLimit ?? 0,
        energyLimit: resource?.EnergyLimit ?? 0,
      },
      error: undefined,
    }
  } catch (error) {
    return { success: false, result: undefined, error }
  }
}
