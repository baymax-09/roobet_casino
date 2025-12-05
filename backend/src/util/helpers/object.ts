/**
 * @returns whether a value is a non-null, non-array object.
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return (
    value !== null &&
    typeof value === 'object' &&
    Array.isArray(value) === false
  )
}
