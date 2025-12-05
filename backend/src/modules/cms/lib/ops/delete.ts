import { type Request } from 'express'

import { APIValidationError } from 'src/util/errors'

import { deleteCmsDocument, getCmsDocument } from '../../documents'

export const _delete = async (req: Request) => {
  const { name, lang } = req.params

  if (typeof lang !== 'string') {
    throw new APIValidationError('lang must be a string')
  }

  const doc = await getCmsDocument(name, lang)

  if (!doc) {
    throw new APIValidationError('No such document')
  }

  await deleteCmsDocument(name, lang)

  return doc
}
