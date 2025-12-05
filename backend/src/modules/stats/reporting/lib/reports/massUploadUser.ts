import moment from 'moment'

import { r } from 'src/system'
import { isSystemEnabled } from 'src/modules/userSettings'
import { User, getUserByIdOrName, userIsLocked } from 'src/modules/user'
import { getCRMByUserId } from 'src/modules/crm/documents/crm'
import {
  getDocuments,
  getLatestDocument,
} from 'src/modules/user/documents/documents'
import { getFirstTimeDepositDate } from 'src/modules/user/documents/transaction'

import { sumUserStatFields } from 'src/modules/stats/documents/userStats'
import { type StatName } from 'src/modules/stats/types'
import { reportingLogger } from '../logger'

export const massUploadUser = async (
  data: Array<{ userId?: string; username?: string }>,
) => {
  const startOfYesterday = moment()
    .subtract(1, 'day')
    .startOf('day')
    .toISOString()
  const endOfYesterday = moment().subtract(1, 'day').endOf('day').toISOString()
  const lastWeek = moment()
    .subtract(1, 'day')
    .subtract(1, 'week')
    .endOf('day')
    .toISOString()
  const exportDate = moment().toISOString()

  // Validate all rows are valid and lookup user record.
  const rows = await Promise.all(
    data.map(async (row, index) => {
      if (!row.userId && !row.username) {
        return {
          error: `Error (row ${
            index + 1
          }): Either userId or username must be supplied.`,
          name: '',
        }
      }

      const user = await getUserByIdOrName(
        row.userId?.trim(),
        row.username?.trim(),
        true,
      )

      if (!user) {
        const idOrName = row.userId || row.username

        return {
          error: `Error (row ${index + 1}): User ${idOrName} does not exist.`,
          name: idOrName,
        }
      }

      return { user }
    }),
  )

  const responses = await Promise.all(
    rows.map(async row => {
      const { user } = row

      try {
        if (!user || row.error) {
          return row
        }

        const fields: StatName[] = [
          'deposited',
          'deposits',
          'withdrawn',
          'withdrawals',
          'totalBet',
          'totalBets',
          'totalWon',
          'tipped',
          'rechargeGiven',
          'manualBonuses',
        ]

        const lastWeekData = await sumUserStatFields(
          user.id,
          lastWeek,
          endOfYesterday,
          fields,
        )
        const ydayStats = await sumUserStatFields(
          user.id,
          startOfYesterday,
          endOfYesterday,
          fields,
        )

        const affiliateFields = await (async () => {
          const fields = {
            affiliateId: user.affiliateId ?? '',
            cxd: '',
            cxAffId: '',
          }

          const crmDoc = await getCRMByUserId(user.id)

          fields.cxd = crmDoc?.cxd ?? ''
          fields.cxAffId = crmDoc?.cxAffId ?? ''

          return fields
        })()

        // The first element will be the  most recent KYC document uploaded
        const kycDocuments = await getDocuments({ userId: user.id })
        const kyc2Documents = await getLatestDocument({
          userId: { $eq: user.id },
          type: { $eq: 'identity' },
          deleted: { $ne: true },
        })
        const kyc3Documents = await getLatestDocument({
          userId: { $eq: user.id },
          type: { $eq: 'address' },
          deleted: { $ne: true },
        })
        const kyc4Documents = await getLatestDocument({
          userId: { $eq: user.id },
          type: { $eq: 'sof' },
          deleted: { $ne: true },
        })
        const kyc2Upload = kyc2Documents[0]
        const kyc3Upload = kyc3Documents[0]
        const kyc4Upload = kyc4Documents[0]

        const lastKYCDocumentUpload =
          kycDocuments.length > 0 ? kycDocuments[0].createdAt : ''
        const lastKYCDocumentApproved =
          kycDocuments.length > 0
            ? kycDocuments.find(doc => doc.status === 'approved')?.reviewedAt ??
              ''
            : ''

        const firstTimeDeposit = await getFirstTimeDepositDate(user.id)

        return {
          error: '',
          exportDate,
          name: user.name,
          refCount: user.refCount,
          refEarnings: user.referralEarnings,
          refUniqueDepositors: await User.getAll(user.id, {
            index: 'affiliateId',
          })
            .filter(r.row('hiddenTotalDeposited').gt(0))
            .count()
            .run(),
          refDeposits: await User.getAll(user.id, { index: 'affiliateId' })
            .sum('hiddenTotalDeposits')
            .run(),
          refDeposited: await User.getAll(user.id, { index: 'affiliateId' })
            .sum('hiddenTotalDeposited')
            .run(),
          refWithdrawn: await User.getAll(user.id, { index: 'affiliateId' })
            .sum('hiddenTotalWithdrawn')
            .run(),
          Withdrawals: user.hiddenTotalWithdrawn,
          Deposits: user.hiddenTotalDeposited,
          Tips: user.totalTipped,
          Bets: user.hiddenTotalBet,
          email: user.email,
          TipsEnabled: await isSystemEnabled(user, 'tip'),
          BetsEnabled: await isSystemEnabled(user, 'bets'),
          WithdrawalsEnabled: await isSystemEnabled(user, 'withdraw'),
          'Last Week Deposit': lastWeekData.deposited,
          'Last Week GGR':
            (lastWeekData?.totalBet ?? 0) - (lastWeekData?.totalWon ?? 0),
          'Yday deposit': ydayStats.deposited,
          'Yday GGR': (ydayStats?.totalBet ?? 0) - (ydayStats?.totalWon ?? 0),
          GGR: (user?.hiddenTotalBet ?? 0) - (user?.hiddenTotalWon ?? 0),
          // TODO this does not include portfolio balance types of cash.
          'Current Balance':
            (user?.ltcBalance ?? 0) +
            (user?.ethBalance ?? 0) +
            (user?.balance ?? 0),
          Country: user.countryCode || 'None',
          Role: user.role || 'None',
          Marketing: user.isMarketing ? 'Yes' : 'No',
          Manager: user.manager || 'None',
          'Account Closed': await userIsLocked(user),
          'Last Bet Date': user.lastBet || 'None',
          isPromoBanned: user.isPromoBanned ? 'Yes' : 'No',
          ...affiliateFields,
          kycLevel: user.kycLevel,
          locked: (await userIsLocked(user)) ? 'yes' : 'no',
          lastDeposit: user.lastDeposit ?? '',
          lastKYCDocumentUpload,
          lastKYCDocumentApproved,
          registrationDate: user.createdAt,
          firstTimeDeposit,
          KYCLevel_2_uploaded_timestamp: kyc2Upload?.createdAt ?? '',
          KYCLevel_2_approved_timestamp:
            kyc2Upload?.status === 'approved'
              ? kyc2Upload?.reviewedAt ?? ''
              : '',
          KYCLevel_2_Automatic:
            (kyc2Upload?.status === 'approved' && !kyc2Upload?.reviewedBy) ??
            '',
          KYCLevel_3_uploaded_timestamp: kyc3Upload?.createdAt ?? '',
          KYCLevel_3_approved_timestamp:
            kyc3Upload?.status === 'approved'
              ? kyc3Upload?.reviewedAt ?? ''
              : '',
          KYCLevel_3_Automatic:
            (kyc3Upload?.status === 'approved' && !kyc3Upload?.reviewedBy) ??
            '',
          KYCLevel_4_uploaded_timestamp: kyc4Upload?.createdAt ?? '',
          KYCLevel_4_approved_timestamp:
            kyc4Upload?.status === 'approved'
              ? kyc4Upload?.reviewedAt ?? ''
              : '',
          KYCLevel_4_Automatic:
            (kyc4Upload?.status === 'approved' && !kyc4Upload?.reviewedBy) ??
            '',
        }
      } catch (error) {
        reportingLogger('massUploadUser', { userId: user?.id ?? null }).error(
          'Error',
          {},
          error,
        )
        return {
          error: error instanceof Error ? error.toString() : 'Unknown error.',
          name: user?.name ?? '',
        }
      }
    }),
  )

  return {
    responses,
    errors: [],
    successes: [],
  }
}
