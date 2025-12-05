import * as t from 'io-ts'

const EmberEncryptionStringV = new t.Type<string>(
  'EmberEncryptionString',
  (val): val is string => {
    // value is not undefined
    return (
      !!val &&
      // value is not an array
      !Array.isArray(val) &&
      // value is a string
      typeof val === 'string' &&
      // value includes a colon delimiter
      val.includes(':') &&
      // value has two parts
      val.split(':').length === 2
    )
  },
  (val, context) =>
    typeof val === 'string' && val.split(':').length === 2
      ? t.success(val)
      : t.failure(val, context),
  t.identity,
)

export type EmberEncryptionString = t.TypeOf<typeof EmberEncryptionStringV>
export const isEmberEncryptionString = (
  val?: string | string[],
): val is EmberEncryptionString => {
  return EmberEncryptionStringV.is(val)
}
