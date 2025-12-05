export const derivationPath = 'm/i/0'

export const networkInfo = {
  LTC: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe,
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
  },
  LTCTEST: {
    messagePrefix: '\x18Litecoin Signed Message:\n',
    bech32: 'tltc',
    bip32: {
      private: 0x0436ef7d,
      public: 0x0436f6e1,
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
export type LitecoinNetworkInfo = typeof networkInfo.LTC
export type LitecoinTestNetworkInfo = typeof networkInfo.LTCTEST
