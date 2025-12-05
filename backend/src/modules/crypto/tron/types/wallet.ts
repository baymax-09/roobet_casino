import * as t from 'io-ts'

import { isAddress, fromHex, toHex } from '../util/address'

interface TronAddressHexBrand {
  readonly TronAddressHex: unique symbol
}

interface TronAddressBase58Brand {
  readonly TronAddressBase58: unique symbol
}

/** validation Fn checks if address is a valid TRON address first
 * THEN check if its the hex version of the address
 */
export const TronAddressHexV = t.brand(
  t.string,
  (value): value is t.Branded<string, TronAddressHexBrand> =>
    t.string.is(value) && isAddress(value) && toHex(value) === value,
  'TronAddressHex',
)
export type TronAddressHex = t.TypeOf<typeof TronAddressHexV>

/** validation Fn checks if address is a valid TRON address first
 * THEN check if its the Base58 version of the address
 */
export const TronAddressBase58V = t.brand(
  t.string,
  (value): value is t.Branded<string, TronAddressBase58Brand> =>
    typeof value === 'string' && isAddress(value) && fromHex(value) === value,
  'TronAddressBase58',
)
export type TronAddressBase58 = t.TypeOf<typeof TronAddressBase58V>

export const TronWalletV = t.type({
  id: t.string,
  address: TronAddressBase58V,
  nonce: t.number,
  userId: t.string,
  type: t.literal('Tron'),
})
export type TronWallet = t.TypeOf<typeof TronWalletV>

const AccountStakeResourceV = t.type({
  energyAmount: t.number,
  bandwidthAmount: t.number,
  unFrozen: t.array(
    t.type({ unfreeze_amount: t.number, unfreeze_expire_time: t.number }),
  ),
  netLimit: t.number,
  energyLimit: t.number,
})
export type AccountStakeResource = t.TypeOf<typeof AccountStakeResourceV>
