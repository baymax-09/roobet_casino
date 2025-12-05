import { config, io } from 'src/system'
import * as User from 'src/modules/user'
import { type Types as UserTypes } from 'src/modules/user'
import { type User as UserRecord } from 'src/modules/user/types'

import { KYC } from './documents'
import {
  type KycValidationResponse,
  type KycNeededResponse,
  type KYCRecord,
  type KycVerificationLevelResult,
  type KYCLevel,
  type VerifiedKYCLevel,
  type KycVerificationResult,
  type KYCLevelsData,
  VerifiedKYCLevels,
  type ManualLevelVerification,
} from './types'
import {
  verifyLevel1,
  verifyLevel2,
  verifyLevel3,
  verifyLevel4,
} from './levels'
import { slackKYCSubmissions } from 'src/vendors/slack'
import { kycUserInfoToString } from 'src/modules/fraud/util'
import { fraudLogger } from '../lib/logger'

export * as Documents from './documents'
export * as Routes from './routes'
export * as AddressVerify from './lib/addressVerify'
export * as KYC from './documents/kyc'
export { getForUser as getKycForUser } from './documents/kyc'
export { type KYCLevel, type VerifiedKYCLevel } from './types'

type KycLevelValidator = (
  userId: string,
  kyc: KYCRecord,
) => Promise<KycVerificationResult>

export const MIN_KYC_LEVEL = 0
export const MAX_KYC_LEVEL = 4

// Some countries are not blocked, only restricted.
export const RestrictedCountries: Readonly<Record<string, string>> = {
  ...config.countryBlocks.list,
  BE: 'Belgium',
}

const VERIFICATION_FNS: KycLevelValidator[] = [
  verifyLevel1,
  verifyLevel2,
  verifyLevel3,
  verifyLevel4,
]

export const sendKYCUploadNotification = async (
  userId: string,
  messages: string | string[],
) => {
  slackKYCSubmissions(
    `KycUpload ${await kycUserInfoToString(userId)} - ${(Array.isArray(messages)
      ? messages
      : [messages]
    ).join(' - ')}`,
  )
}

export const isValidKYCLevel = (level: number): level is KYCLevel => {
  if (isNaN(level)) {
    return false
  }

  return level >= MIN_KYC_LEVEL && level <= MAX_KYC_LEVEL
}

export const checkUserNeedsKyc = (user: UserTypes.User): KycNeededResponse => {
  const response: KycNeededResponse = {
    neededKycLevel: 0,
    kycLevel: user.kycLevel ?? 0,
  }

  if (
    user.hiddenTotalDeposited &&
    user.hiddenTotalDeposited > config.kyc.level2CutoffUSD
  ) {
    response.neededKycLevel = 2
  } else {
    response.neededKycLevel = 1
  }
  const kycRequiredLevel = user.kycRequiredLevel

  if (kycRequiredLevel && kycRequiredLevel > response.neededKycLevel) {
    // @ts-expect-error probably is actually a string if set in an express route
    response.neededKycLevel = Number(kycRequiredLevel)
  }

  return {
    ...response,
    needsKycUpgrade: response.neededKycLevel > response.kycLevel,
    shouldLockBets: response.needsKycUpgrade && response.neededKycLevel >= 2,
  }
}

export const revalidateKycForUser = async (userId: string) => {
  const kyc = await KYC.getForUserId(userId)
  // @ts-expect-error TODO we need to untangle KYC structures
  return await revalidateKycLevel(userId, kyc)
}

const isUserExempted = (user: UserTypes.User): boolean => {
  return !!user.staff
}

export const revalidateKycLevel = async (
  userId: string,
  originalKyc: KYCRecord,
) => {
  const originalUser = await User.getUserById(userId)

  if (!originalUser) {
    fraudLogger('revalidateKycLevel', { userId }).error(
      `No user by id - ${userId}`,
      { originalKyc },
    )
    throw new Error(
      `Failed to revalidate KYC level for unknown user ${userId}.`,
    )
  }

  return await revalidateKycLevelForUser(originalUser, originalKyc)
}

/**
 * Call this every time you want to revalidate 1 or more kyc levels.
 */
export const revalidateKycLevelForUser = async (
  originalUser: UserRecord,
  originalKyc: KYCRecord,
): Promise<KycValidationResponse> => {
  const userId = originalUser.id

  const { kycLevel, validationResults, levels } = await (async (): Promise<{
    kycLevel: KYCLevel
    validationResults: KycVerificationLevelResult[]
    levels: KYCLevelsData
  }> => {
    const refinedOriginalKyc: KYCRecord = isUserExempted(originalUser)
      ? {
          ...originalKyc,
          manualLevelVerification: VerifiedKYCLevels.reduce(
            (acc: ManualLevelVerification, level: VerifiedKYCLevel) => {
              acc[level] = true
              return acc
            },
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {} as ManualLevelVerification,
          ),
        }
      : originalKyc

    let highestKycLevel: KYCLevel = 0
    let highestKycLevelLocked = false

    const validationResults: KycVerificationLevelResult[] = []
    const levels: Partial<KYCLevelsData> = {}

    for (const verificationFn of VERIFICATION_FNS) {
      let { validationResult, level } = await verificationFn(
        userId,
        refinedOriginalKyc,
      )

      // Manually validate verification level, if applicable
      if (
        refinedOriginalKyc.manualLevelVerification?.[validationResult.level]
      ) {
        validationResult = {
          verified: true,
          level: validationResult.level,
          failures: [],
        }
        level = { status: 'complete' }
      }

      // If the current level is not verified, do not continue to increase the users
      // KYC level.
      if (!validationResult.verified) {
        highestKycLevelLocked = true
      }

      if (
        validationResult.verified &&
        validationResult.level > highestKycLevel
      ) {
        const previousResult = validationResults[validationResults.length - 1]

        if (
          !previousResult ||
          (previousResult?.verified && !highestKycLevelLocked)
        ) {
          highestKycLevel = validationResult.level
        }
      }

      validationResults.push(validationResult)
      levels[validationResult.level] = level
    }

    return {
      // TS: We have all the keys present but the indexing is not that intelligent.
      levels: levels as KYCLevelsData,
      kycLevel: highestKycLevel,
      validationResults,
    }
  })()

  // Write new kyc level to user document.
  await User.updateUser(userId, { kycLevel })

  // Write validation results to existing kyc document.
  const newKyc = await KYC.KycModel.findByIdAndUpdate(originalKyc._id, {
    validationResults,
    levels,
  }).lean<KYCRecord>()

  if (!newKyc) {
    throw new Error('Failed to write validation results to KYC Record.')
  }

  const isUserHVorVIP =
    originalUser.role === 'VIP' || originalUser.role === 'HV'

  if (originalUser.kycLevel) {
    // Add note to user on level 2 verification.
    if (originalUser.kycLevel < 2) {
      if (kycLevel === 2) {
        if (originalUser.kycRequiredLevel === kycLevel || isUserHVorVIP) {
          await sendKYCUploadNotification(
            userId,
            `${originalUser.role} Level ${kycLevel} Completed ${
              isUserHVorVIP ? '- with restrictions.' : ''
            } `,
          )
        }
      }
    }

    // Add note to user on level 3 verification.
    if (originalUser.kycLevel < 3) {
      if (kycLevel === 3) {
        if (originalUser.kycRequiredLevel === kycLevel || isUserHVorVIP) {
          await sendKYCUploadNotification(
            userId,
            `${originalUser.role} Level ${kycLevel} Completed ${
              isUserHVorVIP ? '- with restrictions.' : ''
            } `,
          )
        }
      }
    }
  }

  // Notify UI that the kyc data has updated.
  io.to(userId).emit('kycUpdated')

  return { validationResults, kycLevel, newKyc }
}
