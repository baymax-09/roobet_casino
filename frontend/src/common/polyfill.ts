if (typeof window.Object.entries === 'undefined') {
  window.Object.entries = obj => Object.keys(obj).map(key => [key, obj[key]])
}

if (typeof window.Object.values === 'undefined') {
  window.Object.values = obj => Object.keys(obj).map(key => obj[key])
}
