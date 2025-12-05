import { type FilterQuery } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type Types as UserTypes } from 'src/modules/user'
import { type UserId } from 'src/util/types/userId'

const UserNoteTypes = ['admin', 'userAction'] as const
type UserNoteType = (typeof UserNoteTypes)[number]
export const isUserNoteType = (value: any): value is UserNoteType =>
  UserNoteTypes.includes(value)

const UserNoteSystems = [
  'seon',
  'risk',
  'chainalysis',
  'accountUpdate',
] as const
type UserNoteSystem = (typeof UserNoteSystems)[number]

interface UserNote {
  userId: string
  adminUserId: string
  adminName: string
  department?: string
  note: string
  createdAt?: Date
  type: UserNoteType
}

const UserNotesSchema = new mongoose.Schema<UserNote>(
  {
    userId: { type: String, index: true },
    adminUserId: { type: String },
    adminName: { type: String },
    department: { type: String },
    note: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
    type: { type: String },
  },
  { timestamps: true },
)

UserNotesSchema.index({ type: 1, userId: 1, createdAt: -1 })
UserNotesSchema.index({ userId: 1, createdAt: -1 })

const UserNotesModel = mongoose.model<UserNote>('user_notes', UserNotesSchema)

export async function addNoteToUser(
  userId: string,
  staffUser: Pick<UserTypes.User, 'name' | 'department'> & {
    id: UserId | UserNoteSystem
  },
  note: string,
  type: UserNoteType = 'admin',
) {
  const count = await UserNotesModel.create({
    userId,
    adminUserId: staffUser.id,
    adminName: staffUser.name,
    department: staffUser.department,
    note,
    type,
  })
  return count
}

export async function updateNote(
  noteId: string,
  adminUser: UserTypes.User,
  note: string,
) {
  return await UserNotesModel.findByIdAndUpdate(
    noteId,
    {
      $set: {
        adminUserId: adminUser.id,
        adminName: adminUser.name,
        department: adminUser.department,
        note,
      },
    },
    { new: true },
  )
}

export async function deleteNote(noteId: string) {
  return await UserNotesModel.findByIdAndDelete(noteId)
}

export async function findNotesForUser(
  userId: string,
  department?: string,
  type?: UserNoteType,
) {
  const query: FilterQuery<UserNote> = { userId }
  if (department) {
    query.department = department
  }
  if (type && type !== 'admin') {
    query.type = type
  }
  if (type === 'admin') {
    query.$or = [{ type: { $exists: false } }, { type: 'admin' }]
  }
  if (!type) {
    // query.type = { $ne: 'userAction' }
  }
  return await UserNotesModel.find(query).sort({ createdAt: -1 })
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: UserNotesModel.collection.name,
}
