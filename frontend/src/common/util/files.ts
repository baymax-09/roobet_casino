export const prettyPrintSize = bytes => {
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (
    Number((bytes / Math.pow(1024, i)).toFixed(2)) +
    ' ' +
    ['B', 'kB', 'MB', 'GB'][i]
  )
}
