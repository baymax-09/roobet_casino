import Web3 from 'web3'
import { toBN } from 'web3-utils'

import { config } from 'src/system'

import { getERC20Config } from '..'
import { erc20ABI } from '../abi/erc20'
import {
  Process,
  type ApproveERC20Message,
  type FundETHMessage,
  type PoolingMessage,
  type ERC20Token,
  type EthereumWallet,
} from '../../types'
import { getERC20Balance } from '../balance'

const MAX_UINT = toBN(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
)
const { erc20: erc20Gas, standard: standardGas } = config.ethereum.gasLimit

interface BuildFundMessageArgs {
  token: ERC20Token
  userWalletAddress: string
  fromWallet: string
  amount: string
}

interface BuildApprovalMessageArgs {
  token: ERC20Token
  userWallet: EthereumWallet
  walletToApprove: string
}

interface BuildPoolMessageArgs<T = ERC20Token> {
  token: T
  userWalletAddress: string
  mainWalletAddress: string
}

export function buildFundingMessage({
  token,
  userWalletAddress,
  fromWallet,
  amount,
}: BuildFundMessageArgs): FundETHMessage {
  return {
    tx: {
      from: fromWallet,
      gas: standardGas,
      to: userWalletAddress,
      value: amount,
    },
    process: Process.FUND_ETH,
    signer: {
      wallet: 'main',
    },
    walletAddress: userWalletAddress,
    token,
  }
}

export function buildApprovalMessage({
  token,
  userWallet,
  walletToApprove,
}: BuildApprovalMessageArgs): ApproveERC20Message {
  const { contractAddress } = getERC20Config(token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)
  const data = erc20Contract.methods
    .approve(walletToApprove, MAX_UINT)
    .encodeABI()

  provider.disconnect()

  return {
    tx: {
      data,
      from: userWallet.address,
      gas: erc20Gas,
      to: contractAddress,
    },
    process: Process.APPROVE_ERC20,
    signer: {
      wallet: 'user',
      walletIndex: userWallet.nonce,
    },
    token,
    walletAddress: userWallet.address,
  }
}

export async function buildERC20PoolingMessage({
  token,
  userWalletAddress,
  mainWalletAddress,
}: BuildPoolMessageArgs): Promise<PoolingMessage> {
  const { contractAddress } = getERC20Config(token)
  const provider = new Web3.providers.HttpProvider(config.ethereum.httpProvider)
  const web3 = new Web3(provider)
  const erc20Contract = new web3.eth.Contract(erc20ABI, contractAddress)
  const { balanceAtomicUnits } = await getERC20Balance(userWalletAddress, token)
  const data = erc20Contract.methods
    .transferFrom(userWalletAddress, mainWalletAddress, balanceAtomicUnits)
    .encodeABI()

  provider.disconnect()

  return {
    tx: {
      data,
      from: mainWalletAddress,
      gas: erc20Gas,
      to: contractAddress,
    },
    token,
    process: Process.POOLING,
    signer: {
      wallet: 'main',
    },
    walletAddress: userWalletAddress,
  }
}
