import { arg } from 'nexus'

export const uuidArg = (opts?: any) => arg({ ...opts, type: 'UUID' })
