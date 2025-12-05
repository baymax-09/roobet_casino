// all "component modules" are loaded recursively.
import {
  type RouterApp,
  type RouterPassport,
  type RouterIO,
  type RouterExpress,
} from 'src/util/api'
import { exists } from 'src/util/helpers/types'

export type DBFeedFunction = () => Promise<any>
export type DBCleanupFunction = () => Promise<any>

/** used for compound indexes */
/** column structures vary across DBs */
export interface TableIndex {
  name: string
  cols?: (p: any) => any[]
}

export interface MongoViewDefinition {
  name: string
  viewOn: string
  pipeline: Array<Record<string, any>>
}

export type DBCollectionSchema = Readonly<{
  db: 'rethink' | 'mongo' | 'megalomongo'
  name: string
  indices?: TableIndex[]
  feeds?: Array<() => Promise<any>>
  cleanup?: Array<() => Promise<any>>
  bigCleanups?: Array<() => Promise<any>>
  // Only applies to mongo drivers.
  views?: MongoViewDefinition[]
}>

/*
 * ModuleRoute is a function that calls app.use('/path', router) to generate
 * a sub-router on app which is a router that is passed in.
 */
export type ModuleRoute = (
  app: RouterApp,
  passport: RouterPassport,
  io: RouterIO,
  express: RouterExpress,
  redis?: any,
) => Promise<any>

export interface ModuleWorker {
  run: () => Promise<any> | null
}

export interface ModuleDocument {
  schema: DBCollectionSchema
}

export type ModuleRouteMap = Record<string, ModuleRoute>
export type ModuleDocumentsMap = Record<string, ModuleDocument>
export type ModuleWorkersMap = Record<string, ModuleWorker>

export interface RoobetModule {
  Routes: ModuleRouteMap
  Documents: ModuleDocumentsMap
  Workers: ModuleWorkersMap
}

const modules: RoobetModule[] = [
  // modules
  require('./fraud/kyc'),
  require('./fraud/geofencing'),
  require('./fraud/riskAssessment'),
  require('./fraud/monitoring'),
  require('./user'),
  require('./currency'),
  require('./audit'),
  require('./auth'),
  require('./bet'),
  require('./admin'),
  require('./gpt'),
  require('./withdraw'),
  require('./stats'),
  require('./userSettings'),
  require('./siteSettings'),
  require('./deposit'),
  require('./promo'),
  require('./rain'),
  require('./email'),
  require('./chat'),
  require('./affiliate'),
  require('./tp-games'),
  require('./raffle'),
  require('./koth'),
  require('./rewards'),
  require('./roowards'),
  require('./cms'),
  require('./crm'),
  require('./stats/reporting'),
  require('./slotPotato'),
  require('./messaging/notifications'),
  require('./messaging/messages'),
  require('./inventory'),
  require('./rbac'),
  require('./analytics'),
  require('./campaigns'),
  require('./tipping'),

  // cryptos
  require('src/modules/crypto/litecoin'),
  require('src/modules/crypto/ethereum'),
  require('src/modules/crypto/bitcoin'),
  require('src/modules/crypto/polygon'),
  require('src/modules/crypto/ripple'),
  require('src/modules/crypto/tron'),
  require('./crypto'),

  // games
  require('./game'),
  require('./roulette'),
  require('./mines'),
  require('./towers'),
  require('./crash'),
  require('./hotbox'),
  require('./dice'),
  require('./plinko'),
  require('./coinflip'),
  require('./linearmines'),
  require('./hilo'),
  require('./cash-dash'),
  require('./junglemines'),
  require('./blackjack'),

  // GraphQL API
  require('./graphql-admin'),
  require('./graphql-product'),

  // utils
  require('../util/named-lock'),
  require('../util/db'),
  require('../util/features'),
  require('../util/eventScheduler'),

  // vendors
  require('../vendors/seon'),
  require('../vendors/mailgun'),
  require('../vendors/fasttrack'),
  require('../vendors/fixer'),
  require('../vendors/splash'),
  require('../vendors/ember'),

  // payment integrations
  require('../vendors/blockio'),
  require('../vendors/moonpay'),
  require('../vendors/paymentiq'),

  // game providers
  require('../vendors/game-providers/pragmatic'),
  require('../vendors/game-providers/softswiss'),
  require('../vendors/game-providers/playngo'),
  require('../vendors/game-providers/hub88'),
  require('../vendors/game-providers/slotegrator/sports'),
  require('../vendors/game-providers/slotegrator/slots'),
  require('../vendors/game-providers/hacksaw'),
  require('../vendors/game-providers/yggdrasil'),
]

export function loadRoutes(): ModuleRoute[] {
  return modules
    .filter(({ Routes }) => Routes)
    .flatMap(({ Routes }) => Object.values(Routes))
    .filter(exists)
}

export function loadWorkers(): ModuleWorkersMap[] {
  return modules
    .filter(({ Workers }) => Workers)
    .map(({ Workers }) => Workers)
    .filter(exists)
}

export function loadFeeds(): DBFeedFunction[] {
  return loadSchemas()
    .flatMap(schema => schema.feeds)
    .filter(exists)
}

export function loadCleanups(
  type: 'cleanup' | 'bigCleanups' = 'cleanup',
): DBCleanupFunction[] {
  return loadSchemas()
    .flatMap(schema => schema[type])
    .filter(exists)
}

export function loadSchemas(): DBCollectionSchema[] {
  return modules
    .filter(({ Documents }) => Documents)
    .flatMap(({ Documents }) => {
      return Object.values(Documents).map(doc => doc.schema)
    })
    .filter(exists)
}
