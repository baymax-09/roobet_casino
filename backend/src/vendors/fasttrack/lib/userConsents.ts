import {
  type ConsentType,
  updateConsentForUserId,
  getConsentByUserId,
  createConsent,
  type Consent,
} from 'src/modules/crm/documents/consent'

export interface UserConsents {
  consents: [
    {
      opted_in: boolean
      type: 'email'
    },
    {
      opted_in: boolean
      type: 'sms'
    },
    {
      opted_in: boolean
      type: 'telephone'
    },
    {
      opted_in: boolean
      type: 'postMail'
    },
    {
      opted_in: boolean
      type: 'siteNotification'
    },
    {
      opted_in: boolean
      type: 'pushNotification'
    },
  ]
}

export interface UserConsentsUpdate {
  consents: [
    {
      opted_in: boolean
      type: ConsentType
    },
  ]
}

export const updateConsents = async (
  userId: string,
  consentUpdate: UserConsentsUpdate,
) => {
  const [{ type, opted_in }] = consentUpdate.consents
  await updateConsentForUserId(userId, { [type.toLowerCase()]: opted_in })
}

export const getConsents = async (
  userId: string,
): Promise<UserConsents | null> => {
  const userConsents = await getConsentByUserId(userId)
  if (!userConsents) {
    const createdUserConsents = await createConsent(userId)

    // If for some reason the record was unable to be created, return a default value
    if (!createdUserConsents) {
      return {
        consents: [
          {
            opted_in: true,
            type: 'email',
          },
          {
            opted_in: false,
            type: 'sms',
          },
          {
            opted_in: false,
            type: 'telephone',
          },
          {
            opted_in: false,
            type: 'postMail',
          },
          {
            opted_in: true,
            type: 'siteNotification',
          },
          {
            opted_in: false,
            type: 'pushNotification',
          },
        ],
      }
    }
    return getConsentReponse(createdUserConsents)
  }
  return getConsentReponse(userConsents)
}

const getConsentReponse = (userConsents: Consent): UserConsents => {
  return {
    consents: [
      {
        opted_in: userConsents.email,
        type: 'email',
      },
      {
        opted_in: userConsents.sms,
        type: 'sms',
      },
      {
        opted_in: userConsents.telephone,
        type: 'telephone',
      },
      {
        opted_in: userConsents.postMail,
        type: 'postMail',
      },
      {
        opted_in: userConsents.siteNotification,
        type: 'siteNotification',
      },
      {
        opted_in: userConsents.pushNotification,
        type: 'pushNotification',
      },
    ],
  }
}
