import process from 'process'
import path from 'path'
import { v1 as uuid } from 'uuid'
import { LoremIpsum } from 'lorem-ipsum'
import { Types } from 'mongoose'
import moment from 'moment'

import {
  r,
  getSchemas,
  initializeMongo,
  migrate,
  mongoose,
  megaloMongo,
  winston,
  redisCache,
} from '../src/system'
import { User, initUserSignup, getUserById } from '../src/modules/user'
import { adminReplaceUserBalance } from '../src/modules/user/balance'
import { placeBet } from '../src/modules/bet'
import * as ChatMod from '../src/modules/chat'
import { createKOTH } from '../src/modules/koth/documents/koths'
import { type DBUser, type User as UserType } from '../src/modules/user/types'
import { getMaxBetForGame, getMinBetForGame } from '../src/modules/game'
import { type HouseGameName } from '../src/modules/game/types'
import { updateCurrencyPair } from '../src/modules/currency/documents/exchange_rates'
import {
  updateGame,
  updateGames,
  getGames,
} from '../src/modules/tp-games/documents/games'
import {
  createTag,
  type GameTag,
} from '../src/modules/tp-games/documents/gameTags'
import { type KYCLevel } from '../src/modules/fraud/kyc'
import {
  createDefaultSettings,
  setDynamicSettings,
  type SiteSettings,
} from '../src/modules/siteSettings/documents/settings'
import { startJob as populateThirdPartyGames } from '../src/modules/tp-games/workers/tpGamesUpdater'
import { blockTPGame } from '../src/modules/tp-games/documents/blocks'
import { DisplayCurrencyList } from '../src/modules/currency/types'
import {
  type CMSContentDocument,
  upsertCmsDocument,
} from '../src/modules/cms/documents'
import { prepareAndCloseoutActiveBet } from '../src/modules/bet/documents/active_bet'
import { CryptoExchangeList } from '../src/modules/currency/lib/exchangeRates/util'
import {
  type BaseRBACPolicy,
  createPolicy,
} from '../src/modules/rbac/documents/RBACPolicies'
import {
  type BaseRBACRole,
  updateRole,
  createRole,
} from '../src/modules/rbac/documents/RBACRoles'
import { exists } from '../src/util/helpers/types'
import { forceRunUpdateExchangeRates } from '../src/modules/currency/workers/exchangeRates'
import { AVAILABLE_FEATURES } from '../src/util/features/constants'
import { __unsafeCreateFeatureFlag } from '../src/util/features/documents/featureFlag'
import { addAffiliate } from '../src/modules/affiliate/lib'

const DEBUG = false

const ChatBans = ChatMod.Documents.ChatBans.bans
const ChatHistory = ChatMod.Documents.ChatHistory

export interface SeedData {
  gameTags: GameTag[]
  users: Array<{
    username: string
    password: string
    kycLevel: KYCLevel
    emailVerified: boolean
    btcAddress: string
    balance: number
    betCount: number
    chatCount: number
    chatBan: boolean
    chatMute?: number
    roles?: string[]
    affiliateName?: string
  }>
  globalSettings: SiteSettings
  legalContentList: CMSContentDocument
  policies: BaseRBACPolicy[]
  roles: Array<BaseRBACRole & { policySlugs: string[] }>
}

interface SeedDataRequest {
  path: string
  data: SeedData
}

const lorem = new LoremIpsum()
const gameTypes: HouseGameName[] = ['dice', 'crash', 'towers']

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min)
const sample = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)]

const withConsoleControl = async (
  operation: (console: typeof global.console) => void | Promise<void>,
) => {
  const _console = { ...global.console }

  if (!DEBUG) {
    // Remove console from global.
    global.console = {
      log: (...data) => undefined, // this is to prevent "Cannot read properties of undefined (reading 'bind')"
    } as any
    winston.silent = true
  }

  try {
    await operation(_console)
  } finally {
    // Restore console.
    global.console = _console
    winston.silent = false
  }
}

const __unsafeTruncateEverything = async (console: typeof global.console) => {
  for (const { db, name } of getSchemas()) {
    console.log(`Truncating ${name} from ${db}.`)

    // If a collection doesn't exist, this will throw.
    // Wrapping in a try/catch to suppress errors.
    try {
      switch (db) {
        case 'mongo':
          await mongoose.model(name).deleteMany({})
          continue
        case 'megalomongo':
          await megaloMongo.model(name).deleteMany({})
          continue
        case 'rethink':
          await r.table(name).delete().run()
          continue
        default:
          continue
      }
    } catch {}
  }
}

const parseSeedFile = (file: string): SeedDataRequest => {
  const data: SeedData = require(path.resolve(file)).seedData

  if (typeof data !== 'object' || !data.users) {
    throw new Error('The seed data request is invalid.')
  }

  return { path: file, data }
}

const seedDatabase = async (request: SeedDataRequest) => {
  await withConsoleControl(async console => {
    const { path, data } = request

    const dbConnection = await initializeMongo()

    console.info('Truncating all rethink and mongo collections...')
    await __unsafeTruncateEverything(console)

    console.log('Migrating databases to ensure indexes are up to date...')
    await migrate(dbConnection, { force: true, data: false })

    console.log('Populating game records...')
    await populateThirdPartyGames()

    console.log('Approving all games...')
    await updateGames({}, { approvalStatus: 'approved' })

    console.log('Disabling random provider...')
    const [{ providerInternal }] = await getGames({ samples: 1, limit: 1 })
    await blockTPGame({ key: 'providerInternal', value: providerInternal })

    console.log('Fetching exchange rates...')
    await forceRunUpdateExchangeRates()

    console.log('Creating feature flag records for each available feature...')
    await Promise.all(
      AVAILABLE_FEATURES.map(async featureName => {
        return await __unsafeCreateFeatureFlag({
          name: featureName,
          state: 'final',
          disabled: false,
          regionList: [],
          betaTesters: [],
        })
      }),
    )

    // Seed sample data from json file.
    console.info(`Seeding from file ${path}...`)

    await createDefaultSettings()
    await setDynamicSettings(data.globalSettings)

    const policyIds = new Map<string, string>()
    for (const policy of data.policies) {
      const newPolicy = await createPolicy(policy)
      policyIds.set(policy.slug, newPolicy._id.toString())
    }

    const roleIds = new Map<string, string>()
    for (const role of data.roles) {
      const { policySlugs, ...baseRole } = role
      const mappedPolicyIds = policySlugs
        .map(slug => new Types.ObjectId(policyIds.get(slug)))
        .filter(exists)
      const newRole = await createRole({
        ...baseRole,
        policyIds: mappedPolicyIds,
      })
      roleIds.set(role.slug, newRole._id.toString())
    }

    // Used as reference.
    const ids = new Map<string, string>()
    let first: UserType | undefined

    for (const row of data.users) {
      const {
        username,
        password,
        kycLevel,
        emailVerified,
        balance,
        betCount,
        chatBan,
        chatMute,
        chatCount,
        roles,
        affiliateName,
      } = row
      const email = `${username}@roobet.com`
      console.log(`Writing data for ${username}...`)

      // Create user record.
      const { id } = await initUserSignup({
        username,
        email,
        password,
        countryCode: '',
        ip: '',
        session: { id: '', data: '' },
      })

      ids.set(username, id)

      // Update specific fields.
      const results = await User.get(id)
        .update(
          {
            staff: !!roles?.length,
            // TODO this should be done via RBAC interface but is trapped inside GQL resolver
            roles,
            email,
            emailVerified,
            kycLevel,
            hiddenTotalDeposited: balance,
            hiddenTotalDeposits: 2,
            hiddenTotalWithdrawn: balance / 2,
            totalDeposited: balance,
            totalDeposits: 2,
            totalWithdrawn: balance / 2,
            chatMessages: chatCount,
            balance,
            ltcBalance: 0,
            ethBalance: 0,
          },
          { returnChanges: true },
        )
        .run()

      const user: DBUser = results.changes[0].new_val

      const userRecord = await getUserById(user.id)
      if (!userRecord) {
        continue
      }

      if (affiliateName) {
        await addAffiliate(user.id, affiliateName)
      }

      // Beware, due to limitations of the RBAC interface only one user at a time will receive a certain role.
      // We'd have to collect all users with each role and update the role one time.
      for (const newRole of roles ?? []) {
        const roleId = roleIds.get(newRole)
        if (roleId) {
          await updateRole(roleId, { userIds: [user.id] })
        }
      }

      // Update user's cash balance.
      await adminReplaceUserBalance({
        user: userRecord,
        amount: balance,
        balanceTypeOverride: 'crypto',
        meta: {
          adminId: ids.get('superadmin')!,
          reason: 'test',
        },
      })

      if (!first) {
        first = userRecord
      }

      for await (const _ of [...Array(betCount)]) {
        const gameName = sample(gameTypes)
        const min = Number(getMinBetForGame(gameName))
        const max = Number(getMaxBetForGame(gameName))

        // Ensure user has enough balance to complete all bets (before profits).
        const amount = Number(
          Math.min(randomInt(min + 1, max - 1), balance / betCount).toFixed(2),
        )

        const activeGame = {
          id: uuid(),
          gameName,
        }

        const bet = await placeBet({
          user: userRecord,
          game: activeGame,
          betAmount: amount,
          extraBetFields: { payoutValue: amount * 2 },
          balanceTypeOverride: 'crypto',
        })

        await prepareAndCloseoutActiveBet(bet, false)
      }

      // Set chat ban.
      if (chatBan) {
        await ChatBans.chatBan(userRecord.id, first.id, 'testing')
      }

      // Set chat mute.
      if (chatMute) {
        await ChatBans.mute(userRecord.id, first.id, chatMute, 'testing')
      }
    }

    for (const username of ids.keys()) {
      const referralUser = data.users.find(
        ({ affiliateName }) => username === affiliateName,
      )
      const referralUsername = referralUser?.username
      if (referralUser) {
        await Promise.all(
          [...Array(30)].map(async _ => {
            megaloMongo.model('affiliate_earnings').create({
              affiliateUserId: ids.get(username),
              referralUserId: ids.get(referralUsername!),
              referralUsername,
              amount: Math.random() * 10,
              createdAt: moment()
                .subtract(30 * Math.random(), 'd')
                .toDate(),
            })
          }),
        )
      }
    }

    // Create game tags and seed with 20 random games.
    for (const tag of data.gameTags) {
      const result = await createTag(tag)
      const games = await getGames({ samples: 20, limit: 20, page: 0 })

      await Promise.all(
        games.map(async ({ _id }) => {
          return await updateGame(
            { _id },
            {
              tags: [result._id],
            },
          )
        }),
      )
    }

    // Create Document Fixtures
    await createKOTH({
      startTime: new Date(),
      endTime: new Date(),
      whichRoo: 'astro',
      minBet: 5,
    })

    const FiatExchangeList = DisplayCurrencyList.filter(
      currency => currency !== 'usd',
    )
    // crypto exchange rates
    for (const crypto of CryptoExchangeList) {
      await updateCurrencyPair(crypto, 'usd', 20000)
    }

    // fiat exchange rates
    for (const fiat of FiatExchangeList) {
      await updateCurrencyPair(fiat, 'usd', 0.9)
    }

    // Create fake chats in random order.
    const chatUsernames = data.users
      .flatMap<string>(user => Array(user.chatCount).fill(user.username))
      .sort(() => 0.5 - Math.random())

    await Promise.all(
      chatUsernames.map(
        async username =>
          await ChatHistory.insertMessage({
            userId: ids.get(username),
            user: {
              id: ids.get(username)!,
              name: username,
            },
            type: 'regular',
            locale: 'en',
            message: lorem.generateSentences(1),
            timestamp: new Date().toISOString(),
          }),
      ),
    )

    // Legal CMS
    for (const content of Object.values(data.legalContentList)) {
      await upsertCmsDocument(content)
    }

    console.log('Running data migrations...')

    await migrate(dbConnection, { force: true, data: true })

    console.log('Flushing redis...')

    await new Promise(resolve => redisCache.flushall(resolve))

    console.log('Seeding complete.')
  })
}

const seedDatabaseCmd = async (args = process.argv) => {
  const [, , file] = args

  const request = parseSeedFile(file)

  await seedDatabase(request)
}

// Run the command.
seedDatabaseCmd()
  .then(() => {
    process.exit(0)
  })
  .catch((error: Error) => {
    const message = DEBUG ? error.stack : error.message
    global.console.error(`\n${message}`)
    process.exit(1)
  })
