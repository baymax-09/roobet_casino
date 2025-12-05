import { type KYCLevelWithDocuments, type DocumentType } from './types'

export const formatDate = (date: string | Date): string => {
  const parsed = new Date(date)

  return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString()}`
}

export const documentTypes: Record<KYCLevelWithDocuments, DocumentType> = {
  2: 'identity',
  3: 'address',
  4: 'sof',
}
