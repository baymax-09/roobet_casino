import { determineSingleFeatureAccess } from 'src/util/features'
import { type User } from 'src/modules/user/types'
// import { isWageringTowardsMatchPromo } from 'src/modules/promo/util'

export const incrementRankWagered = async (user: User, wagerAmount: number) => {
  if (
    await determineSingleFeatureAccess({
      countryCode: '',
      featureName: 'rewardsRedesign',
      user,
    })
  ) {
    // Ranking accumulation disabled during match promo.
    // TODO: Uncomment once logic below is also done.
    // const wageringTowardsMatchPromo = await isWageringTowardsMatchPromo(user.id)
    // if (wageringTowardsMatchPromo) {
    // }
    // TODO: Increment wager amount in new "ranks" collection
  }
}
