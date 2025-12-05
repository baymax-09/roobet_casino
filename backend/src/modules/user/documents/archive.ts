import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import { publishUserBlockMessageToFastTrack } from 'src/vendors/fasttrack'

import { type Types as UserTypes } from 'src/modules/user'

import { deleteUser, deleteManyUsers } from './user'
import { userLogger } from '../lib/logger'

type ArchivedUser = UserTypes.User & {
  deletedAt: Date
}

const UserArchiveSchema = new megaloMongo.Schema<ArchivedUser>(
  {
    // ID of deleted user
    id: { type: String, index: true },
    name: { type: String, index: true },
    nameLowercase: { type: String, index: true },
    deletedAt: { type: Date, default: Date.now, index: true },
  },
  // We do not want strict: false in more collections, don't follow this pattern.
  { strict: false, timestamps: true },
)

const UserArchiveModel = megaloMongo.model<ArchivedUser>(
  'user_archives',
  UserArchiveSchema,
)

export async function getArchivedUserByRethinkId(id: string) {
  return await UserArchiveModel.findOne({ id }).lean<ArchivedUser | undefined>()
}

export async function archiveAndDeleteAccount(user: UserTypes.User) {
  await UserArchiveModel.create(user)
  userLogger('archiveAndDeleteAccount', { userId: user.id }).info(
    `Archived and deleted ${user.id}`,
    { user },
  )
  await deleteUser(user.id)
}

export async function archiveAndDeleteManyAccounts(users: UserTypes.User[]) {
  await UserArchiveModel.insertMany(users)
  const userIds = users.map(user => {
    const userId = user.id
    userLogger('archiveAndDeleteManyAccounts', { userId: user.id }).info(
      `Archived and deleted ${userId}`,
      { user },
    )
    return userId
  })
  return await deleteManyUsers(userIds)
}

export async function findArchiveUserByName(name: string) {
  return await UserArchiveModel.findOne({
    nameLowercase: name.toLowerCase(),
  }).lean<ArchivedUser | undefined>()
}
/* FEEDS */
const usersArchivedChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<ArchivedUser>(
      UserArchiveModel,
      async document => {
        // When a user is deleted, we need to block them in Fasttrack
        if (document.operationType === 'insert' && document.fullDocument) {
          const { id } = document.fullDocument
          await publishUserBlockMessageToFastTrack(id)
        }
      },
    )
  } catch (error) {
    userLogger('archiveAndDeleteManyAccounts', { userId: null }).error(
      'Error in change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: UserArchiveModel.collection.name,
  feeds: [usersArchivedChangeFeed],
}
