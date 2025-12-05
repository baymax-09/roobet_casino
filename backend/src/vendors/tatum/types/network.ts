import {
  Network,
  type Bitcoin,
  type Litecoin,
  type Dogecoin,
} from '@tatumio/tatum'

import { type CryptoNetwork } from 'src/modules/crypto/types'

export type ValidTatumNetwork = Extract<
  CryptoNetwork,
  'Bitcoin' | 'Litecoin' | 'Dogecoin'
>

export type UTXOTatumSDKType = Bitcoin | Litecoin | Dogecoin

export const NetworkMap: Record<
  ValidTatumNetwork,
  Network.BITCOIN | Network.LITECOIN | Network.DOGECOIN
> = {
  Bitcoin: Network.BITCOIN,
  Litecoin: Network.LITECOIN,
  Dogecoin: Network.DOGECOIN,
}
