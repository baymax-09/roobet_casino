import * as t from 'io-ts'

export type PositiveNumber = number & { __brand: 'PositiveNumber' }
export const isPositiveNumber = (value: number): value is PositiveNumber =>
  value >= 0

export type NegativeNumber = number & { __brand: 'NegativeNumber' }
export const isNegativeNumber = (value: number): value is NegativeNumber =>
  value < 0

interface PositiveIntegerBrand {
  readonly PositiveInteger: unique symbol
}

export const PositiveIntegerV = t.brand(
  t.number,
  (value): value is t.Branded<number, PositiveIntegerBrand> => {
    const isNumber = typeof value === 'number'
    const isNegative = value.toString().split('-').length > 1
    const isFloat = value.toString().split('.').length > 1
    return isNumber && !isNegative && !isFloat
  },
  'PositiveInteger',
)
export type PositiveInteger = t.TypeOf<typeof PositiveIntegerV>
