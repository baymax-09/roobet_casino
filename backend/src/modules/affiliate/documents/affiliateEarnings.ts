import moment from 'moment'

import { megaloMongo } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

import { affiliateLogger } from '../lib/logger'

// For now, these interfaces are identical.
interface AffiliateEarnings {
  affiliateUserId: string
  referralUserId: string
  referralUsername: string
  amount: number
}

const AffiliateEarningsSchema = new megaloMongo.Schema<AffiliateEarnings>(
  {
    affiliateUserId: { type: String, required: true },
    referralUserId: { type: String, required: true },
    referralUsername: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// Since this data is not needed after 30 days, expire after a month.
AffiliateEarningsSchema.index({ createdAt: 1 }, { expires: '31d' })
AffiliateEarningsSchema.index({ affiliateUserId: 1, referralUsername: 1 })

const AffiliateEarningsModel = megaloMongo.model<AffiliateEarnings>(
  'affiliate_earnings',
  AffiliateEarningsSchema,
  'affiliate_earnings',
)

export const safelyRecordAffiliateEarnings = (
  document: AffiliateEarnings,
): void => {
  AffiliateEarningsModel.create(document).catch(error => {
    affiliateLogger('safelyRecordAffiliateEarnings', {
      userId: document.referralUserId,
    }).error('failed to write to balances history collection', error)
  })
}

interface AffiliateEarningsAggregatePerReferral {
  sum: number
  username: string
}

interface AffiliateEarningsAggregatePerDay {
  sum: number
  time: string
}

interface AffiliateEarningsAggregate {
  earningsPerUser: AffiliateEarningsAggregatePerReferral[]
  earningsPerDay: AffiliateEarningsAggregatePerDay[]
}

/**
 * NOTE: we add 26 h and not 1 d because 1 d will not get you across daylight savings change.
 */
const getNextDaySafeDST = (time: string) =>
  moment(time).utc().add(26, 'h').startOf('d').toISOString()

/**
 * Need to fill in missing days of activity so the x-axis on the Affiliate Report looks correct.
 */
export const fillMissingDays = (
  sparseEarnings: AffiliateEarningsAggregatePerDay[],
  startDateIso: string,
  daysAgo: number,
): AffiliateEarningsAggregatePerDay[] => {
  if (sparseEarnings.length === 0) {
    return []
  }

  // Make sure the first and last day are in the earnings list
  // Is the first day in the earnings the first day of the range?
  if (sparseEarnings.at(0)?.time !== startDateIso) {
    sparseEarnings.unshift({
      sum: 0,
      time: startDateIso,
    })
  }

  const lastTimeIso = moment(startDateIso)
    .utc()
    .startOf('day')
    .add(daysAgo - 1, 'd')
    .toISOString()
  if (sparseEarnings.at(-1)?.time !== lastTimeIso) {
    sparseEarnings.push({
      sum: 0,
      time: lastTimeIso,
    })
  }

  // Fill in missing days so the x-axis of the affiliate chart is regular.
  const partialEarnings = sparseEarnings.reduce<
    AffiliateEarningsAggregatePerDay[]
  >((acc, curr, index) => {
    if (index < sparseEarnings.length - 1) {
      let nextDay = getNextDaySafeDST(curr.time)
      const filler: AffiliateEarningsAggregatePerDay[] = []

      // Conditional loops can easily become infinite loops
      let sentinel = daysAgo
      while (nextDay !== sparseEarnings[index + 1].time) {
        filler.push({ time: nextDay, sum: 0 })
        nextDay = getNextDaySafeDST(nextDay)
        // Safeguard against infinite loops, if we have filled more than the
        // total number of days we wanted, then something has gone wrong.
        // Just return what we had, like the other base case.
        sentinel -= 1
        if (sentinel < 0) {
          return [...acc, curr]
        }
      }
      return [...acc, curr, ...filler]
    }
    return [...acc, curr]
  }, [])

  return partialEarnings
}

export const getAffiliateEarningsAggregate = async (
  affiliateUserId: string,
  daysAgo: number,
): Promise<AffiliateEarningsAggregate> => {
  const startDateIso = moment()
    .subtract(daysAgo - 1, 'days')
    .utc()
    .startOf('day')
    .toISOString()

  const commonAggregationPipeline = [
    // Find affiliate earnings records since the start date for the affiliate.
    {
      $match: {
        affiliateUserId,
        createdAt: { $gte: new Date(startDateIso) },
      },
    },
  ]

  const earningsPerDayAggregationPipeline = [
    ...commonAggregationPipeline,
    {
      // Add the short hand day to each record.
      $addFields: {
        day: {
          $dateToString: {
            format: '%Y-%m-%dT00:00:00.000Z',
            date: '$createdAt',
          },
        },
      },
    },
    {
      // Group each record by the day and sum the amount of earnings.
      $group: {
        _id: '$day',
        sum: {
          $sum: '$amount',
        },
      },
    },
    {
      // Add the short hand day as the expected field 'time'.
      $addFields: {
        time: '$_id',
      },
    },
    {
      // Sort by day in ascending order.
      $sort: {
        time: 1 as const,
      },
    },
  ]

  const earningsPerUserAggregationPipeline = [
    ...commonAggregationPipeline,
    {
      // Group each record by the referral username and sum the amount of earnings.
      $group: {
        _id: '$referralUsername',
        sum: {
          $sum: '$amount',
        },
      },
    },
    // Add the username as the expected field 'username'.
    {
      $addFields: {
        username: '$_id',
      },
    },
    {
      // Sort by referral value in descending order.
      $sort: {
        total: -1 as const,
      },
    },
  ]

  const [earningsPerUser, earningsPerDaySparse] = await Promise.all([
    AffiliateEarningsModel.aggregate(earningsPerUserAggregationPipeline).exec(),
    AffiliateEarningsModel.aggregate(earningsPerDayAggregationPipeline).exec(),
  ])

  const earningsPerDay = fillMissingDays(
    earningsPerDaySparse,
    startDateIso,
    daysAgo,
  )

  return { earningsPerDay, earningsPerUser }
}

export const schema: DBCollectionSchema = {
  db: 'megalomongo',
  name: AffiliateEarningsModel.collection.name,
}
