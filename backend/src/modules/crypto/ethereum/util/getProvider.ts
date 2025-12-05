import HDWalletProvider from '@truffle/hdwallet-provider'
import Web3 from 'web3'
import { type AbiItem } from 'web3-utils'
import { config } from 'src/system'

export const getProvider = (
  mnemonic: string,
  addressIndex: number,
  contractAddress: string,
  abi: AbiItem[],
) => {
  const walletOptions = {
    mnemonic,
    providerOrUrl: config.ethereum.httpProvider,
    addressIndex,
  }

  const provider = new HDWalletProvider(walletOptions)
  const web3 = new Web3(provider)
  const contract = new web3.eth.Contract(abi, contractAddress)

  web3.eth.transactionPollingTimeout = 5000
  web3.eth.transactionConfirmationBlocks = 1

  return {
    web3,
    provider,
    contract,
  }
}
