import { mongoose } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { type DBCollectionSchema } from 'src/modules'
import { getUserById } from 'src/modules/user'

export interface UserMutes {
  _id: string
  mutedIds: Record<string, false | { name: string }>
  userId: string
}

const UserMutesSchema = new mongoose.Schema<UserMutes>({
  mutedIds: { type: Object },
  userId: { type: String, index: true, unique: true },
})

const UserMutesModel = mongoose.model<UserMutes>('user_mutes', UserMutesSchema)

export async function getMutesByUserId(
  userId: string,
): Promise<UserMutes | object> {
  const mutes = await UserMutesModel.findOne({ userId })
  if (mutes) {
    const object = mutes.mutedIds
    for (const key in object) {
      if (!object[key]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete object[key]
      }
    }
    return object
  } else {
    return {}
  }
}

export async function updateMutesByUserId(
  userId: string,
  modifyUserId: string,
  muted: boolean,
) {
  const current = await UserMutesModel.findOne({ userId })
  let data
  if (muted) {
    // if we are muting them.. store the username of the user!
    const user = await getUserById(modifyUserId)
    if (!user) {
      throw new APIValidationError('user__does_not_exist')
    }

    if (user.isChatMod) {
      if (user.hasChatModBadge) {
        throw new APIValidationError('user__mute_mod')
      } else {
        // Don't de-anonymize hidden moderators
        return
      }
    }

    const name = user.name
    data = {
      name,
    }
  } else {
    data = false
  }

  if (current) {
    await UserMutesModel.findOneAndUpdate(
      { userId },
      { $set: { ['mutedIds.' + modifyUserId]: data } },
    )
  } else {
    await UserMutesModel.create({
      userId,
      mutedIds: {
        [modifyUserId]: data,
      },
    })
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserMutesModel.collection.name,
}
