/**
 * Takes in a possible array and returns the first item if possible.
 */
export const first = <T>(possibleArray?: T | T[]): T | undefined =>
  Array.isArray(possibleArray) ? possibleArray[0] : possibleArray

/**
 * Extracts a list of property values.
 */
export const pluck = <T, K extends keyof T>(
  collection: T[],
  key: K,
): Array<T[K]> => collection.map(obj => obj[key])

/**
 * Extracts a list of object fields.
 */
export const pick = <T, K extends keyof T>(object: T, keys: K[]): Pick<T, K> =>
  keys.reduce(
    (obj, key) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        obj[key] = object[key]
      }
      return obj
    },
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as Pick<T, K>,
  )

/**
 * Takes in list and returns unique elements.
 */
export const uniq = <T>(collection: T[]): T[] => [...new Set(collection)]

export const chunk = (array: any[], size: number) => {
  if (size < 1) {
    throw new Error('Size must be positive')
  }

  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

/**
 * Deep sort any input, including objects and arrays.
 *
 * TS: Typing this is not worth the time spent.
 */
export const deepSort = <Input>(input: Input): Input => {
  if (Array.isArray(input)) {
    // @ts-expect-error see docstring above
    return input.map(item => deepSort(item))
  }

  if (typeof input === 'object') {
    // @ts-expect-error see docstring above
    return Object.keys(input)
      .sort()
      .reduce(
        // @ts-expect-error see docstring above
        (sorted, key) => ({ ...sorted, [key]: deepSort(input[key]) }),
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {} as Input,
      )
  }

  return input
}

const mapAsync = async <T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>,
): Promise<U[]> => {
  return await Promise.all(array.map(callbackfn))
}

export const filterAsync = async <T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> => {
  const filterMap = await mapAsync(array, callbackfn)
  return array.filter((_, index) => filterMap[index])
}

export const traverseArrayWithinArray = <T>(
  array: T[],
  callback: (item: T) => void,
) => {
  const stack = [...array]
  while (stack.length > 0) {
    const element = stack.pop()
    if (element) {
      if (Array.isArray(element)) {
        stack.push(...element)
      } else {
        callback(element)
      }
    }
  }
}

export const padArray = <Item>(arr: Item[], len: number, fill: Item) => {
  return arr.concat(Array(len).fill(fill)).slice(0, len)
}

/** create an object with null values from a list
 * intended to be used with io-ts for unions
 */
export function createObjectFromArray<T extends readonly string[]>(
  arr: T,
): Record<T[number], null> {
  return Object.fromEntries(arr.map(v => [v, null])) as Record<T[number], null>
}
