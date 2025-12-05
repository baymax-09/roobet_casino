export const indexBy = <T extends object, K extends keyof T>(
  obj: T[],
  attribute: K,
): Record<K, T> =>
  // @ts-expect-error Object.keys behavior
  Object.keys(obj).reduce<Partial<Record<K, T>>>((acc, key) => {
    const value = obj[key]
    return {
      ...acc,
      [value[attribute]]: value,
    }
  }, {})

export const mapObjectToTypes = obj =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      [key]: obj[key].type || 'string',
    }),
    {},
  )

export const sortBy = key => {
  return (a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0)
}

export const deepMerge = (target, source) => {
  // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties.
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object) {
      Object.assign(source[key], deepMerge(target[key], source[key]))
    }
  }

  // Join `target` and modified `source`/
  Object.assign(target || {}, source)
  return target
}

/** typeguard for filtering arrays */
export const exists = <T>(item?: T | null): item is T => !!item

/** typeguard for array of strings */
export function isArrayOfStrings(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every(item => typeof item === 'string')
}
