declare module 'ip2proxy-nodejs' {
  function Open(path: string): -1 | 0 | 1
  function isProxy(ip: string): -1 | 0 | 1 | 2
  function getProxyType(ip: string): string
  function getCountryShort(ip: string): string
}
