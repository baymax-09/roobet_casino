export const derivationPath = 'm/i/0'

export const networkInfo = {
  BTC: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  BTCTEST: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  },
}

// WITNESS_V0 = P2WSH
export const AddressTypes = ['P2SH', 'WITNESS_V0', 'P2WSH-P2SH'] as const
export type AddressType = (typeof AddressTypes)[number]
export const isValidAddressType = (value: any): value is AddressType =>
  AddressTypes.includes(value)

export const ChainCodeTypes = ['standard', 'nonstandard'] as const
export type ChainCodeType = (typeof ChainCodeTypes)[number]
export const isValidChainCodeType = (value: any): value is ChainCodeType =>
  ChainCodeTypes.includes(value)

export type NetworkInfo = typeof networkInfo
export type BitcoinNetworkInfo = typeof networkInfo.BTC
export type BitcoinTestNetworkInfo = typeof networkInfo.BTCTEST
