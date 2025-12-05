import { type DBCollectionSchema } from 'src/modules'
import { type FreespinIssuer } from 'src/modules/tp-games'
import { MongoErrorCodes, mongoose } from 'src/system'
import { type Types } from 'mongoose'

export interface RequiredFreespinFields {
  userId: string
  campaignName: string
  gameIdentifier: string
}

export interface BaseSlotegratorFreespin extends RequiredFreespinFields {
  rounds?: number
  roundsRemaining?: number
  expiry?: Date
  betLevel?: string
  issuerId?: FreespinIssuer
  reason?: string
}

export interface SlotegratorFreespin extends BaseSlotegratorFreespin {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

interface DuplicateDocumentResponse {
  existed: true
  documentId: Types.ObjectId | undefined
}
interface CreateDocumentResponse {
  existed: false
  documentId: Types.ObjectId
}

type HoistDocumentResponse = DuplicateDocumentResponse | CreateDocumentResponse

const SlotegratorFreespinsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    campaignName: { type: String, required: true },
    gameIdentifier: { type: String, required: true },
    rounds: { type: Number },
    roundsRemaining: { type: Number },
    expiry: { type: Date },
    betLevel: { type: String },
    issuerId: { type: String },
    reason: { type: String },
  },
  { timestamps: true },
)

SlotegratorFreespinsSchema.index(
  { userId: 1, campaignName: 1, gameIdentifier: 1 },
  { unique: true },
)

export const SlotegratorFreespinsModel = mongoose.model<SlotegratorFreespin>(
  'slotegrator_freespins',
  SlotegratorFreespinsSchema,
)

export const hoistSlotegratorFreespinDocument = async (
  identifierTuple: RequiredFreespinFields,
): Promise<HoistDocumentResponse> => {
  try {
    const freespinDoc = await SlotegratorFreespinsModel.create(identifierTuple)
    return { existed: false, documentId: freespinDoc._id }
  } catch (error) {
    if (error.code === MongoErrorCodes.DUPLICATE_KEY) {
      const freespinDoc =
        await SlotegratorFreespinsModel.findOne(identifierTuple)
      return { existed: true, documentId: freespinDoc?._id }
    }
  }
  return { existed: true, documentId: undefined }
}

export const deleteSlotegratorFreespins = async (docId: string) => {
  await SlotegratorFreespinsModel.findByIdAndDelete(docId)
}

export const getSlotegratorFreespinsForUser = async (userId: string) => {
  return await SlotegratorFreespinsModel.find({ userId })
}

export const updateSlotegratorFreespinRecord = async (
  docId: string,
  payload: Partial<BaseSlotegratorFreespin>,
) => {
  return await SlotegratorFreespinsModel.findByIdAndUpdate(docId, payload)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: SlotegratorFreespinsModel.collection.name,
}
