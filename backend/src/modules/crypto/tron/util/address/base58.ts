type BytesLike = number[] | Uint8Array

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const ALPHABET_MAP: Record<string, number> = {}

for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i
}

const BASE = 58

export const encode58 = (buffer: BytesLike | string): string => {
  if (buffer.length === 0) return ''

  let i: number
  let j: number

  const digits = [0]

  for (i = 0; i < buffer.length; i++) {
    for (j = 0; j < digits.length; j++) {
      digits[j] <<= 8
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    digits[0] += buffer[i]
    let carry = 0

    for (j = 0; j < digits.length; ++j) {
      digits[j] += carry
      carry = (digits[j] / BASE) | 0
      digits[j] %= BASE
    }

    while (carry) {
      digits.push(carry % BASE)
      carry = (carry / BASE) | 0
    }
  }

  for (i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    digits.push(0)
  }

  return digits
    .reverse()
    .map(digit => ALPHABET[digit])
    .join('')
}

export const decode58 = (string: string) => {
  if (string.length === 0) {
    return []
  }

  let i
  let j

  const bytes = [0]

  for (i = 0; i < string.length; i++) {
    const char: string = string[i]

    if (!(char in ALPHABET_MAP)) {
      throw new Error(`Non-base58 character ${char}`)
    }

    for (j = 0; j < bytes.length; j++) {
      bytes[j] *= BASE
    }

    bytes[0] += ALPHABET_MAP[char]
    let carry = 0

    for (j = 0; j < bytes.length; ++j) {
      bytes[j] += carry
      carry = bytes[j] >> 8
      bytes[j] &= 0xff
    }

    while (carry) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  for (i = 0; string[i] === '1' && i < string.length - 1; i++) {
    bytes.push(0)
  }

  return bytes.reverse()
}
