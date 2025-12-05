/**
 * If the user is within one penny of the reward, then they will get it. The reason we are doing this is
 * the `Double` type in mongo isn't meant for handling monetary data.
 * The float arithmetic/approximations aren't accurate.
 * However, being off by 0.00000001 shouldn't stop people from getting their rewards.
 */
export const WAGERED_THRESHOLD = 0.01
