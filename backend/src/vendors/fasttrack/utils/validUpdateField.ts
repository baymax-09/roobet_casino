import { type ChangeStreamDocument } from 'mongodb'
import { type Document } from 'mongoose'

type BaseObject = Record<string, any>

// It's possible we could have keys updated that are nested in objects, such as "overrides" in "tp_games"
const createArrayFromKeys = (document: BaseObject) => {
  const keysArray: string[] = []

  for (const key in document) {
    if (Object.prototype.hasOwnProperty.call(document, key)) {
      if (typeof document[key] === 'object') {
        keysArray.push(...createArrayFromKeys(document[key] as BaseObject))
      } else {
        keysArray.push(key)
      }
    }
  }

  return keysArray
}

export const validFastTrackUpdateField = (
  document: ChangeStreamDocument<Document> & {
    operationType: 'insert' | 'replace' | 'update'
  },
  validFields: Readonly<string[]>,
) => {
  if (!document.fullDocument) {
    return false
  }

  const updatedFields =
    document.operationType === 'update'
      ? document.updateDescription?.updatedFields
      : null
  if (!updatedFields) {
    return false
  }

  const updateFieldsToKeyArray = createArrayFromKeys(updatedFields)

  return (
    document.fullDocument &&
    validFields.some(item => updateFieldsToKeyArray.includes(item))
  )
}
