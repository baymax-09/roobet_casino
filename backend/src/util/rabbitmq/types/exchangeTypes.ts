const EXCHANGES = {
  events: {
    routingKeys: [
      'events.userLogin',
      'events.userSignUp',
      'events.userBlock',
      'events.userUnblock',
      'events.userConsent',
      'events.userUpdate',
      'events.userDeposit',
      'events.userWithdrawal',
      'events.userGameRound',
      'events.userBalanceUpdate',
      'events.userSportsbookBet',
      'events.customFasttrack',

      'events.tpGameChanged',
      'events.seonHooks',
      'events.reports',
      'events.scheduledEvents',

      // TODO these should be in a houseGames exchange
      'events.resolveGame',

      // TODO these should be in the payments exchange
      'events.outboundEthereumTransaction',
      'events.confirmEthereumTransaction',
      'events.sendInternalEthereumTransaction',
    ],
  },
  payments: {
    routingKeys: [
      'payments.deposit',
      'payments.inboundRippleTransaction',
      'payments.outboundRippleConfirmation',
      'payments.outboundRippleTransaction',
      'payments.inboundTronTransaction',
      'payments.outboundTronConfirmation',
      'payments.outboundTronTransaction',
      'payments.poolingTron',
    ],
  },
} as const

export const Queues = [
  'deposit',
  'inboundRippleTransaction',
  'outboundRippleConfirmation',
  'outboundRippleTransaction',
  'inboundTronTransaction',
  'outboundTronConfirmation',
  'outboundTronTransaction',
  'slotPotatoEventStart',
  'fasttrack',
  'fasttrackDataPipeline',
  'outboundEthereumTransaction',
  'seonHooks',
  'reports',
  'confirmEthereumTransaction',
  'messagingEmitScheduledMessage',
  'resolveGame',
  'poolingTron',
] as const
export type Queue = (typeof Queues)[number]
export const isQueue = (value: any): value is Queue => Queues.includes(value)

export type ExchangeName = keyof typeof EXCHANGES
export type RoutingKey<E extends ExchangeName> =
  (typeof EXCHANGES)[E]['routingKeys'][number]
