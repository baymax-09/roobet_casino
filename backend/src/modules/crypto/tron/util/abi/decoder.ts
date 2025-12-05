import * as t from 'io-ts'
import { ethers } from 'ethers'

import {
  type AcceptedMethodName,
  TronAddressHexV,
  type TronAddressHex,
} from '../../types'

const TransferInputTypesV = t.array(
  t.union([t.literal('address'), t.literal('uint256')]),
)
type TransferInputTypes = t.TypeOf<typeof TransferInputTypesV>
export const TransferMethodV = t.type({
  methodName: t.literal('transfer'),
  decodedInput: t.type({
    to: TronAddressHexV,
    value: t.bigint,
  }),
})

const TransferFromInputTypesV = t.array(
  t.union([t.literal('address'), t.literal('address'), t.literal('uint256')]),
)
type TransferFromInputTypes = t.TypeOf<typeof TransferFromInputTypesV>
export const TransferFromMethodV = t.type({
  methodName: t.literal('transferFrom'),
  decodedInput: t.type({
    from: TronAddressHexV,
    to: TronAddressHexV,
    value: t.bigint,
  }),
})

const DecodedInputResultV = t.union([TransferMethodV, TransferFromMethodV])
type DecodedInputResult = t.TypeOf<typeof DecodedInputResultV>

type DecodedResponse =
  | {
      success: true
      error: undefined
      result: DecodedInputResult
    }
  | {
      success: false
      error: Error
      result: undefined
    }

function getMethodId(
  methodName: string,
  types: TransferFromInputTypes | TransferInputTypes,
) {
  const input = methodName + '(' + types.join(',') + ')'
  return ethers.keccak256(Buffer.from(input)).slice(2, 10)
}

export function getMethodInfo(methodHex: string) {
  const transfer: { name: 'transfer'; inputTypes: ['address', 'uint256'] } = {
    name: 'transfer',
    inputTypes: ['address', 'uint256'],
  }

  const transferFrom: {
    name: 'transferFrom'
    inputTypes: ['address', 'address', 'uint256']
  } = {
    name: 'transferFrom',
    inputTypes: ['address', 'address', 'uint256'],
  }

  return [transfer, transferFrom].find(
    obj => getMethodId(obj.name, obj.inputTypes) === methodHex,
  )
}

function formatInputs(
  data: string,
  inputTypes: TransferFromInputTypes | TransferInputTypes,
): string | undefined {
  const outputWithoutMethod = data.replace(/^0x/, '').substring(8)
  // split the string up into equal segments of 32 bytes
  const outputArr = outputWithoutMethod.match(/.{1,64}/g)
  if (!outputArr) {
    return undefined
  }

  const formattedArr = outputArr.map((el: string, index: number) => {
    if (inputTypes[index] === 'address') {
      const leadingZeros = el.slice(0, 22)
      const value = el.substring(22)
      const formattedValue = value.replace(/^41/, '00')
      return leadingZeros + formattedValue
    } else {
      return el
    }
  })

  return formattedArr.join('')
}

function formatOutput(
  methodName: AcceptedMethodName,
  outputArr: ethers.Result,
): DecodedInputResult {
  if (methodName === 'transfer') {
    return {
      methodName: 'transfer',
      decodedInput: {
        to: ('41' + outputArr[0].replace(/^0x/, '')) as TronAddressHex,
        value: outputArr[1],
      },
    }
  } else {
    return {
      methodName: 'transferFrom',
      decodedInput: {
        from: ('41' + outputArr[0].replace(/^0x/, '')) as TronAddressHex,
        to: ('41' + outputArr[1].replace(/^0x/, '')) as TronAddressHex,
        value: outputArr[2],
      },
    }
  }
}

export function decodeInputById(data: string): DecodedResponse {
  try {
    const dataBuf = Buffer.from(data.replace(/^0x/, ''), 'hex')
    const methodId = Array.from(dataBuf.subarray(0, 4), function (byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')

    const methodInfo = getMethodInfo(methodId)
    if (!methodInfo) {
      return {
        success: false,
        error: new Error('unsupported method'),
        result: undefined,
      }
    }

    const formattedData = formatInputs(data, methodInfo.inputTypes)
    if (!formattedData) {
      return {
        success: false,
        error: new Error('unsupported method 2'),
        result: undefined,
      }
    }

    const output = '0x' + formattedData
    const abiCoder = new ethers.AbiCoder()
    const decodedInputs = abiCoder.decode(methodInfo.inputTypes, output)

    return {
      success: true,
      error: undefined,
      result: formatOutput(methodInfo.name, decodedInputs),
    }
  } catch (err) {
    return {
      success: false,
      error: new Error(err),
      result: undefined,
    }
  }
}
