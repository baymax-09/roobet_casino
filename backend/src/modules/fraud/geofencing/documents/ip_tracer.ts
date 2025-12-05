import { type Request } from 'express'

import { mongoose, r } from 'src/system'
import { User } from 'src/modules/user'
import { pluck, uniq } from 'src/util/helpers/lists'
import { type DBCollectionSchema } from 'src/modules'
import { type RoobetReq } from 'src/util/api'

import { getIpFromRequest } from '../index'
import { getCountryCodeFromRequest } from '../lib'
import { fraudLogger } from '../../lib/logger'

export interface IPTracerDocument {
  userId: string
  ip: string
  uses: number
  vpn: boolean
  countryCode: string
  createdAt: string
  updatedAt: string
}

const IPTracerSchema = new mongoose.Schema<IPTracerDocument>(
  {
    userId: { type: String, index: true },
    ip: { type: String, index: true },
    uses: { type: Number },
    countryCode: { type: String },
    vpn: { type: Boolean },
  },
  { timestamps: true },
)

IPTracerSchema.index({ userId: 1, ip: 1 }, { unique: true })
IPTracerSchema.index({ userId: 1, uses: -1 })

const IPTracerModel = mongoose.model<IPTracerDocument>(
  'ip_tracers',
  IPTracerSchema,
)

export const getIpsForUserId = async (userId: string) => {
  return await IPTracerModel.find({ userId })
    .sort({ uses: -1 })
    .lean<IPTracerDocument[]>()
}

export const hasUserUsedIp = async (userId: string, ip: string) => {
  return (await IPTracerModel.find({ userId, ip })).length > 0
}

export const addIpToIpTracerFromReq = async (req: Request) => {
  const ip = await getIpFromRequest(req)
  const { user } = req as RoobetReq

  if (!ip || !user) {
    return
  }

  const userId = user.id
  const countryCode = (await getCountryCodeFromRequest(req)) ?? 'Unknown'

  return await addIpToIpTracer({
    ip,
    userId,
    countryCode,
  })
}

export const addIpToIpTracer = async (
  document: Partial<IPTracerDocument> & Pick<IPTracerDocument, 'ip' | 'userId'>,
): Promise<boolean> => {
  const { userId, ip, ...updates } = document

  try {
    await IPTracerModel.findOneAndUpdate(
      { userId, ip },
      { ...updates, $inc: { uses: 1 } },
      { upsert: true },
    )
    return true
  } catch (error) {
    fraudLogger('addIpToIpTracer', { userId }).error(
      `Failed to update ip tracer for user: ${userId}`,
      { ip, updates },
      error,
    )
    return false
  }
}

export const getUsersWhoTouchedIp = async (ip: string) => {
  const touched: IPTracerDocument[] = await IPTracerModel.find({ ip })
  const pluckedUids = uniq(pluck(touched, 'userId'))
  return await User.getAll(r.args(pluckedUids)).run()
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: IPTracerModel.collection.name,
}
