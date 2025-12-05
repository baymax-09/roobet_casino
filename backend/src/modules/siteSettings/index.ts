export * as Routes from './routes'
export * as Documents from './documents'

export {
  isGlobalSystemEnabled,
  incrementGlobalStat,
  setGlobalStat,
  getDynamicSettings,
  setDynamicSettings,
  setWithdrawStatus,
  isLegacyMappedSystemName,
  changeSystemEnabledGlobal,
  recordBetsAllTime,
  systemNameToGlobalSystemKey,
  type LegacySystemKey,
} from './documents/settings'
