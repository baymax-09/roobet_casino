import {
  decodeInputById,
  TransferMethodV,
  TransferFromMethodV,
  getMethodInfo,
} from './abi/decoder'

export const useAbiDecoder = () => {
  const decodeDataParam = (data: string) => decodeInputById(data)
  const isValidMethod = (data: string) => {
    const dataBuf = Buffer.from(data.replace(/^0x/, ''), 'hex')
    const methodId = Array.from(dataBuf.subarray(0, 4), function (byte) {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')

    return !!getMethodInfo(methodId)
  }

  return {
    decodeDataParam,
    isValidMethod,
    TransferFromMethodV,
    TransferMethodV,
  }
}
