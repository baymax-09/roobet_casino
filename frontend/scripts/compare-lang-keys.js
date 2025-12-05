const fs = require('fs')

const analyzedKeys = require('../locale_key_compare/langKeys.json')
const en = require('../src/app/locale/en.json')

const flattenObject = (obj, path = '') => {
  if (!(obj instanceof Object)) return { [path.replace(/\.$/g, '')]: obj }

  return Object.keys(obj).reduce((output, key) => {
    return { ...output, ...flattenObject(obj[key], path + key + '.') }
  }, {})
}

const findMissingKeys = () => {
  const missingKeys = []
  const extraKeys = []

  const knownContexts = Object.keys(en)
  const foundContexts = [
    ...new Set(Object.keys(analyzedKeys).map(key => key.split('.')[0])),
  ]

  const knownContextKeys = Object.keys(flattenObject(en))
  const foundContextKeys = Object.keys(analyzedKeys)

  // Check for keys found in code but not in en.json
  for (const context of foundContexts) {
    // -- Context check.
    if (!knownContexts.includes(context)) {
      missingKeys.push(context)
    }

    // -- Key check.
    const contextKeys = foundContextKeys.filter(key =>
      key.includes(`${context}.`),
    )

    const _missingKeys = contextKeys.filter(
      key => !knownContextKeys.includes(key),
    )

    missingKeys.push(..._missingKeys)
  }

  // Check for keys in en.json but not found in code.
  for (const context of knownContexts) {
    // -- Context check.
    if (!foundContexts.includes(context)) {
      missingKeys.push(context)
    }

    // -- Key check.
    const contextKeys = knownContextKeys.filter(key =>
      key.includes(`${context}.`),
    )

    const _extraKeys = contextKeys.filter(
      key => !foundContextKeys.includes(key),
    )

    extraKeys.push(..._extraKeys)
  }

  // fs.rmSync('./locale_key_compare', { recursive: true })

  if (missingKeys.length || extraKeys.length) {
    console.error('KEYS FOUND IN CODE NOT IN TRANSLATION FILE:', missingKeys)
    console.error('KEYS FOUND IN TRANSLATION FILE NOT IN CODE:', extraKeys)
    process.exit(1)
  }

  process.exit(0)
}

findMissingKeys()
