import * as t from 'io-ts'

const InputV = t.type({
  prevout: t.type({
    hash: t.string,
    index: t.number,
  }),
  script: t.string,
  witness: t.string,
  sequence: t.string,
  coin: t.type({
    version: t.number,
    blockNumber: t.number,
    value: t.number,
    script: t.string,
    address: t.string,
    coinbase: t.boolean,
  }),
})

const OutputV = t.type({
  value: t.number,
  script: t.string,
  address: t.string,
})

export const GetTransactionResponseV = t.type({
  hash: t.string,
  hex: t.string,
  witnessHash: t.string,
  fee: t.number,
  rate: t.number,
  mtime: t.number,
  blockNumber: t.number,
  block: t.string,
  time: t.number,
  index: t.number,
  version: t.number,
  locktime: t.number,
  inputs: t.array(InputV),
  outputs: t.array(OutputV),
})
export type Transaction = t.TypeOf<typeof GetTransactionResponseV>

export const UnspentOutputV = t.type({
  txHash: t.string,
  index: t.number,
  value: t.number,
  valueAsString: t.string,
  address: t.string,
  chain: t.union([
    t.literal('bitcoin-mainnet'),
    t.literal('litecoin-mainnet'),
    t.literal('doge-mainnet'),
  ]),
})
export type UnspentOutput = t.TypeOf<typeof UnspentOutputV>
export const UnspentOutputArrayV = t.array(UnspentOutputV)
