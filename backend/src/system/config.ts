import { type BigQueryOptions } from '@google-cloud/bigquery'
import { type Request } from 'express'
import moment from 'moment'
import { type DeepNonNullable, type DeepReadonly } from 'ts-essentials'

const toInt = (envVar: string | undefined) => (envVar ? parseInt(envVar) : null)
const toFloat = (envVar: string | undefined) =>
  envVar ? parseFloat(envVar) : null

const parseJson = <T>(maybeJson?: string): T | Record<string, unknown> => {
  try {
    return JSON.parse(maybeJson ?? '{}')
  } catch {
    return {}
  }
}

const minBet = Math.pow(
  10,
  -1 * (toInt(process.env.BALANCE_DECIMAL_PLACES) ?? 1),
)

const isProd = process.env.ENVIRONMENT === 'production'
const isStaging = process.env.ENVIRONMENT === 'staging'
const isLocal = process.env.ENVIRONMENT === 'dev'

// List of domain names we own. These are inherently permissable on all envs.
const controlledOrigins = [
  /^https:\/\/(.+\.)?roobet\.com$/,
  /^https:\/\/(.+\.)?roobet\.party$/,
  /^https:\/\/(.+\.)?roobet7\.com$/,
  /^https:\/\/(.+\.)?roo777\.com$/,
  /^https:\/\/(.+\.)?roob4\.com$/,
  /^https:\/\/(.+\.)?777\.dev$/,
  /^https:\/\/(.+\.)?roob019\.com$/,
  /^https:\/\/(.+\.)?roob048\.com$/,
  /^https:\/\/(.+\.)?roob073\.com$/,
  /^https:\/\/(.+\.)?roob312\.com$/,
  /^https:\/\/(.+\.)?roob313\.com$/,
  /^https:\/\/(.+\.)?roob537\.com$/,
  /^https:\/\/(.+\.)?roob635\.com$/,
  /^https:\/\/(.+\.)?roob738\.com$/,
  /^https:\/\/(.+\.)?roob749\.com$/,
  /^https:\/\/(.+\.)?roob836\.com$/,
] as const

const localOrigins = [
  'https://elder-oauth.ngrok.io',
  /^http:\/\/localhost:[0-9]+$/,
  /^http:\/\/([a-z]+.)?pambet.test(:[0-9]+)?$/,
  /^http:\/\/([a-z]+.)?pambet.wow(:[0-9]+)?$/,
] as const

const stagingOrigins = [
  // Cloudflare Pages.
  /^https:\/\/(.+\.)?frontend-dfa\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-product\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-staging-product\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-acp\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-staging-acp\.pages\.dev$/,
] as const

const productionOrigins = [
  'http://localhost:9005',
  'https://main.d693nvusr4cs4.amplifyapp.com',

  // OnePlusOne agency.
  'https://towers.solutions-dev.com',

  // Cloudflare Pages.
  /^https:\/\/(.+\.)?frontend-dfa\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-product\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-acp\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-canary-product\.pages\.dev$/,
  /^https:\/\/(.+\.)?roobet-canary-acp\.pages\.dev$/,
] as const

const allowedOrigins: Array<string | RegExp> = [
  process.env.FRONTEND_BASE!,
  ...controlledOrigins,
  ...(isProd ? productionOrigins : []),
  ...(isStaging ? stagingOrigins : []),
  ...(isLocal ? localOrigins : []),
]

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/roobet?replicaSet=rs0&directConnection=true'

const megaloMongoUri =
  process.env.MEGALOMONGO_URI ||
  'mongodb://127.0.0.1:27018/roobet_megalo?replicaSet=rs0&directConnection=true'

const nullableConfig = {
  port: process.env.PORT || 3003,
  metricsPort: process.env.METRICS_PORT || 3004,
  domain: new URL(process.env.FRONTEND_BASE!).hostname,
  isProd,
  isStaging,
  isLocal,
  mode: process.env.MODE,
  slackChannelOverride: process.env.SLACK_CHANNEL_OVERRIDE,
  chromiumBinPath: process.env.CHROMIUM_BIN_PATH || '/usr/bin/chromium',
  datadog: {
    sampleRate: toFloat(process.env.DATADOG_SAMPLE_RATE) ?? 0.1,
    threshold: {
      rabbitmqSlowOperationThresholdSeconds:
        toFloat(process.env.RETHINKDB_SLOW_OPERATION_THRESHOLD_SECONDS) ?? 0.5,
      rethinkdbSlowOperationThresholdSeconds:
        toFloat(process.env.RETHINKDB_SLOW_OPERATION_THRESHOLD_SECONDS) ?? 0.5,
      mongodbSlowOperationThresholdSeconds:
        toFloat(process.env.OPA_SLOW_OPERATION_THRESHOLD_SECONDS) ?? 0.5,
    },
  },
  logLevel: process.env.LOG_LEVEL || 'debug',
  // ip used when we cannot get it from the request, it's arbitrary
  testUserId: process.env.TEST_USER_ID,
  app: process.env.APP,
  oneshot: process.env.ONESHOT === 'true',
  worker: process.env.WORKER,
  workerTiming: {
    /** How long before failing to acquire worker lock means the deployment is unavailable in seconds. */
    availabilityDelaySeconds:
      toInt(process.env.WORKER_AVAILABILITY_DELAY) ?? 60,
    /** How often to attempt acquiring worker lock in seconds. */
    acquireIntervalSeconds: toInt(process.env.WORKER_ACQUIRE_INTERVAL) ?? 2,
    /** The duration to acquire and renew the worker lock for in seconds. */
    workerLeaseDurationSeconds: toInt(process.env.WORKER_LEASE_DURATION) ?? 10,
  },
  runWithdrawWorker: process.env.RUN_WITHDRAW_WORKER === 'true',
  balanceDecimalPlaces: toInt(process.env.BALANCE_DECIMAL_PLACES),
  minimumBetGoalBalance: 0.01,
  cryptoWagerRequirement: 0.2,
  cashWagerRequirement: 1,
  minimumPasswordLength: 7,
  dailyWithdrawLimit: toFloat(process.env.DAILY_WITHDRAW_LIMIT) ?? 201000,
  minTipBal: toFloat(process.env.MINIMUM_TIP_BALANCE) ?? 10,
  login_secret: 'fKRJe123hfR3dfj1o39uf__12kfh3iu4iu23o8iuero8gyi2h3iid4',
  lowHotWalletBalanceThresholds: {
    crypto: toFloat(process.env.LOW_HOT_WALLET_BTC) ?? 500_000,
    ltc: toFloat(process.env.LOW_HOT_WALLET_LTC) ?? 250_000,
    doge: toFloat(process.env.LOW_HOT_WALLET_DOGE) ?? 100_000,
    eth: toFloat(process.env.LOW_HOT_WALLET_ETH) ?? 500_000,
    usdt: toFloat(process.env.LOW_HOT_WALLET_USDT) ?? 500_000,
    usdc: toFloat(process.env.LOW_HOT_WALLET_USDC) ?? 250_000,
    xrp: toFloat(process.env.LOW_HOT_WALLET_XRP) ?? 250_000,
    trx: toFloat(process.env.LOW_HOT_WALLET_TRX) ?? 0,
  },
  kyc: {
    level1AccountAgeCutoffDate: moment(
      process.env.KYC_LEVEL1_ACCOUNT_AGE_CUTOFF || '2021-03-26T16:32:25-04:00',
    ),
    level2CutoffUSD:
      toFloat(process.env.KYC_LEVEL2_CUTOFF_USD) || 1000000000000,
    level2AccountAgeCutoffDate: moment(
      process.env.KYC_LEVEL2_ACCOUNT_AGE_CUTOFF || '2021-05-15T16:32:25-04:00',
    ),
  },
  overrideCountryCode: 'MX',
  countryBlocks: {
    list: {
      'CA-ON': 'Canada - Ontario',
      AU: 'Australia',
      US: 'United States of America',
      ES: 'Spain',
      GB: 'United Kingdom',
      UK: 'United Kingdom',
      CY: 'Cyprus',
      AS: 'American Samoa',
      GU: 'Guam',
      MP: 'Northern Mariana Islands',
      PR: 'Puerto Rico',
      VI: 'U.S. Virgin Islands',
      SE: 'Sweden',
      NL: 'Netherlands',
      KP: 'North Korea',
      YE: 'Yemen',
      IR: 'Iran',
      PT: 'Portugal',
      CW: 'Curacao',
      MT: 'Malta',
      SK: 'Slovakia',
      AW: 'Aruba',
      GI: 'Gibraltar',
      GG: 'Guernsey',
      BQ: 'Bonaire, Sint Eustatius, and Saba',
      SX: 'St. Maarten',
      ZW: 'Zimbabwe',
      HU: 'Hungary',
      CU: 'Cuba',
      LT: 'Lithuania',
      SY: 'Syria',
      IQ: 'Iraq',
      PL: 'Poland',
      HT: 'Haiti',
      MM: 'Myanmar',
      NI: 'Nicaragua',
      SS: 'South Sudan',
      IL: 'Israel',
      DE: 'Germany',
    },
  },
  // temp for license approval
  cityBlocks: [
    'on',
    'ontario',
    'port colborne',
    'fort frances',
    'cobourg',
    'owen sound',
    'hearst',
    'greater sudbury',
    'deseronto',
    'whitchurch-stouffville',
    'kirkland lake',
    'guelph',
    'new tecumseth',
    'saugeen shores',
    'east gwillimbury',
    'plympton-wyoming',
    'south bruce peninsula',
    'moosonee',
    'clarence-rockland',
    'mono',
    'gore bay',
    'niagara-on-the-lake',
    'halton hills',
    'bracebridge',
    'ajax',
    'gravenhurst',
    'mississippi mills',
    'penetanguishene',
    'temiskaming shores',
    'thunder bay',
    'wasaga beach',
    'sarnia',
    'brantford',
    'iroquois falls',
    'petawawa',
    'arnprior',
    'prince edward county',
    'kawartha lakes',
    'greater napanee',
    'grand valley',
    'spanish',
    'carleton place',
    'elliot lake',
    'bruce mines',
    'timmins',
    'haldimand county',
    'smooth rock falls',
    'the blue mountains',
    'amherstburg',
    'st. catharines',
    'kenora',
    'norfolk county',
    'parry sound',
    'thorold',
    'bradford west gwillimbury',
    'innisfil',
    'atikokan',
    'laurentian hills',
    'fort erie',
    'kapuskasing',
    'thessalon',
    'tillsonburg',
    'rainy river',
    'northeastern manitoulin and the islands',
    'quinte west',
    'mississauga',
    'smiths falls',
    'gananoque',
    'englehart',
  ],
  deposits: {
    alerts: {
      bigDepositLimit: toInt(process.env.DEPOSITS_ALERT_LOWER_LIMIT) ?? 1000,
      lossLimit: toInt(process.env.DEPOSITS_ALERT_LOSS_LIMIT) ?? 50,
    },
  },
  bet: {
    maxProfit: toInt(process.env.BET_MAX_PROFIT),
    maxPayout: toInt(process.env.BET_MAX_PAYOUT),
  },
  adscend: {
    secret: process.env.ADSCEND_SECRET,
    validIps: ['54.204.57.82'],
  },
  adgate: {
    secret: process.env.ADGATE_SECRET,
    affiliateId: '',
  },
  offertoro: {
    secret: process.env.OFFERTORO_SECRET,
  },
  affiliate: {
    cut: 5,
  },
  mailgun: {
    key: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_SEND_DOMAIN || 'mg.roobet.com',
    from: process.env.MAILGUN_FROM || 'Roobet <no-reply@roobet.com>',
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY,
    apiSecret: process.env.COINBASE_API_SECRET,
  },
  coinmarketCap: {
    key: 'b81dc6b1-f968-4641-a5d6-1a0ac446d8d1',
  },
  bitcoin: {
    poolingAddress: process.env.BLOCKIO_BITCOIN_POOLING_ADDRESS,
    withdrawalAddress: process.env.BLOCKIO_BITCOIN_WITHDRAWAL_ADDRESS,
    maxFeeUSD: toInt(process.env.MAX_BITCOIN_FEE_USD || '10'),
    deposit: {
      minConfirmations: 1,
      minDepositAmountUSD: 0.01,
    },
    privateKey: process.env.BITCOIN_PRIVATE_KEY,
    extendedPrivateKey: process.env.BITCOIN_PRIVATE_KEY_EXTENDED,
  },
  litecoin: {
    poolingAddress: process.env.BLOCKIO_LITECOIN_POOLING_ADDRESS,
    withdrawalAddress: process.env.BLOCKIO_LITECOIN_WITHDRAWAL_ADDRESS,
    maxFeeUSD: toInt(process.env.MAX_LITECOIN_FEE_USD || '10'),
    deposit: {
      minConfirmations: 1,
      minDepositAmountUSD: 0.01,
    },
    privateKey: process.env.LITECOIN_PRIVATE_KEY,
    extendedPrivateKey: process.env.LITECOIN_PRIVATE_KEY_EXTENDED,
  },
  dogecoin: {
    poolingAddress: process.env.BLOCKIO_DOGECOIN_POOLING_ADDRESS,
    withdrawalAddress: process.env.BLOCKIO_DOGECOIN_WITHDRAWAL_ADDRESS,
    maxFeeUSD: toInt(process.env.MAX_DOGECOIN_FEE_USD || '10'),
    deposit: {
      minConfirmations: 1,
      minDepositAmountUSD: 0.01,
    },
    privateKey: process.env.DOGECOIN_PRIVATE_KEY,
    extendedPrivateKey: process.env.DOGECOIN_PRIVATE_KEY_EXTENDED,
  },
  ethereum: {
    deposit: {
      chunkSize: toInt(process.env.ETH_CHUNK_SIZE) ?? 1,
      depositOldestBlock: 20,
      depositSleepSeconds: 10,
      minConfirmations: 3,
      minDepositAmountUSD: 0.01,
    },
    erc20ContractAddresses: {
      usdtTestAddress: '0x8BCa5c37B18F60A8Dc8d5049F313Ef4f3F0beD50',
      usdcTestAddress: '0x0a6414bD54CE3BcC4b938d11C23B98c2B4367d0c',
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    gasLimit: {
      standard: 21000,
      erc20: 100000,
    },
    fee: {
      standard: 0.99,
      adjustedFee: 0.995,
      withdrawValueLimit: 1000,
      maxFeeUSD: toInt(process.env.MAX_ETHEREUM_FEE_USD || '10'),
    },
    gasMultiplierForBumping: 0.1, // 10% increase, otherwise we get underpriced errors
    wsProvider: process.env.ETHEREUM_WS_PROVIDER,
    httpProvider: process.env.ETHEREUM_HTTP_PROVIDER,
    httpArchiveProvider: process.env.ETHEREUM_HTTP_ARCHIVE_PROVIDER,
    minConfirmations: 3,
    mnemonic: process.env.ETH_MNEMONIC,
    ethSecret: process.env.ETH_SECRET,
    ethSecretIndex: parseInt(process.env.ETH_SECRET_INDEX!),
    shouldEmergencyPool: !!process.env.SHOULD_EMERGENCY_POOL,
  },
  polygon: {
    apiKey: process.env.ALCHEMY_API_KEY,
    blocks: {
      processName: 'MATICBlocks',
      keyName: 'latestBlock',
    },
  },
  ripple: {
    wsProvider: process.env.RIPPLE_WS_PROVIDER,
    httpProvider: process.env.RIPPLE_HTTP_PROVIDER,
    xrpSecret: process.env.RIPPLE_SECRET,
    xrpDestTagInit: toInt(process.env.RIPPLE_DEST_TAG_INIT),
    deposit: {
      sleepSeconds: 10,
      minConfirmations: 1,
      minDepositAmountUSD: 0.01,
    },
    fee: {
      processName: 'RIPPLEFee',
      keyName: 'estimate',
      expires: 60 * 60,
      minThresholdUSD: 0.01,
    },
  },
  tron: {
    wsProvider: process.env.TRON_WS_PROVIDER,
    httpProvider: process.env.TRON_HTTP_PROVIDER,
    mainWalletMnemonic: process.env.TRON_MAIN_WALLET_MNEMONIC,
    mainWalletIndex: toInt(process.env.TRON_MAIN_WALLET_INDEX) ?? 0,
    trxNonceInit: toInt(process.env.TRON_NONCE_INIT) ?? 0,
    userWalletMnemonic: process.env.TRON_USER_WALLET_MNEMONIC,
    pooling: {
      poolingMnemonic: process.env.TRON_POOLING_WALLET_MNEMONIC,
      poolingIndex: toInt(process.env.TRON_POOLING_WALLET_INDEX) ?? 0,
      shouldResetAllBalances: !!process.env.TRON_RESET_ALL_BALANCES,
      poolingThreshold: 200_000,
      fundBufferMultiplier: 1.5,
    },
    deposit: {
      /** 1 block is published every 3 seconds */
      sleepSeconds: 12,
      minConfirmations: 20,
      minDepositAmountUSD: 0.01,
      chunkSize: toInt(process.env.TRON_CHUNK_SIZE) ?? 1,
    },
    trc20ContractAddresses: {
      // these addresses and decimal values should never change
      // they are hard-coded onto the respective smart contracts
      usdt: {
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        decimals: 6,
      },
      usdc: {
        address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
        decimals: 6,
      },
    },
    fee: {
      processName: 'TRONFee',
      keyName: 'estimate',
      expires: 60 * 60,
      minThresholdTrx: 1,
      convertProcessName: 'TRONRate',
      convertkeyName: 'usd',
      energyToTRXRate: 0.00042,
    },
  },
  rabbitmq: {
    heartbeat: toInt(process.env.RABBITMQ_HEARTBEAT) ?? 60,
    consumer: {
      uri: process.env.RABBITMQ_CONSUMER_URI ?? process.env.RABBITMQ_URI,
    },
    producer: {
      uri: process.env.RABBITMQ_PRODUCER_URI ?? process.env.RABBITMQ_URI,
    },
  },
  pragmatic: {
    secretKey: process.env.PRAGMATIC_SECRET_KEY,
    secureLogin: process.env.PRAGMATIC_SECURE_LOGIN,
    apiDomain: process.env.PRAGMATIC_API_DOMAIN,
    styleName: process.env.PRAGMATIC_STYLENAME,
  },
  playngo: {
    accessToken: process.env.PLAYNGO_ACCESS_TOKEN,
    gameInjectionSheet: '1GUO7BCWPG_w77VVr9lu-H8UPF7l4rPUNx2lE9WZDeiU',
  },
  softswiss: {
    walletUrl: process.env.SOFTSWISS_WALLET_URL,
    apiUrl: process.env.SOFTSWISS_GCP_URL,
    casinoId: process.env.SOFTSWISS_CASINO_ID,
    authToken: process.env.SOFTSWISS_AUTH_TOKEN,
    returnUrl: process.env.SOFTSWISS_RETURN_URL,
  },
  slotegrator: {
    currency: process.env.SLOTEGRATOR_CURRENCY,
    sports: {
      baseUrl: process.env.SLOTEGRATOR_SPORTS_BASE_URL,
      merchantId: process.env.SLOTEGRATOR_SPORTS_MERCHANT_ID,
      merchantKey: process.env.SLOTEGRATOR_SPORTS_MERCHANT_KEY,
      sportsbookUuid: process.env.SLOTEGRATOR_SPORTS_SPORTSBOOK_UUID,
    },
    slots: {
      baseUrl: process.env.SLOTEGRATOR_SLOTS_BASE_URL,
      merchantId: process.env.SLOTEGRATOR_SLOTS_MERCHANT_ID,
      merchantKey: process.env.SLOTEGRATOR_SLOTS_MERCHANT_KEY,
    },
  },
  hacksaw: {
    baseUrl: process.env.HACKSAW_BASE_URL,
    partnerId: process.env.HACKSAW_PARTNER_ID,
    secret: process.env.HACKSAW_SECRET,
    apiPassword: process.env.HACKSAW_API_PASSWORD,
    apiUsername: process.env.HACKSAW_API_USERNAME,
  },
  wallet: {
    minWithdraw: 1,
  },
  mongodb: {
    uri: mongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    },
  },
  megalomongo: {
    uri: megaloMongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    },
  },
  mongo_analytics: {
    // By default, connect to the local mongodb connection.
    uri: process.env.MONGO_ANALYTICS_URI || mongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    },
  },
  megalomongo_analytics: {
    // By default, connect to the local megalo mongodb connection.
    uri: process.env.MEGALOMONGO_ANALYTICS_URI || megaloMongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    },
  },
  rethinkdb: {
    shardsPerTable: toInt(process.env.RETHINKDB_SHARDS_PER_TABLE) || 1,
    buffer: 5,
    changefeedReconnectOptions: {
      attemptDelay: 3000,
      maxAttempts: 600,
      silent: false,
    },
    db: process.env.RETHINKDB_DB,
    discovery: false,
    host: process.env.RETHINKDB_HOST,
    max: 5000,
    password: process.env.RETHINKDB_PASSWORD,
    pingInterval: 0,
    port: process.env.RETHINKDB_PORT,
    rejectUnauthorized: false,
    timeout: toInt(process.env.RETHINKDB_CONNECTION_TIMEOUT) || 30,
    timeoutError: toInt(process.env.RETHINKDB_TIMEOUT_ERROR) || 10000,
    timeoutGb: 3600000,
    user: process.env.RETHINKDB_USER,
  },
  paymentiq: {
    /** used to generate a static token */
    privateKey: process.env.PAYMENTIQ_PRIVATE_KEY,
    merchantId: process.env.PAYMENTIQ_MERCHANT_ID,
    minDeposit: 10,
    maxDeposit: 10000,
    minWithdraw: 15,
    maxWithdraw: 10000,
  },
  moonpay: {
    secretKey: process.env.MOONPAY_SECRET_KEY,
    clientKey: process.env.MOONPAY_CLIENT_KEY,
    envUrl:
      process.env.MOONPAY_BASE_URL ||
      'https://buy-sandbox.moonpay.com/?apiKey=',
  },
  googleDrive: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  shufti: {
    clientId: process.env.SHUFTI_CLIENT_ID,
    secretKey: process.env.SHUFTI_SECRET_KEY,
  },
  seon: {
    baseUrl: process.env.SEON_BASE_URL || 'https://api.seon.io/SeonRestService',
    apiKey: process.env.SEON_API_KEY || '',
    salt: process.env.SEON_PASSWORD_SALT,
    amlKyc2RulePattern:
      process.env.SEON_AML_KYC_2_RULE_PATTERN || 'kyc level 2 threshold',
    fallbackIPAddress: '74.94.162.147',
  },
  fixer: {
    apiKey: process.env.FIXER_API_KEY || '',
  },
  etherscan: {
    enabled: process.env.ETHERSCAN_ENABLED === 'true',
    apiKey:
      process.env.ETHERSCAN_API_KEY || 'PH2EXFDWI2ZU6Y2V2MFKNJTHD2CZDGDNRR',
    url: process.env.ETHERSCAN_API_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    recaptcha: {
      v2: process.env.RECAPTCHA_SECRET,
      v3: process.env.RECAPTCHA_V3_SECRET,
    },
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },
  blockio: {
    apiSecret: process.env.BLOCKIO_API_SECRET,
    litecoinKey: process.env.BLOCKIO_LITECOIN_KEY,
    bitcoinKey: process.env.BLOCKIO_BITCOIN_KEY,
    dogecoinKey: process.env.BLOCKIO_DOGECOIN_KEY,
    pin: process.env.BLOCKIO_PIN,
  },
  tatum: {
    keys: {
      apiKey: process.env.TATUM_API_KEY,
      loggerId: 'tatum',
    },
    webhooks: {
      baseUrl: process.env.TATUM_WEBHOOK_URL,
      addressEventsEndpoint: '/addressUpdates',
    },
  },
  coinswitch: {
    key: process.env.COINSWITCH,
  },
  hub88: {
    privateKey: process.env.HUB88_PRIVATE_KEY,
    publicKey: process.env.HUB88_PUBLIC_KEY,
    apiPublicKey: process.env.HUB88_API_PUBLIC_KEY,
    operatorId: toInt(process.env.HUB88_OPERATOR_ID),
    subPartnerId: process.env.HUB88_SUB_PARTNER_ID,
    apiUrl: process.env.HUB88_API_URL,
  },
  mines: {
    edge: toFloat(process.env.MINES_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.MINES_MAX_BET),
    seed: process.env.MINES_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
    maxPayout: process.env.MINES_MAX_PAYOUT,
  },
  linearmines: {
    edge: toFloat(process.env.LINEAR_MINES_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.LINEAR_MINES_MAX_BET),
    seed: process.env.LINEAR_MINES_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
    maxPayout: process.env.LINEAR_MINES_MAX_PAYOUT,
  },
  coinflip: {
    edge: toFloat(process.env.COINFLIP_HOUSE_EDGE),
    minBet: toFloat(process.env.COINFLIP_MIN_BET) ?? minBet,
    maxBet: toInt(process.env.COINFLIP_MAX_BET),
    seed: process.env.COINFLIP_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
  },
  towers: {
    edge: toFloat(process.env.TOWERS_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.TOWERS_MAX_BET),
    seed: process.env.TOWERS_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
    maxPayout: toInt(process.env.TOWERS_MAX_PAYOUT),
    defaultRows: toInt(process.env.TOWERS_MAX_ROWS),
  },
  cashdash: {
    edge: toFloat(process.env.CASH_DASH_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.CASH_DASH_MAX_BET),
    seed: process.env.CASH_DASH_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
    maxPayout: toInt(process.env.CASH_DASH_MAX_PAYOUT),
    defaultRows: toInt(process.env.CASH_DASH_MAX_ROWS),
  },
  dice: {
    edge: toFloat(process.env.DICE_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.DICE_MAX_BET),
    seed: process.env.DICE_SEED,
    salt: '',
    defaultClientSeed: 'changeThisSeed',
  },
  hilo: {
    edge: toFloat(process.env.HILO_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.HILO_MAX_BET),
    seed: process.env.HILO_SEED,
    salt: '',
    defaultClientSeed: 'changeThisSeed',
  },
  plinko: {
    edge: toFloat(process.env.PLINKO_HOUSE_EDGE) || 2.0,
    lightning_edge: toFloat(process.env.PLINKO_LIGHTNING_HOUSE_EDGE) || 4.0,
    gameCount: toInt(process.env.PLINKO_GAME_COUNT) || 10000,
    minBet,
    maxBet: process.env.PLINKO_MAX_BET,
    salt: process.env.PLINKO_SALT,
    seed: process.env.PLINKO_SEED,
    defaultClientSeed: 'changeThisSeed',
    maxPayout: process.env.PLINKO_MAX_PAYOUT,
  },
  roulette: {
    edge: toFloat(process.env.ROULETTE_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.ROULETTE_MAX_BET),
    gameCount: toInt(process.env.ROULETTE_GAME_COUNT),
    salt: process.env.ROULETTE_SALT,
    seed: process.env.ROULETTE_SEED,
  },
  crash: {
    edge: toFloat(process.env.CRASH_HOUSE_EDGE) || 4.0,
    minBet,
    maxBet: toInt(process.env.CRASH_MAX_BET),
    gameCount: toInt(process.env.CRASH_GAME_COUNT),
    salt: process.env.CRASH_SALT,
    seed: process.env.CRASH_SEED,
    testUsers: process.env.CRASH_TEST_USER_COUNT,
  },
  hotbox: {
    edge: toFloat(process.env.HOTBOX_HOUSE_EDGE) || 4.0,
    minBet,
    maxBet: toInt(process.env.HOTBOX_MAX_BET),
    gameCount: toInt(process.env.HOTBOX_GAME_COUNT),
    salt: process.env.HOTBOX_SALT,
    seed: process.env.HOTBOX_SEED,
    testUsers: process.env.HOTBOX_TEST_USER_COUNT,
  },
  junglemines: {
    edge: toFloat(process.env.JUNGLE_MINES_HOUSE_EDGE),
    minBet,
    maxBet: toInt(process.env.JUNGLE_MINES_MAX_BET),
    seed: process.env.JUNGLE_MINES_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
    maxPayout: process.env.JUNGLE_MINES_MAX_PAYOUT,
  },
  blackjack: {
    edge: toFloat(process.env.BLACKJACK_HOUSE_EDGE),
    minBet: toFloat(process.env.BLACKJACK_MIN_BET) ?? minBet,
    maxBet: toInt(process.env.BLACKJACK_MAX_BET),
    insuranceRate: toFloat(process.env.BLACKJACK_INSURANCE_RATE),
    insurancePayout: toFloat(process.env.BLACKJACK_INSURANCE_PAYOUT),
    payoutStandard: toFloat(process.env.BLACKJACK_PAYOUT_STANDARD),
    payoutBlackjack: toFloat(process.env.BLACKJACK_PAYOUT_BLACKJACK),
    perfectPair: {
      minBet: toFloat(process.env.BLACKJACK_MINI_BET_PERFECT_PAIR) ?? minBet,
      maxBet: toInt(process.env.BLACKJACK_MAXI_BET_PERFECT_PAIR),
      payouts: {
        true: toFloat(process.env.BLACKJACK_PERFECT_PAIR_PAYOUT_TRUE),
        colored: toFloat(process.env.BLACKJACK_PERFECT_PAIR_PAYOUT_COLORED),
        mixed: toFloat(process.env.BLACKJACK_PERFECT_PAIR_PAYOUT_MIXED),
      },
    },
    twentyOnePlusThree: {
      minBet: toFloat(process.env.BLACKJACK_MINI_BET_21_PLUS_3) ?? minBet,
      maxBet: toInt(process.env.BLACKJACK_MAXI_BET_21_PLUS_3),
      payouts: {
        suitedTriple: toFloat(
          process.env.BLACKJACK_21_PLUS_3_PAYOUT_SUITED_TRIPLE,
        ),
        straightFlush: toFloat(
          process.env.BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT_FLUSH,
        ),
        threeOfAKind: toFloat(
          process.env.BLACKJACK_21_PLUS_3_PAYOUT_THREE_OF_A_KIND,
        ),
        straight: toFloat(process.env.BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT),
        flush: toFloat(process.env.BLACKJACK_21_PLUS_3_PAYOUT_FLUSH),
      },
    },
    seed: process.env.BLACKJACK_SEED,
    defaultClientSeed: 'changeThisSeed',
    salt: '',
  },
  yggdrasil: {
    enabled: process.env.YGGDRASIL_ENABLED === 'true',
    baseApiUrl: process.env.YGGDRASIL_API_BASE_URL,
    sessionKeyExpiration: process.env.YGGDRASIL_SESSION_KEY_EXPIRATION,
    launchIntent: process.env.YGGDRASIL_LAUNCH_INTENT,
    launchRegion: process.env.YGGDRASIL_LAUNCH_REGION,
    launchOrg: process.env.YGGDRASIL_LAUNCH_ORG,
  },
  rains: {
    countdown: toFloat(process.env.RAINS_DEFAULT_COUNTDOWN),
    duration: toFloat(process.env.RAINS_DEFAULT_DURATION),
    minRain: toFloat(process.env.RAINS_MINIMUM_RAIN),
  },
  redis: (() => {
    const makeConfig = (name: string) => ({
      name,
      pass: process.env.REDIS_PASS,
      // Grab host info, prioritize URL over separate hostname/port.
      ...(process.env.REDIS_URL
        ? {
            url: process.env.REDIS_URL,
          }
        : {
            host: process.env.REDIS_HOST,
            port: toInt(process.env.REDIS_PORT) || 6379,
          }),
      // This can be removed once we're using TLS everywhere.
      ...(process.env.REDIS_UNSAFE_TLS
        ? {
            tls: {
              rejectUnauthorized: false,
            },
          }
        : {}),
    })

    return {
      // These 3 clients share the same config, but historically have been separated.
      primary: makeConfig('primary'),
      sockets: makeConfig('sockets'),
      cache: makeConfig('cache'),

      // This config, client and all usages can be removed once
      // production is using the AWS instance as our primary.
      secondary: {
        name: 'secondary',
        url: process.env.REDIS_SECONDARY_URL,
        pass: process.env.REDIS_SECONDARY_PASS,
        tls: {
          rejectUnauthorized: false,
        },
      },
    }
  })(),
  slotPotato: {
    eventStartBuffer: process.env.SLOT_POTATO_EVENT_START_BUFFER || 3600000,
  },
  session: {
    secret: process.env.SESSION_SECRET || '',
    resave: false,
    saveUninitialized: false,
  },
  appSettings: {
    frontendBase: process.env.FRONTEND_BASE,
    backendBase: process.env.BACKEND_BASE,
    webhookBase: process.env.WEBHOOK_BASE, // obfuscated webhook base
    allowedOrigins,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'X-Requested-With',
      'X-Seon-Session-Payload',
      'Cookie',
      'Set-Cookie',
      'Cache-Control',
      'Pragma',
      'Expires',

      // Datadog headers.
      'traceparent',
      'x-datadog-trace-id',
      'x-datadog-parent-id',
      'x-datadog-origin',
      'x-datadog-sampling-priority',

      // Custom Roobet headers.
      'X-Roobet-Host',
      'X-Roobet-Cache',
    ],
    auths: [
      {
        name: 'google',
        passportType: 'authenticate',
        opts: {
          type: 'auth',
        },
        passportSettings: {
          scope: ['profile', 'email'],
          session: true,
        },
      },
    ],
    allowedIPs: [
      // Bugcrowd Staff IP
      '54.243.128.50',
    ],
  },
  crypto: {
    transactionLimitDays: 30,
  },
  defaultSettings: {
    banner: '',
    id: 'main' as const,
  },

  verification: {
    storage: {
      bucket: process.env.VERIFICATION_STORAGE_BUCKET,
    },
  },
  amazon: {
    defaultRegion: process.env.AWS_DEFAULT_REGION,
    creds: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },

  media: {
    destinations: {
      publicImages: {
        bucket: process.env.MEDIA_DEST_PUBLIC_IMAGES_BUCKET,
        domain: process.env.MEDIA_DEST_PUBLIC_IMAGES_DOMAIN,
      },
    },
  },

  reporting: {
    jobsFlag: process.env.REPORTING_AS_JOBS === 'true',
    bucket: process.env.REPORTING_BUCKET,
    userExportToken: process.env.USER_EXPORT_TOKEN,

    config: {
      userBalances: {
        licenseEncryptionKey: process.env.REPORTING_USER_BALANCES_KEY,
        licenseUploadEndpoint: process.env.REPORTING_USER_BALANCES_ENDPOINT,
      },
    },
  },

  intercom: {
    token: process.env.INTERCOM_TOKEN,
    secret: process.env.INTERCOM_USER_HASH_SECRET,
  },

  chainalysis: {
    token: process.env.CHAINALYSIS_TOKEN,
  },

  blockcypher: {
    token: process.env.BLOCKCYPHER_TOKEN,
  },

  twilio: {
    sid: process.env.TWILIO_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },

  fasttrack: {
    secret: process.env.FASTTRACK_SECRET,
  },

  smarty: {
    authId: process.env.SMARTY_AUTH_ID,
    authToken: process.env.SMARTY_AUTH_TOKEN,
  },

  graphql: {
    websocketHost: process.env.WEBSOCKET_HOST,
    websocketBase: process.env.WEBSOCKET_BASE,
    websocketGQLProductPort: process.env.WEBSOCKET_GQL_PRODUCT_PORT,
    websocketGQLAdminPort: process.env.WEBSOCKET_GQL_ADMIN_PORT,
    rateLimit: {
      points: toInt(process.env.GQL_RATE_LIMIT_POINTS) ?? 10,
      duration: toInt(process.env.GQL_RATE_LIMIT_DURATION) ?? 1,
      blockDuration: toInt(process.env.GQL_RATE_LIMIT_BLOCK_DURATION) ?? 30,
    },
  },

  github: {
    pat: process.env.GITHUB_PAT,
  },

  splashTech: {
    privateKey: process.env.SPLASH_TECH_PRIVATE_KEY,
  },

  unibo: {
    baseUrl: process.env.UNIBO_BASE_URL,
    username: process.env.UNIBO_USERNAME,
    password: process.env.UNIBO_PASSWORD,
    tenant: process.env.UNIBO_TENANT,
  },

  ember: {
    aes_key: process.env.EMBER_DECRYPTION_KEY,
  },

  displayCurrencies: [
    'usd',
    'cad',
    'jpy',
    'brl',
    'rub',
    'dkk',
    'mxn',
    'eur',
    'cny',
    'inr',
    'krw',
    'php',
    'idr',
    'ars',
    'try',
  ] as const,

  globalstatsworkers: {
    sleepSeconds: 0.5,
  },

  bigquery: {
    projectId: process.env.BIGQUERY_PROJECT_ID,
    credentials: parseJson<BigQueryOptions['credentials']>(
      process.env.BIGQUERY_CREDENTIALS,
    ),
  },
}

/**
 * We're going to pretend that all fields on config are present, because they should be, and TypeScript won't tell us
 * if they aren't.
 */
type Config = DeepReadonly<DeepNonNullable<typeof nullableConfig>>

export const config = nullableConfig as Config

export const getFrontendDomainFromReferer = (referer?: string) => {
  if (referer) {
    const url = new URL(referer)

    return url.host
  }

  return config.domain
}

export const getFrontendUrlFromReferer = (referer?: string) => {
  if (referer) {
    const url = new URL(referer)

    return `${url.protocol}//${url.host}`
  }

  return config.appSettings.frontendBase
}

export const getFrontendUrlFromReq = (req: Request) => {
  const { referer } = req.headers

  return getFrontendUrlFromReferer(referer)
}

export const getFrontendDomainFromReq = (req: Request) => {
  const { referer } = req.headers

  return getFrontendDomainFromReferer(referer)
}

export const getBackendUrlFromReq = (req?: Request) => {
  if (!req) {
    return config.appSettings.backendBase
  }

  const { host, 'x-roobet-host': proxyHost } = req.headers

  // Our local env does not yet support https.
  const protocol = isLocal ? 'http:' : 'https:'

  // Determine if we should use the {domain}/_api proxy or fallback to api.{domain}
  const useProxy =
    typeof proxyHost === 'string' && !proxyHost.startsWith('api.')

  if (useProxy) {
    return `${protocol}//${host}/_api`
  }

  return `${protocol}//${host}`
}

export const getBackendDomainFromReq = (req: Request) => {
  const { host } = req.headers

  return host
}
