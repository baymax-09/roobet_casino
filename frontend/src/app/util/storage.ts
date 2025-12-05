// eslint-disable-next-line no-restricted-globals
let _localStorageSupported = typeof self.localStorage !== 'undefined'

if (_localStorageSupported) {
  // Test settings and removing a key

  try {
    localStorage.setItem('rbtest', 'rbtest')
    localStorage.removeItem('rbtest')
  } catch (err) {
    _localStorageSupported = false
  }
}

export function hasStorageItem(key) {
  if (!_localStorageSupported) {
    return false
  }

  return Object.prototype.hasOwnProperty.call(localStorage, key)
}

export function getStorageItem(key) {
  if (!_localStorageSupported) {
    return null
  }

  return localStorage.getItem(key)
}

export function setStorageItem(key, value) {
  if (!_localStorageSupported) {
    return
  }

  localStorage.setItem(key, value)
}

export function removeStorageItem(key) {
  if (!_localStorageSupported) {
    return
  }

  localStorage.removeItem(key)
}
