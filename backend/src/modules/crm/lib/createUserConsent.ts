import { publishUserConsentMessageToFastTrack } from 'src/vendors/fasttrack'

import {
  type Consent,
  createConsent,
  getConsentByUserId,
} from '../documents/consent'

export const getOrCreateUserConsent = async (
  userId: string,
): Promise<Consent | undefined> => {
  const userConsent = await getConsentByUserId(userId)
  if (!userConsent) {
    // Create user consent document in mongo
    const newConsent = await createConsent(userId)
    // Publish event to have Fast Track know of the user consents creation
    publishUserConsentMessageToFastTrack(userId)
    return newConsent ?? undefined
  }
  return userConsent
}
