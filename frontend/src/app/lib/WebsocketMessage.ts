// WebsocketMessage represents a binary websocket message
export class WebsocketMessage {
  readPosition: number
  writePosition: number
  array: Uint8Array

  constructor(sizeOrBuffer: any, packetId: any | null = null) {
    this.readPosition = 0
    this.writePosition = 0

    if (sizeOrBuffer instanceof ArrayBuffer) {
      this.array = new Uint8Array(sizeOrBuffer)
    } else if (typeof sizeOrBuffer === 'number') {
      if (packetId !== null) {
        sizeOrBuffer += 1
      }

      this.array = new Uint8Array(sizeOrBuffer)

      if (packetId !== null) {
        this.put(packetId)
      }
    } else {
      this.array = sizeOrBuffer
    }
  }

  get size() {
    return this.array.length
  }

  buffer() {
    return this.array.buffer
  }

  put(number) {
    this.array[this.writePosition++] = number
    return this
  }

  putInt16(number) {
    number = Math.floor(number)
    if (number > 65535) {
      throw new Error(`putInt16 Number ${number} out of bounds`)
    }

    this.array[this.writePosition++] = (number >> 8) & 0xff
    this.array[this.writePosition++] = number & 0xff
    return this
  }

  putInt24(number) {
    number = Math.floor(number)
    if (number > 16777215) {
      throw new Error('Int24 out of bound')
    }

    this.array[this.writePosition++] = (number >> 16) & 0xff
    this.array[this.writePosition++] = (number >> 8) & 0xff
    this.array[this.writePosition++] = number & 0xff
    return this
  }

  putInt32(number) {
    number = Math.floor(number)

    this.array[this.writePosition++] = (number >> 24) & 0xff
    this.array[this.writePosition++] = (number >> 16) & 0xff
    this.array[this.writePosition++] = (number >> 8) & 0xff
    this.array[this.writePosition++] = number & 0xff
    return this
  }

  putFloat(number) {
    const floatArray = new Float32Array([number])
    const buffer = new Int8Array(floatArray.buffer)

    for (let i = 0; i < 4; i++) {
      this.array[this.writePosition++] = buffer[i]
    }

    return this
  }

  putString(str) {
    const length = str.length

    for (let i = 0; i < length; i++) {
      this.put(str.charCodeAt(i))
    }

    return this
  }

  read() {
    return this.array[this.readPosition++]
  }

  readInt16() {
    const byte1 = this.array[this.readPosition++]
    const byte2 = this.array[this.readPosition++]
    return (byte1 << 8) | byte2
  }

  readInt24() {
    const byte1 = this.array[this.readPosition++]
    const byte2 = this.array[this.readPosition++]
    const byte3 = this.array[this.readPosition++]
    return (byte1 << 16) | (byte2 << 8) | byte3
  }

  readInt32() {
    const byte1 = this.array[this.readPosition++]
    const byte2 = this.array[this.readPosition++]
    const byte3 = this.array[this.readPosition++]
    const byte4 = this.array[this.readPosition++]
    return (byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4
  }

  readFloat() {
    const arr = new Uint8Array(4)

    for (let i = 0; i < 4; i++) {
      arr[i] = this.array[this.readPosition++]
    }

    return new Float32Array(arr.buffer)[0]
  }

  readString(length) {
    let string = ''
    for (var i = 0; i < length; i++) {
      string += String.fromCharCode(this.read())
    }

    return string
  }
}
