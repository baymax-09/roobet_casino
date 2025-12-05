/**
 * User Verification Document Types
 * identity
 * address(POA) = Proof of Address
 * SOF = Source of Funds
 */
export const verificationDocumentTypes = ['identity', 'address', 'sof'] as const
export type VerificationDocumentType =
  (typeof verificationDocumentTypes)[number]

export const isValidVerificationDocumentType = (
  value: any,
): value is VerificationDocumentType =>
  verificationDocumentTypes.includes(value)

// User Verification Document Extensions
export const verificationDocumentExtensions = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
] as const
export type VerificationDocumentExtension =
  (typeof verificationDocumentExtensions)[number]

export const isValidVerificationDocumentExtension = (
  value: any,
): value is VerificationDocumentExtension =>
  verificationDocumentExtensions.includes(value)
