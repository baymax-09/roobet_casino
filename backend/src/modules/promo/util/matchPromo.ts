import { getMatchPromoForUser } from '../documents/match_promo'

/**
 * Determines if a user has an active match promo. We don't want accrue any wager progress towards ranks, rewards, etc
 * since their wagers are already going towards another promotion.
 * * @returns {boolean} If the user is making progress towards the match promo or not.
 */
export const isWageringTowardsMatchPromo = async (userId: string) => {
  const userMatchPromo = await getMatchPromoForUser(userId)

  if (!userMatchPromo) {
    return false
  }

  // Wagers only going towards match promo if they are not able to withdraw. Users can't withdrawal with an active promo.
  return !userMatchPromo.canWithdraw
}
