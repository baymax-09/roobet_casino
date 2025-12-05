import { mongoose, MongoErrorCodes } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export interface NamedLock {
  lockId: string
  expiresAt: Date

  createdAt?: Date
  updatedAt?: Date
}

const NamedLockSchema = new mongoose.Schema<NamedLock>(
  {
    lockId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
)

NamedLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const NamedLockModel = mongoose.model<NamedLock>(
  'named_locks',
  NamedLockSchema,
)

export async function createLock(
  lockId: string,
  expiresInMS: number,
): Promise<string | null> {
  try {
    /** Delete any locks of this lockId that have already expired. */
    await NamedLockModel.findOneAndDelete({
      lockId,
      expiresAt: { $lt: new Date() },
    })

    const expiresAt = new Date(Date.now() + expiresInMS)
    const { _id } = await NamedLockModel.create({ lockId, expiresAt })
    return _id.toString()
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      // may want other functionality here
      return null
    }
  }
  return null
}

export async function deleteLock(_id: string): Promise<void> {
  await NamedLockModel.deleteOne({ _id })
}

export async function renewLock(
  _id: string,
  expiresInMS: number,
): Promise<string | null> {
  const expiresAt = new Date(Date.now() + expiresInMS)
  const newLock = await NamedLockModel.findOneAndUpdate(
    { _id },
    { expiresAt },
    { new: true },
  ).lean()
  return newLock?._id.toString() ?? null
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: NamedLockModel.collection.name,
}
