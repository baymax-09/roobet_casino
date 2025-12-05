import _ from 'underscore'
import {
  type RArray,
  type RTable,
  type RTableSlice,
  type ChangeEvent,
  type RStream,
  type RDatum,
} from 'rethinkdbdash'
import * as EmailValidator from 'email-validator'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import xssFilters from 'xss-filters'
import { type DeepPartial } from 'ts-essentials'
import { type Types } from 'mongoose'

import { addNoteToUser } from 'src/modules/admin/documents/user_notes'
import { APIValidationError } from 'src/util/errors'
import { countAllByCode } from 'src/modules/promo/documents/promo_code'
import { createUserPassword } from 'src/modules/auth'
import {
  getLevels,
  getRequiredWagerForLevel,
  type RoowardTimespan,
} from 'src/modules/roowards'
import { getSystemSetting } from 'src/modules/userSettings'
import { incrementGlobalStat } from 'src/modules/siteSettings'
import { io, config, winston, r } from 'src/system'
import { isValidKYCLevel, KYC } from 'src/modules/fraud/kyc'
import { recordDailyGlobalStat } from 'src/modules/stats'
import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { recursiveChangefeedHandler } from 'src/util/rethink'
import { type DBCollectionSchema } from 'src/modules'
import { BasicCache, Cooldown } from 'src/util/redisModels'
import { Email } from 'src/modules/email'
import { bans } from 'src/modules/chat/documents/chat_bans'
import { isValidUserDetailField } from 'src/vendors/fasttrack/lib'
import {
  publishUserBlockMessageToFastTrack,
  publishUserUpdateMessageToFastTrack,
} from 'src/vendors/fasttrack'
import { getRole, getRoles } from 'src/modules/rbac/documents/RBACRoles'

import {
  getBalanceFromUserAndType,
  balanceTypeToUserObjectBalanceField,
  validateAndGetBalanceType,
  isPortfolioBalanceType,
} from '../balance'

import {
  type TransactionType,
  createTransaction,
  type TransactionMeta,
} from './transaction'
import {
  type UserObjectBalanceType,
  type BalanceType,
  type User as UserType,
  type DisplayUser,
  type DBUser,
  type AdminLookup,
} from '../types'
import { type SignupOptions } from '../lib/signup'

import { userIsLocked } from '../lib/lock'
import { archiveAndDeleteManyAccounts } from './archive'
import { userLogger } from '../lib/logger'
import { createRakeboost } from 'src/modules/rewards/documents/rakeboost'

interface ChangeUserBalanceInterface {
  user: UserType
  amount: number
  balanceType: UserObjectBalanceType
  allowNegative?: boolean
}

/**
 * Do not use my exported value outside of this file. Please do not follow this pattern.
 */
export const User = r.table<DBUser>('users')

export async function updateLastDeposit(userId: string) {
  await User.get(userId).update({ lastDeposit: r.now() }).run()
}

export async function getTestUser() {
  if (config.testUserId) {
    return await getUserById(config.testUserId)
  }
  const [user] = await User.filter({}, { default: true }).limit(1).run()
  return await hydrateDBUser(user)
}

export function userHasDeposited(user: UserType): boolean {
  return (user.hiddenTotalDeposited || 0) > 0
}

export async function getHVAndVIP() {
  return await User.getAll('VIP', 'HV', { index: 'role' }).run()
}

export async function getNuevoVIP(vipThreshold: number) {
  return await User.between(r.now().sub(60 * 60 * 24 * 7), r.now(), {
    index: 'createdAt',
  })
    .filter(r.row('hiddenTotalDeposited').gt(vipThreshold))
    .run()
}

/**
 * Adds sane defaults to optional properties on the user record. Please expand this as you go.
 */
export const hydrateDBUser = async (
  dbUser: DBUser | null,
): Promise<UserType | null> => {
  if (!dbUser) {
    return dbUser
  }

  const zeroDefaultValues = [
    'hiddenTotalDeposits',
    'hiddenTotalDeposited',
    'hiddenTotalWithdrawn',
    'hiddenTotalBet',
    'hiddenTotalBets',
    'hiddenTotalWon',
    'totalTipped',
    'totalTipsReceived',
    'offerDeposits',
    'offerDeposited',
    'promosClaimed',
    'balance',
    'ethBalance',
    'ltcBalance',
    'cashBalance',
    'refCount',
    'affiliateUnpaid',
  ] as const

  const hydratedUser = zeroDefaultValues.reduce(
    (user, key) => ({
      ...user,
      [key]: dbUser[key] ?? 0,
    }),
    dbUser as UserType,
  )

  // Serialize kycRequiredLevel as a number
  const kycRequiredLevel = (() => {
    const serialized = parseInt(`${hydratedUser.kycRequiredLevel}`)

    return isValidKYCLevel(serialized) ? serialized : 0
  })()

  return {
    ...hydratedUser,
    selectedBalanceType: validateAndGetBalanceType({
      balanceIdentifier: dbUser.selectedBalanceField,
    }),
    kycRequiredLevel,
  }
}

export async function getUserById(userId: string) {
  const dbUser = await User.get(userId).run()
  return await hydrateDBUser(dbUser)
}

export async function getUsers({
  filter,
  isStaff,
}: {
  filter: Partial<DBUser>
  isStaff?: boolean | null
}): Promise<UserType[]> {
  // 🤮 Rethink belongs in the trash.
  let usersQuery: RTable<DBUser, any> | RTableSlice<DBUser, any> = User

  // Bespoke logic for the isStaff filter.
  // If the flag is undefined, ignore it.
  if (isStaff !== undefined) {
    // If the flag is true, filter by staff members.
    if (isStaff) {
      // Using a `getAll` to use the staff index.
      usersQuery = usersQuery.getAll(true, { index: 'staff' })
      // Otherwise, if the flag is false, then filter for users without this flag.
    } else if (isStaff === false) {
      usersQuery = usersQuery.filter(r.row.hasFields('staff').not())
    }
  }
  usersQuery = usersQuery.filter(filter)

  const users = await usersQuery.run()
  // This is `as UserType[]` because it's not possible for `users` entries to include `null`.
  return (await Promise.all(
    users.map(async user => await hydrateDBUser(user)),
  )) as UserType[]
}

export async function getUserNameById(userId: string) {
  const dbUser = await User.get(userId).run()
  if (!dbUser) {
    return null
  }
  return dbUser.name
}

export async function assertUserCanViewProfile(
  requestingUserId: string,
  userId: string,
) {
  const user = await getUserById(userId)
  if (!user || (user.profileIsPrivate && requestingUserId !== userId)) {
    throw new APIValidationError('user__profile_private')
  }
  return user
}

export async function getMultipleUsers(userIds: string[]) {
  return await User.getAll(r.args(userIds)).run()
}

export async function getAllUsersByUserNameLowerCase(userNames: string[]) {
  const userNamesLowerCase = userNames.map(userName =>
    userName.toLowerCase().trim(),
  )
  const users = await User.getAll(r.args(userNamesLowerCase), {
    index: 'nameLowercase',
  }).run()
  return users
}

export async function getAllUserIdsByUserNamesLowerCase(
  userNames: string[],
): Promise<string[]> {
  const userNamesLowerCase = userNames.map(userName =>
    userName.toLowerCase().trim(),
  )
  const userIds = await User.getAll(r.args(userNamesLowerCase), {
    index: 'nameLowercase',
  })
    .pluck('id')
    .run()
  return userIds
}

export async function getPublicUserProfile(
  requestingUser: UserType,
  user: UserType,
) {
  const viewingUserIsStaff = !!requestingUser.staff

  const profileSettings = await getSystemSetting(user.id, 'profile', 'editable')

  const userStats = {
    totalBets: user.hiddenTotalBets,
    totalBet: user.hiddenTotalBet,
    totalTipped: user.totalTipped,
    roowardsClaimed: user.roowardsClaimed,
  }

  const extraData: Partial<{
    totalBet: number
    totalBets: number
    totalTipped: number
    roowardsClaimed: number
    /* @deprecated: Remove after redesign is complete. */
    totalMuteCount: number
    /* @deprecated: Remove after redesign is complete. */
    totalBanCount: number
    roowardsLevels: {
      d: number
      w: number
      m: number
    }
  }> = {}

  const shouldReturnStats: boolean = (() => {
    // Always return stats for self or staff.
    if (requestingUser.id === user.id || viewingUserIsStaff) {
      return true
    }

    // Always hide for these roles.
    if (user.role === 'VIP' || user.role === 'HV') {
      return false
    }

    return profileSettings?.showProfileInfo
  })()

  if (shouldReturnStats) {
    extraData.totalBets = userStats.totalBets
    extraData.totalBet = userStats.totalBet
    extraData.totalTipped = userStats.totalTipped
    extraData.roowardsClaimed = userStats.roowardsClaimed

    // Append current rooward levels.
    const roowardsLevels = await getLevels(user, true)

    extraData.roowardsLevels = {
      /* eslint-disable id-length */
      d: roowardsLevels.d.level,
      w: roowardsLevels.w.level,
      m: roowardsLevels.m.level,
      /* eslint-enable id-length */
    }
  }

  if (viewingUserIsStaff) {
    const banStatus = await bans.getChatBanStatus(user.id)
    extraData.totalMuteCount = banStatus?.muteCount ?? 0
    extraData.totalBanCount = banStatus?.banCount ?? 0
  }

  const payload = {
    name: user.name,
    id: user.id,
    createdAt: user.createdAt,
    hidden: !shouldReturnStats,
    /* @deprecated: Remove after redesign is complete. */
    selfStats: requestingUser.id === user.id ? userStats : null,
    ...extraData,
  }

  return payload
}

export async function getUserForDisplay(user: UserType) {
  const displayUser: DisplayUser = {
    chatLabel: user.chatLabel,
    name: user.name,
    hasChatModBadge: user.hasChatModBadge,
    hasChatDevBadge: user.hasChatDevBadge,
    id: user.id,
  }
  return displayUser
}

export async function getUserForDisplayById(
  userId: string,
): Promise<DisplayUser> {
  const user = await getUserById(userId)
  if (!user) {
    return { name: 'Hidden', id: 'hidden' }
  }
  return await getUserForDisplay(user)
}

export async function emailAlreadyInUse(userId: string, email: string) {
  return (
    (await User.getAll(email, { index: 'email' })
      .filter(r.row('id').ne(userId))
      .count()
      .run()) > 0
  )
}

export async function userExistsByName(name: string) {
  return await User.getAll(name, { index: 'nameLowercase' })
    .count()
    .run()
    .then((count: number) => count > 0)
}

export async function getUserByName(
  username: string,
  caseInsensitive: boolean,
) {
  username = username.trim()
  const [user] = caseInsensitive
    ? await User.getAll(username.toLowerCase(), {
        index: 'nameLowercase',
      }).run()
    : await User.getAll(username, { index: 'name' }).run()
  return await hydrateDBUser(user)
}

export const getUserIdByName = async (
  username: string,
  caseInsensitive: boolean,
): Promise<string | undefined> => {
  const [user] = caseInsensitive
    ? await User.getAll(username.toLowerCase(), { index: 'nameLowercase' })
        .pluck('id')
        .run()
    : await User.getAll(username, { index: 'name' }).pluck('id').run()

  return user?.id
}

export const getUserByIdOrName = async (
  id: string | undefined,
  username: string | undefined,
  caseInsensitive: boolean,
) => {
  if (id) {
    return await getUserById(id)
  }

  if (username) {
    return await getUserByName(username, caseInsensitive)
  }

  return null
}

export async function incrementTotalTipsReceived(
  userId: string,
  amount: string,
) {
  await updateUser(userId, {
    totalTipsReceived: r
      .row('totalTipsReceived')
      .add(parseFloat(amount))
      .default(parseFloat(amount)),
  })
}

export async function incrementTotalTipped(userId: string, amount: number) {
  await updateUser(userId, {
    totalTipped: r
      .row('totalTipped')
      .add(parseFloat(`${amount}`))
      .default(parseFloat(`${amount}`)),
  })
}

export const incrementUserField = async (
  userId: string,
  field: keyof UserType,
) => {
  await updateUser(userId, { [field]: r.row(field).add(1).default(1) })
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  countryCode: string,
  hasPassword: boolean,
  _opts?: SignupOptions,
): Promise<UserType | null> {
  const opts: Required<SignupOptions> = {
    dob: false,
    freeBalance: true,
    mustSetName: false,
    r: undefined,
    locale: null,
    apiUrl: config.appSettings.backendBase,
    returnUrl: config.appSettings.frontendBase,
    ..._opts,
  }

  // @ts-expect-error This is expecting an id property
  const toInsert: DBUser = {
    name: username,
    nameLowercase: username.toLowerCase(),
    createdAt: r.now(),
    lastLogin: r.now(),
    email,
    emailVerified: false,
    balance: 0,
    /** @todo: the config was setting this to 'ethBalance' but this is not our true default, it's crypto */
    selectedBalanceField: 'ethBalance',
    level: 0,
    totalDeposited: 0,
    authNonce: 0,
    totalWon: 0,
    totalWithdrawn: 0,
    invalidLoginAttempts: 0,
    referralEarnings: 0,
    refCount: 0,
    hiddenTotalWithdrawn: 0,
    hiddenTotalDeposited: 0,
    hiddenTotalDeposits: 0,
    hiddenTotalBet: 0,
    hiddenTotalWon: 0,
    hiddenTotalBets: 0,
    countryCode,
    ...(opts.locale && { locale: opts.locale }),
  }

  if (opts.mustSetName) {
    toInsert.mustSetName = true
  }

  const data = await User.insert(toInsert).run()
  await incrementGlobalStat('signups')
  await recordDailyGlobalStat({ key: 'signups', amount: 1 })
  // return the newly created user
  const newUser = { ...toInsert, id: data.generated_keys[0] }
  const hash = await bcrypt.hash(password, 10)
  const pass256 = crypto.createHash('sha256').update(password).digest('base64')
  await createUserPassword({
    id: newUser.id,
    type: 'password',
    hasPassword,
    hash,
    pass256,
    timestamp: r.now(),
  })

  await Email.signupHooks({
    // @ts-expect-error remove this ignore when toInsert changes are merged
    user: newUser,
    email,
    apiUrl: opts.apiUrl,
    returnUrl: opts.returnUrl,
  })

  if (opts.dob) {
    await KYC.getForUserId(newUser.id)
    await KYC.upsertForUser(newUser.id, { dob: opts.dob })
  }
  return await getUserById(newUser.id)
}

export async function createUserFromSignup(
  username: string,
  email: string,
  password: string,
  countryCode: string,
  hasPassword: boolean,
  _opts?: SignupOptions,
): Promise<UserType | null> {
  const opts: Required<SignupOptions> = {
    dob: false,
    freeBalance: true,
    mustSetName: false,
    r: undefined,
    locale: null,
    apiUrl: config.appSettings.backendBase,
    returnUrl: config.appSettings.frontendBase,
    ..._opts,
  }

  // @ts-expect-error This is expecting an id property
  const toInsert: DBUser = {
    name: username,
    nameLowercase: username.toLowerCase(),
    createdAt: r.now(),
    lastLogin: r.now(),
    email,
    emailVerified: false,
    balance: 0,
    /** @todo: the config was setting this to 'ethBalance' but this is not our true default, it's crypto */
    selectedBalanceField: 'ethBalance',
    level: 0,
    totalDeposited: 0,
    authNonce: 0,
    totalWon: 0,
    totalWithdrawn: 0,
    invalidLoginAttempts: 0,
    referralEarnings: 0,
    refCount: 0,
    hiddenTotalWithdrawn: 0,
    hiddenTotalDeposited: 0,
    hiddenTotalDeposits: 0,
    hiddenTotalBet: 0,
    hiddenTotalWon: 0,
    hiddenTotalBets: 0,
    countryCode,
    ...(opts.locale && { locale: opts.locale }),
  }

  if (opts.mustSetName) {
    toInsert.mustSetName = true
  }

  const data = await User.insert(toInsert).run()
  // return the newly created user
  const newUser = { ...toInsert, id: data.generated_keys[0] }
  const hash = await bcrypt.hash(password, 10)
  const pass256 = crypto.createHash('sha256').update(password).digest('base64')
  await createUserPassword({
    id: newUser.id,
    type: 'password',
    hasPassword,
    hash,
    pass256,
    timestamp: r.now(),
  })

  if (opts.dob) {
    await KYC.getForUserId(newUser.id)
    await KYC.upsertForUser(newUser.id, { dob: opts.dob })
  }
  return await getUserById(newUser.id)
}

export const postSignUpHooks = async ({
  user,
  apiUrl,
  returnUrl,
}: {
  user: DBUser
  apiUrl: string
  returnUrl: string
}) => {
  await incrementGlobalStat('signups')
  await recordDailyGlobalStat({ key: 'signups', amount: 1 })
  await Email.signupHooks({
    // @ts-expect-error remove this ignore when toInsert changes are merged
    user,
    email: user.email,
    apiUrl,
    returnUrl,
  })
  await createRakeboost(user, 'signUp')
}

export async function loginHooks(): Promise<void> {
  await incrementGlobalStat('logins')
  await recordDailyGlobalStat({ key: 'logins', amount: 1 })
}

export async function getUserByEmail(email: string): Promise<UserType | null> {
  email = email.trim()
  if (!email) {
    return null
  }
  const [user] = await User.getAll(email, { index: 'email' }).run()
  return await hydrateDBUser(user)
}

export async function recordStatForUser(
  userId: string,
  key: string,
  value: number,
) {
  const updates = User.get(userId)
    .update({ [key]: r.row(key).add(value).default(value) })
    .run()
  return await updates
}

export async function getUserByIndex(value: string, index: string) {
  const user = (await User.getAll(value, { index }).run())[0]
  return await hydrateDBUser(user)
}

export const takeBalanceFromUserObject = async ({
  user,
  amount,
  balanceType,
  allowNegative = false,
}: ChangeUserBalanceInterface): Promise<{ balance: number }> => {
  amount = Math.abs(amount)

  const balanceReturn = await getBalanceFromUserAndType({
    user,
    balanceType,
  })

  if (isPortfolioBalanceType(balanceReturn.balanceType)) {
    throw new Error('Cannot use this method to deduct a portfolio balance')
  }

  const userBalanceField = balanceTypeToUserObjectBalanceField(
    balanceReturn.balanceType,
  )

  if (amount === 0) {
    return { balance: balanceReturn.balance ?? 0 }
  }

  // For Hub88 and Slotegrator, we need to allow negative balances on reconcile (rollbacks)
  if (allowNegative) {
    // TS: Casting to unknown so the `any` type doesn't bit us.
    const balance: unknown = r.row(userBalanceField).sub(amount + 0.0)

    // TODO should this user be passed into createTransaction?
    const updates = await User.get(user.id)
      .update(
        {
          [userBalanceField]: balance,
        },
        {
          returnChanges: true,
        },
      )
      .run()

    const updatedUser = updates.changes[0]?.new_val

    // TS: Duplicating logic below, but this conditional is highly unlikely.
    if (!updatedUser) {
      throw new APIValidationError('bet__not_enough_balance')
    }

    return { balance: updatedUser[userBalanceField]! }
  }

  if (amount > (balanceReturn.balance ?? 0)) {
    throw new APIValidationError('bet__not_enough_balance')
  }

  /*
   * What is "r.branch?":
   * https://rethinkdb.com/api/javascript/branch
   */
  const balance = r.branch(
    // if balance field is greater than amount
    r.row(userBalanceField).ge(amount),
    // then subtract (amount - fraction of penny) from balance
    r.row(userBalanceField).sub(amount - 0.00000001),
    // return the balance field
    r.row(userBalanceField),
  )

  const updates = await User.get(user.id)
    .update(
      {
        [userBalanceField]: balance,
      },
      {
        returnChanges: true,
      },
    )
    .run()

  if (!updates.changes || !updates.changes.length) {
    throw new APIValidationError('bet__not_enough_balance')
  }
  const newUser = updates.changes[0].new_val
  const oldUser = updates.changes[0].old_val
  if (!newUser || !oldUser) {
    throw new APIValidationError('bet__not_enough_balance')
  }

  if (newUser[userBalanceField] === oldUser[userBalanceField]) {
    throw new APIValidationError('bet__not_enough_balance')
  }

  return { balance: newUser[userBalanceField]! }
}

export async function updateTotalWithdrawn(userId: string, amount: number) {
  await User.get(userId)
    .update({
      totalWithdrawn: r.row('totalWithdrawn').add(amount),
      hiddenTotalWithdrawn: r
        .row('hiddenTotalWithdrawn')
        .add(amount)
        .default(amount),
    })
    .run()
}

export async function decrementMaxWithdraw(userId: string, amount: number) {
  await User.get(userId)
    .update({
      maxWithdraw: r.row('maxWithdraw').sub(amount),
    })
    .run()
}

/**
 * Don't call this function directly, use creditBalance instead
 * @todo move to balance lib.
 */
export async function creditUserId<T extends TransactionType>(
  userId: string,
  amount: number,
  transactionType: T,
  meta: TransactionMeta[T],
  balanceTypeOverride: UserObjectBalanceType,
  balanceUpdateTimestamp: Date = new Date(),
) {
  const user = await getUserById(userId)

  if (!user) {
    throw new APIValidationError('user__invalid_id')
  }

  return await creditUser(
    user,
    amount,
    transactionType,
    meta,
    balanceTypeOverride,
    balanceUpdateTimestamp,
  )
}

interface SetRoowardLevelParams {
  userId: string
  type: RoowardTimespan
  level: number
}

export async function setUserRoowardLevel({
  userId,
  type,
  level,
}: SetRoowardLevelParams): Promise<void> {
  const user = await getUserById(userId)
  if (!user) {
    throw new APIValidationError(`User with id ${userId} not found.`)
  }
  const { roowardsBonus, hiddenTotalBet } = user

  // If roowardsBonus is set to true, we're going to set this to zero.
  // We have to explicitly cast this as a Number and check if it's NaN to account for values undefined | false | number.
  const currentBonus: number =
    roowardsBonus === true || Number.isNaN(Number(roowardsBonus))
      ? 0
      : Number(roowardsBonus)
  const requiredWagerForLevel = getRequiredWagerForLevel({ type, level })
  const additionalBonusRequired = Math.ceil(
    requiredWagerForLevel - (Number(hiddenTotalBet) || 0) - currentBonus,
  )
  if (currentBonus + additionalBonusRequired < 0) {
    throw new APIValidationError('Cannot set a negative Roowards level')
  }

  await updateUser(userId, {
    roowardsBonus: r
      .row('roowardsBonus')
      .add(additionalBonusRequired)
      .default(additionalBonusRequired),
  })
}

/** @todo move to balance lib. */
export async function creditUser<T extends TransactionType>(
  user: UserType,
  amount: number,
  transactionType: T,
  meta: TransactionMeta[T],
  userBalanceType: UserObjectBalanceType,
  balanceUpdateTimestamp: Date = new Date(),
) {
  // @ts-expect-error TODO this is not needed but I don't want to change such critical code
  amount = parseFloat(amount)
  if (amount < 0) {
    return
  }

  return await updateUserObjectBalanceAndTransaction(
    user,
    amount,
    transactionType,
    meta,
    userBalanceType,
    false,
    balanceUpdateTimestamp,
  )
}

export async function updateUser(
  userId: string,
  updateObj: DeepPartial<DBUser>,
): Promise<void> {
  await User.get(userId).update(updateObj).run()
}

export async function setUserRoles(
  userId: string,
  roleIds: Types.ObjectId[],
): Promise<void> {
  const user = await getUserById(userId)
  if (!user) {
    return
  }

  const roles = await getRoles({ ids: roleIds })
  await updateUser(userId, { roles: roles.map(role => role.slug) })
}

export async function updateUserRole(
  userId: string,
  roleId: string,
): Promise<void> {
  const user = await getUserById(userId.toString())
  const existingRolesOnUser = user?.roles ?? []

  const role = await getRole(roleId)

  if (!role) {
    return
  }
  // add role to user if doesn't exist already on user
  if (
    role?.userIds.includes(userId) &&
    !existingRolesOnUser.includes(role?.slug)
  ) {
    await updateUser(userId.toString(), {
      roles: [...existingRolesOnUser, role?.slug],
    })
  } else if (
    !role?.userIds?.includes(userId) &&
    existingRolesOnUser.includes(role?.slug)
  ) {
    // remove role from user if they are not on the authorized Users list
    const updatedRoles = existingRolesOnUser.filter(
      currentRole => currentRole !== role?.slug,
    )
    await updateUser(userId.toString(), { roles: updatedRoles })
  }
}

export const removeFieldFromUser = async (
  userId: string,
  field: keyof DBUser,
) => {
  await User.get(userId).replace(r.row.without(field)).run()
}

export const getAllLockedUsers = async () => {
  let rows: DBUser[] = []
  let skip = 0
  const LIMIT = 1000
  while (true) {
    const query = User.between(getCurrentDateTimeISO(), r.maxval, {
      index: 'lockedUntil',
    })
      .orderBy('createdAt')
      .skip(skip)
      .limit(LIMIT)
    const chunk: DBUser[] = await query.run()
    if (LIMIT > chunk.length) {
      break
    }
    rows = rows.concat(chunk)
    skip += LIMIT
  }
  return rows
}

/** @returns true if user was updated and false if not */
export async function lockOrUnlockUser<T extends boolean>(
  userId: string,
  isLocked: T,
  lockReason?: T extends true ? string : undefined,
): Promise<boolean> {
  const result = await User.get(userId)
    .update({
      lockedUntil: isLocked ? '2070-01-01T01:00:00.000Z' : null,
      lockReason,
    })
    .run()
  return result.unchanged === 0
}

export async function updateUsers(
  userIds: string[],
  updateObj: Partial<UserType>,
): Promise<void> {
  await User.getAll(r.args(userIds)).update(updateObj).run()
}

export async function updateUserBetStats(
  userId: string,
  betAmount: number,
  wonAmount: number,
): Promise<void> {
  await User.get(userId)
    .update({
      hiddenTotalBet: r.row('hiddenTotalBet').add(betAmount).default(betAmount),
      hiddenTotalWon: r.row('hiddenTotalWon').add(wonAmount).default(wonAmount),
      hiddenTotalBets: r.row('hiddenTotalBets').add(1).default(1),
    })
    .run()
}

export async function updateUserSportsBetStats(
  userId: string,
  betAmount: number,
  wonAmount: number,
): Promise<void> {
  await User.get(userId)
    .update({
      hiddenSportsTotalBet: r
        .row('hiddenSportsTotalBet')
        .add(betAmount)
        .default(betAmount),
      hiddenSportsTotalWon: r
        .row('hiddenSportsTotalWon')
        .add(wonAmount)
        .default(wonAmount),
      hiddenSportsTotalBets: r.row('hiddenSportsTotalBets').add(1).default(1),
    })
    .run()
}

/** @todo move out of this file and into the balance lib. */
export async function updateUserObjectBalanceAndTransaction<
  T extends TransactionType,
>(
  user: UserType,
  amount: number,
  type: T,
  meta: TransactionMeta[T],
  balanceType: UserObjectBalanceType,
  replace = false,
  balanceUpdateTimestamp: Date = new Date(),
): Promise<{ transactionId: string }> {
  if (isPortfolioBalanceType(balanceType)) {
    throw new Error(
      'Cannot update a user portfolio balance, use a different method',
    )
  }

  const updatedUserBalance = await updateUserObjectBalance(
    user,
    amount,
    balanceType,
    replace,
  )
  if (!updatedUserBalance) {
    userLogger('updateUserObjectBalanceAndTransaction', {
      userId: user.id,
    }).error(`Failed to update user balance`, {
      amount,
      type,
      balanceType,
    })
    throw new Error('User object balance was not updated')
  }

  const { resultantBalance, previousBalance } = updatedUserBalance
  // The amount on the transaction needs to be a delta.
  const delta = replace ? resultantBalance - previousBalance : amount
  return await createTransaction({
    user,
    amount: delta,
    transactionType: type,
    meta,
    balanceType,
    resultantBalance,
    balanceUpdateTimestamp,
  })
}

export async function updateUserObjectBalance(
  user: UserType,
  amount: number,
  userBalanceType: UserObjectBalanceType,
  replace = false,
): Promise<{ previousBalance: number; resultantBalance: number } | undefined> {
  const userBalanceField = balanceTypeToUserObjectBalanceField(userBalanceType)

  const balance = replace
    ? amount
    : r.row(userBalanceField).add(amount).default(amount)
  const toUpdate = {
    [userBalanceField]: balance,
  }
  const { changes, unchanged } = await User.get(user.id)
    .update(toUpdate, { returnChanges: true })
    .run()

  // If we set their balance to what it already is or add 0, that is not a problem.
  if (unchanged) {
    return {
      previousBalance: amount,
      resultantBalance: amount,
    }
  }

  // If we don't change a user and also don't have any unchanged users, something went wrong.
  if (!changes.length) {
    return undefined
  }

  const [{ new_val, old_val }] = changes
  const resultantBalance = new_val[userBalanceField]
  // This will only be undefined if the user has never had a balance, so they have a zero balance.
  const previousBalance = old_val[userBalanceField] ?? 0
  if (resultantBalance === undefined) {
    return undefined
  }

  return {
    previousBalance,
    resultantBalance,
  }
}

export async function nameChange(user: UserType, name: string): Promise<void> {
  if (!user.mustSetName) {
    throw new APIValidationError('user__name_reset')
  }
  name = name
    .replace(/<(?:.|\n)*?>/gm, '')
    .replace(/\W/g, '')
    .trim()
  name = name.replace(' ', '')
  name = xssFilters.inHTMLData(name)
  if (name.length < 2) {
    throw new APIValidationError('user__name_longer')
  }
  if (name.length > 20) {
    throw new APIValidationError('user__name_shorter')
  }

  const existing = await getUserByName(name, true)
  if (existing && existing.id !== user.id) {
    throw new APIValidationError('user__name_exists')
  }

  const promoCodesWithName = await countAllByCode(name.toLowerCase())
  if (promoCodesWithName > 0) {
    throw new APIValidationError('user__already_exists')
  }

  await updateUser(user.id, {
    name,
    nameLowercase: name.toLowerCase(),
    mustSetName: false,
  })
}

/**
 * if the user is verified, don't let them change so fast.
 * if the user isn't verified, we want to allow them to get verified faster.
 */
export async function updateUserEmail({
  user,
  email,
  apiUrl,
  returnUrl,
}: {
  user: UserType
  email: string
  apiUrl: string
  returnUrl: string
}): Promise<{ email: string }> {
  if (!email) {
    throw new APIValidationError('api__missing_param', ['Email'])
  } else if (user.emailVerified) {
    throw new APIValidationError('auth__cannot_change_email')
  }

  const updatedEmail = email.toLowerCase().replace(/\s/g, '')
  if (!updatedEmail.length) {
    throw new APIValidationError('api__missing_param', ['Email'])
  }

  const cooldown = await Cooldown.check(`setEmail:${user.id}`)

  if (cooldown > 0) {
    throw new APIValidationError(
      user.emailVerified
        ? 'auth__email_cooldown_verified'
        : 'auth__email_cooldown',
    )
  }

  await emailChange({ user, email: updatedEmail, apiUrl, returnUrl })
  await Cooldown.set(`setEmail:${user.id}`, user.emailVerified ? 60 * 10 : 15)

  if (user.email !== updatedEmail) {
    addNoteToUser(user.id, user, `Set email to ${updatedEmail}`, 'userAction')
  }

  return { email: updatedEmail }
}

export async function emailChange({
  user,
  email,
  apiUrl,
  returnUrl,
}: {
  user: UserType
  email: string
  apiUrl: string
  returnUrl: string
}): Promise<void> {
  if (!email || !EmailValidator.validate(email)) {
    throw new APIValidationError('invalid__email')
  }

  // User is changing email and requesting verification.
  if (email !== user.email) {
    if (await getUserByEmail(email)) {
      throw new APIValidationError('user__already_exists_email')
    }

    await User.get(user.id).update({ email, emailVerified: false }).run()
  }

  await Email.sendVerificationEmail({
    user,
    email,
    apiUrl,
    returnUrl,
  })
}

export const deleteUser = async (userId: string) => {
  await User.get(userId).delete().run()
}

export const deleteManyUsers = async (userIds: string[]) => {
  return await User.getAll(r.args(userIds)).delete().run()
}

const filterOutStaffMembers = (user: RDatum<DBUser>) => {
  return user.hasFields('staff').not()
}

async function cleanupOldUsers() {
  // delete users who have ~0 balance, no email, and are over 14 days from last login
  const users = await User.between(r.minval, r.now().sub(60 * 60 * 24 * 14), {
    index: 'lastLogin',
  })
    .filter(r.row('balance').lt(0.01))
    .filter(r.row('ethBalance').lt(0.01))
    .filter(r.row('ltcBalance').lt(0.01))
    .filter({ hiddenTotalDeposited: 0 })
    .filter({ hiddenTotalBet: 0 })
    .filter({ refCount: 0 })
    .filter(r.row.hasFields('isSponsor').not())
    .filter(user => filterOutStaffMembers(user))
    .run()

  const hydratedUsers = (
    await Promise.all(users.map(async user => await hydrateDBUser(user)))
  ).map(user => user!)

  const deletedResult = await archiveAndDeleteManyAccounts(hydratedUsers)

  userLogger('cleanupOldUsers', { userId: null }).info(
    `Removed ${deletedResult.deleted} old users`,
  )
}

async function resetUserLoginAttempts() {
  await User.between(1, r.maxval, { index: 'invalidLoginAttempts' })
    .update({ invalidLoginAttempts: 0 })
    .run()
  userLogger('resetUserLoginAttempts', { userId: null }).info(
    'Reset user::invalidLoginAttempts',
  )
}

function newUsersFeed() {
  return r.table('users').changes().run()
}

async function handleFastTrackChanges(
  userId: string,
  userKey: keyof DBUser,
  newVal: DBUser,
) {
  // Publish message to RabbitMQ when one of the Operator API User Details fields has updated
  if (isValidUserDetailField(userKey)) {
    if (userKey === 'lockedUntil') {
      const userLocked = await userIsLocked(newVal)
      if (userLocked) {
        // Publish message to RabbitMQ that user account has been blocked
        publishUserBlockMessageToFastTrack(userId)
      } else {
        // Publish message to RabbitMQ that user account has been unblocked
        publishUserBlockMessageToFastTrack(userId)
      }
    } else {
      publishUserUpdateMessageToFastTrack(userId)
    }
  }
}

async function handleNewChange(change: ChangeEvent<DBUser>) {
  if (change && change.new_val) {
    if (change.old_val) {
      const newObject: Partial<DBUser & { selectedBalanceType: BalanceType }> =
        {}
      const userId = change.new_val.id

      for (const key of Object.keys(change.new_val)) {
        const userKey = key as keyof DBUser
        if (!_.isEqual(change.new_val[userKey], change.old_val[userKey])) {
          if (userKey === 'selectedBalanceField') {
            newObject.selectedBalanceType = validateAndGetBalanceType({
              balanceIdentifier: change.new_val[userKey],
            })
          }
          handleFastTrackChanges(userId, userKey, change.new_val)
          // @ts-expect-error god help you
          newObject[userKey] = change.new_val[userKey]
        }
      }
      io.to(userId).emit('user_change', newObject)
    }
    if (change.old_val && change.old_val.name !== change.new_val.name) {
      io.emit('user_name_change', change.new_val.name, change.new_val.id)
    }
  }
}

export async function getCachedUserById(userId: string, exp = 30) {
  return await BasicCache.cached(
    'getCachedUserById',
    `${userId}-${exp}`,
    exp,
    async () => await getUserById(userId),
  )
}

async function userUpdateFeed() {
  const opts = {
    ...config.rethinkdb.changefeedReconnectOptions,
    changefeedName: 'users',
    logger: winston,
  }
  await recursiveChangefeedHandler<UserType>(
    newUsersFeed,
    handleNewChange,
    opts,
  )
}

export const tableSearchUsers = async (
  limit = 25,
  page = 0,
  sortObj: Record<string, any> = { timestamp: -1 },
  filterObj: Partial<DBUser> = {},
): Promise<{
  page: number
  limit: number
  count: number
  data: DBUser[]
}> => {
  const orderBy = Object.entries(sortObj)[0]

  // Important: RethinkDB's .filter does not use secondary indexes,
  // which makes for poor performance queries. To get around this, we are only
  // considering the first filter key/value pair, and assuming it is an index.
  const filterBy = Object.entries(filterObj)[0]

  const query = (order = false) => {
    let query:
      | RTable<DBUser, any>
      | RTableSlice<DBUser, any>
      | RStream<DBUser>
      | RArray<DBUser> = User

    if (filterBy) {
      query = query.getAll(filterBy[1], { index: filterBy[0] })
    }

    if (order && orderBy) {
      const orderByField =
        orderBy[1] === -1 ? r.desc(orderBy[0]) : r.asc(orderBy[0])

      if (!filterBy) {
        // We can use an index.
        query = query.orderBy({ index: orderByField })
      } else {
        // We cannot use index on a slice.
        query = query.orderBy(orderByField)
      }
    }

    return query
  }

  return {
    page,
    limit,
    count: await query().count().run(),
    data: await query(true)
      .skip(page * limit)
      .limit(limit)
      .run(),
  }
}

export const getUserCount = async (): Promise<number> => {
  return await User.count().run()
}
export const updateAdminLookups = async (
  userId: string,
  adminLookups: AdminLookup[],
) => {
  return await User.get(userId).update({ adminLookups }).run()
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: 'users',
  indices: [
    { name: 'name' },
    { name: 'role' },
    { name: 'nameLowercase' },
    { name: 'email' },
    { name: 'balance' },
    { name: 'createdAt' },
    { name: 'lastLogin' },
    { name: 'affiliateId' },
    { name: 'invalidLoginAttempts' },
    { name: 'isSponsor' },
    { name: 'lockedUntil' },
    { name: 'staff' },
  ],
  cleanup: [cleanupOldUsers, resetUserLoginAttempts],
  feeds: [userUpdateFeed],
}

/** @todo stop exporting me */
export default User
