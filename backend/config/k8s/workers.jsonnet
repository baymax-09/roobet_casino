local w = import './worker.libsonnet';

local all = {

  // Deployments | long-running processes

  analytics: w('analytics'),

  betcloseout: w('betCloseout'),

  betfeed: w('betFeed'),

  blockiodaemon: w('blockIoDaemon'),

  cleanups: w('cleanup'),

  crash: w('crash'),

  cryptopooling: w('cryptoPooling'),

  depositqueue: w('depositQueue'),

  emitscheduledmessage: w('emitScheduledMessage'),

  ethereumdeposits: w('ethereumDeposits'),

  ethereumconfirmationsqueue: w('ethereumConfirmationsQueue'),

  ethereumtransactionqueue: w('ethereumTransactionQueue'),

  ethereumshallowcopy: w('ethereumShallowCopy'),

  ethereumsmartcontracts: w('ethereumSmartContracts') {
    container+:: {
      env_+:: { ETHEREUM_WS_PROVIDER: 'wss://51.210.114.42:8546' },
    },
  },

  exchangerates: w('exchangeRates'),

  gameresolutionqueue: w('gameResolutionQueue'),

  genericfeeds: w('genericFeeds'),

  hotbox: w('hotbox'),

  inboundtransactionqueues: w('inboundTransactionQueues'),

  migrate: w('migrate'),

  outboundconfirmationqueues: w('outboundConfirmationQueues'),

  outboundtransactionqueues: w('outboundTransactionQueues'),

  pendingoutgoingtransactions: w('pendingOutgoingTransactions'),

  plinko: w('plinko'),

  polygonshallowcopy: w('polygonShallowCopy'),

  poolblockiodeposits: w('poolBlockioDeposits'),

  poolethdeposits: w('poolEthDeposits'),

  poolingqueues: w('poolingQueues'),

  rain: w('rain'),

  rbacbundler: w('rbacBundler'),

  reporting: w('reporting'),

  riskjobs: w('riskJobs'),

  roulette: w('roulette'),

  scheduledeventpublisher: w('scheduledEventPublisher'),

  settleethtransactions: w('settleEthTransactions'),

  transactionqueue: w('transactionQueue'),

  slotpotatoevent: w('slotPotatoEvent'),

  tronshallowcopy: w('tronShallowCopy'),

  withdrawworker: w('withdrawWorker') {
    container+:: {
      env_+:: { RUN_WITHDRAW_WORKER: 'true' },
    },
  },

  xrpshallowcopy: w('xrpShallowCopy'),

  // CRONJOBS | Scheduled (recurring) workloads

  tpgamesupdater: w('tpGamesUpdater', kind='cronjob') {
    cronjob+: {
      spec+: {
        concurrencyPolicy: 'Replace',
        schedule: '*/10 * * * *',
      },
    },
  },

  // JOBS | One-shot jobs (migrations, backfills and other ephemeral, ad-hoc workloads)

  // example: w('migrate', kind='job') {

  items:: [items.list for items in std.objectValues($)],
};

all.items
