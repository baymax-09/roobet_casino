import Web3 from 'web3'
import type Web3Type from 'web3'
import { type Transaction, type Log } from 'web3-core'

import { getEthereumWallet } from 'src/modules/crypto/lib/wallet'
import { cryptoConversionMap } from 'src/modules/crypto/lib'
import { createUniqueDepositId } from 'src/modules/deposit/lib/util'
import { getUserById } from 'src/modules/user'
import { type CryptoDepositType } from 'src/modules/deposit/types'
import { config } from 'src/system'

import { type EthereumDeposit } from '../types/'
import { type Crypto } from '../../types'
import { type EtherscanInternalTransaction } from '../lib/etherscan'
import { ERC20Map, ERC20MapGoerli, type ERC20TokenData } from '.'
import { derivePrimaryEthWalletAddress } from '..'

export const getERC20Map = () => {
  if (!config.isProd) {
    return ERC20MapGoerli
  }

  return ERC20Map
}

function getSupportedERC20Tokens() {
  return Object.values(getERC20Map()).reduce(
    (acc: Record<string, ERC20TokenData>, tokenData) => {
      acc[tokenData.contractAddress] = tokenData
      return acc
    },
    {},
  )
}

interface GetDepositArgs {
  amount: string
  cryptoType: Crypto
  decimals: number
  from: string
  to: string
  transactionHash: string
  type: CryptoDepositType
}

async function getDeposit({
  amount,
  cryptoType,
  decimals,
  from,
  to,
  transactionHash,
  type,
}: GetDepositArgs) {
  const poolingAddress = await derivePrimaryEthWalletAddress()

  // if the deposit is coming from the pooling address, we don't want to process it
  if (from.toLowerCase() === poolingAddress.toLowerCase()) {
    return null
  }

  const wallet = await getEthereumWallet(to)
  if (!wallet) {
    return null
  }

  const user = await getUserById(wallet.userId)
  if (!user) {
    return null
  }

  const depositId = createUniqueDepositId(wallet.id, type, transactionHash)

  const depositAmount = parseInt(amount) / 10 ** decimals
  const depositAmountUSD = await cryptoConversionMap[cryptoType](depositAmount)

  if (depositAmountUSD < 0.05) {
    return null
  }

  return { wallet, user, depositId, depositAmountUSD }
}

async function getErc20Deposits(
  web3: Web3Type,
  transaction: Transaction,
  logs: Log[],
): Promise<EthereumDeposit[]> {
  const deposits: EthereumDeposit[] = []
  const transferEvent = web3.eth.abi.encodeEventSignature(
    'Transfer(address,address,uint256)',
  )

  for (const log of logs) {
    const { topics, address, data } = log

    const erc20Tokens = getSupportedERC20Tokens()

    if (!Object.keys(erc20Tokens).includes(address)) {
      continue
    }

    const { decimals, depositType, cryptoType } = erc20Tokens[address]

    if (topics[0] === transferEvent) {
      const to = web3.eth.abi.decodeParameter(
        'address',
        topics[2],
      ) as unknown as string
      const from = web3.eth.abi.decodeParameter(
        'address',
        topics[1],
      ) as unknown as string
      const value: string = web3.utils.hexToNumberString(data)

      // ignore valueless transfers and transfers to pooling address
      if (!value) {
        continue
      }

      const deposit = await getDeposit({
        amount: value,
        cryptoType,
        decimals,
        from,
        to,
        transactionHash: transaction.hash,
        type: depositType,
      })

      if (!deposit) {
        continue
      }

      const { wallet, user, depositId, depositAmountUSD } = deposit

      deposits.push({
        cryptoType,
        currency: 'usd',
        depositAmountUSD,
        depositId,
        depositType,
        externalId: transaction.hash,
        meta: {
          toAddress: to,
          txHash: transaction.hash,
        },
        user,
        wallet,
        recipientId: wallet.address,
      })
    }
  }

  return deposits
}

async function getEthereumDeposits(
  transaction: Transaction | EtherscanInternalTransaction,
): Promise<EthereumDeposit[]> {
  const deposits: EthereumDeposit[] = []

  if (
    !transaction.to ||
    !transaction.blockNumber ||
    transaction.value === '0'
  ) {
    return deposits
  }

  const to = Web3.utils.toChecksumAddress(transaction.to)
  const from = Web3.utils.toChecksumAddress(transaction.from)

  const deposit = await getDeposit({
    amount: transaction.value.toString(),
    cryptoType: 'Ethereum',
    decimals: 18,
    from,
    to,
    transactionHash: transaction.hash,
    type: 'ethereum',
  })

  if (!deposit) {
    return deposits
  }

  const { wallet, user, depositId, depositAmountUSD } = deposit

  deposits.push({
    cryptoType: 'Ethereum',
    currency: 'usd',
    depositAmountUSD,
    depositId,
    depositType: 'ethereum',
    externalId: transaction.hash,
    meta: {
      toAddress: to,
      txHash: transaction.hash,
    },
    user,
    wallet,
    recipientId: wallet.address,
  })

  return deposits
}

export { getEthereumDeposits, getErc20Deposits }
