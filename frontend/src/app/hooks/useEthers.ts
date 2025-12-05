import React from 'react'
import {
  ethers,
  utils,
  type BigNumber,
  type providers,
  type Signer,
} from 'ethers'
import { useLocalStorage } from 'react-use'

import { useTranslate } from 'app/hooks'
export interface Account {
  primary: string
  addresses: string[]
  balance: string
  balanceNum: BigNumber | null
}

export interface BaseEthTransaction {
  to: string
  from: string
  value: BigNumber
  chainId: number
}

interface EthersData {
  account: Account
  loading?: boolean
  error?: any
}

interface EthersFunctions {
  connect: () => Promise<{ account: Account; error?: any }>
  getAccounts: () => Promise<{ account: Account; error?: any }>
  createTx: (newRawTx: BaseEthTransaction) => void
}

export type EthersPayload = [
  EthersData,
  EthersFunctions,
  providers.JsonRpcProvider | null,
]

// TODO: remove this isAllowed param once metamask deposit feature flag gets pulled out
export const useEthers = (isAllowed = true): EthersPayload => {
  const ethersRef = React.useRef<providers.JsonRpcProvider | null>(null)
  const [addresses, setAddresses] = React.useState<string[]>([])
  const [primary, setPrimary] = React.useState<string>('')
  const [balance, setBalance] = React.useState<string>('')
  const [balanceNum, setBalanceNum] = React.useState<BigNumber | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<any>(null)
  const translate = useTranslate()
  const isConnectedInitialValue =
    localStorage.getItem('isMetamaskConnected') || false
  const [isConnected, setIsConnected] = useLocalStorage(
    'isMetamaskConnected',
    isConnectedInitialValue,
  )

  const _setAccountAddresses = (addresses: string[]) => {
    setAddresses(addresses)

    if (!Array.isArray(addresses) || !addresses.length) {
      setPrimary('')
      setIsConnected(false)

      return ''
    }

    const primaryAddressChecksum = utils.getAddress(addresses[0])
    setPrimary(primaryAddressChecksum)

    return primaryAddressChecksum
  }

  const _setPrimaryAddressBalances = async (checksumAddress: string) => {
    if (!ethersRef.current || !checksumAddress) {
      setBalance('')
      setBalanceNum(null)

      return
    }

    const balanceNum: BigNumber =
      await ethersRef.current.getBalance(checksumAddress)
    const balanceStr = utils.formatEther(balanceNum)
    setBalance(balanceStr)
    setBalanceNum(balanceNum)
  }

  React.useEffect(() => {
    if (isAllowed) {
      initialize()
    }

    if (isAllowed && window.ethereum) {
      return () => {
        window.ethereum.removeListener('accountsChanged', () =>
          // eslint-disable-next-line no-console
          console.log('removed accountsChanged listener'),
        )
      }
    }
  }, [])

  const initialize = async () => {
    if (window && window.ethereum) {
      setLoading(true)

      ethersRef.current = new ethers.providers.Web3Provider(window.ethereum)

      try {
        let addresses: string[] = []

        if (isConnected) {
          addresses = await ethersRef.current.send('eth_requestAccounts', [])
        }

        const primaryChecksum = _setAccountAddresses(addresses)
        await _setPrimaryAddressBalances(primaryChecksum)

        window.ethereum.on('accountsChanged', async (accts: string[]) => {
          const primaryChecksum: string = _setAccountAddresses(accts)
          await _setPrimaryAddressBalances(primaryChecksum)
        })
      } catch (err) {
        console.warn('useEthers Hook Error: initialize - ', err)
      } finally {
        setLoading(false)
      }
    } else {
      // Non-dapp browsers
      setError(translate('ethers.browserSwitch'))
    }
  }

  const connect = async (): Promise<{ account: Account; error?: any }> => {
    setLoading(true)

    if (!window || !window.ethereum) {
      const errMsg: string = translate('ethers.browserSwitch')
      setError(errMsg)
      setLoading(false)

      return {
        error: errMsg,
        account: { primary, balance, balanceNum, addresses },
      }
    }

    if (!ethersRef.current) {
      setLoading(false)

      return { error: '', account: { primary, balance, balanceNum, addresses } }
    }

    try {
      const addresses: string[] = await ethersRef.current.send(
        'eth_requestAccounts',
        [],
      )
      const primaryChecksum: string = _setAccountAddresses(addresses)
      await _setPrimaryAddressBalances(primaryChecksum)

      if (Array.isArray(addresses) && addresses.length) {
        setIsConnected(true)
      }

      return {
        account: { primary: primaryChecksum, balance, balanceNum, addresses },
        error: '',
      }
    } catch (err) {
      console.warn('useEthers Hook Error: connect - ', err)

      return {
        error: err,
        account: { primary, balance, balanceNum, addresses },
      }
    } finally {
      setLoading(false)
    }
  }

  const getAccounts = async (): Promise<{ account: Account; error?: any }> => {
    setLoading(true)
    if (!window || !window.ethereum) {
      const errMsg: string = translate('ethers.browserSwitch')
      setError(errMsg)
      setLoading(false)

      return {
        error: errMsg,
        account: { primary, balance, balanceNum, addresses },
      }
    }

    try {
      const addresses: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      const primaryChecksum: string = _setAccountAddresses(addresses)
      await _setPrimaryAddressBalances(primaryChecksum)

      return {
        account: { primary: primaryChecksum, balance, balanceNum, addresses },
        error: '',
      }
    } catch (err) {
      console.warn('useEthers Hook Error: getAccounts - ', err)

      return {
        error: err,
        account: { primary, balance, balanceNum, addresses },
      }
    } finally {
      setLoading(false)
    }
  }

  const createTx = async (newTx: BaseEthTransaction) => {
    setLoading(true)
    if (!ethersRef.current || !primary) {
      setLoading(false)

      return
    }

    try {
      const signer: Signer = ethersRef.current.getSigner()

      await signer.sendTransaction(newTx)
    } catch (err: any) {
      console.warn('useEthers Hook Error: createTx - ', err)
    } finally {
      setLoading(false)
    }
  }

  const fn: EthersFunctions = {
    connect,
    getAccounts,
    createTx,
  }

  const account: Account = { primary, balance, balanceNum, addresses }
  const data: EthersData = {
    account,
    loading,
    error,
  }

  return [data, fn, ethersRef.current]
}
