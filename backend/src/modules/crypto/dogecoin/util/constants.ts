export const derivationPath = 'm/i/0'

export const networkInfo = {
  DOGE: {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: '',
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  },
  DOGETEST: {
    messagePrefix: '\x18Dogecoin Signed Message:\n',
    bech32: '',
    bip32: {
      public: 0x0432a9a8,
      private: 0x0432a243,
    },
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1,
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
export type DogecoinNetworkInfo = typeof networkInfo.DOGE
export type DogecoinTestNetworkInfo = typeof networkInfo.DOGETEST
