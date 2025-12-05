export const omitDeep = (obj, omitKey) => {
  const result = Array.isArray(obj) ? [] : {}
  for (const [key, value] of Object.entries(obj)) {
    if (omitKey === key) continue
    result[key] =
      typeof value === 'object' && value !== null
        ? omitDeep(value, omitKey)
        : value
  }
  return result
}
