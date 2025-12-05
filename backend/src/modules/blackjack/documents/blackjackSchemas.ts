import type mongoose from 'mongoose'
import {
  type Document,
  type FlatRecord,
  type ToObjectOptions,
  type Types,
} from 'mongoose'

import {
  CardSuitTypes,
  CardValueTypes,
  GameStatuses,
  HandActionType,
  HandActionTypeValues,
  HandOutcomeType,
  HandOutcomeTypes,
  HandSideWagerTypes,
  HandWagerType,
  WagerOutcomeType,
  WagerOutcomeTypes,
  isValidAction,
  type GameState,
  type Hand,
  type HandActionInsurance,
  type HandActionSplit,
  type HandActionWithShoe,
  type HandActions,
  type HandStatus,
  type PlayerCard,
  type PlayerSeat,
  type UserHandMainWager,
  type UserHandSideWager,
} from '../types'

const basicSubOpts = { _id: false }

export type DBBlackjackGame = Omit<GameState, 'id'> & mongoose.Document

export const HandStatusSchemaBlock = () => [
  {
    value: {
      type: Number,
      required: true,
    },
    isHard: {
      type: Boolean,
      required: true,
    },
    isSoft: {
      type: Boolean,
      required: true,
    },
    isBust: {
      type: Boolean,
      required: true,
    },
    isBlackjack: {
      type: Boolean,
      required: true,
    },
    canHit: {
      type: Boolean,
      required: true,
    },
    canStand: {
      type: Boolean,
      required: true,
    },
    canInsure: {
      type: Boolean,
      required: true,
    },
    canSplit: {
      type: Boolean,
      required: true,
    },
    canDoubleDown: {
      type: Boolean,
      required: true,
    },
    splitFrom: {
      type: Number,
      nullable: true,
      required: false,
    },
    wasDoubled: {
      type: Boolean,
      required: true,
    },
    outcome: {
      type: String,
      enum: HandOutcomeTypes,
      default: HandOutcomeType.Unknown,
      required: true,
    },
  },
  { ...basicSubOpts },
]
export const CardSchemaBlock = () => [
  {
    suit: {
      type: String,
      enum: CardSuitTypes,
      required: true,
    },
    value: {
      type: Number,
      enum: CardValueTypes,
      required: true,
    },
    hidden: {
      type: Boolean,
      required: true,
    },
  },
  { ...basicSubOpts },
]
export const HandActionSchemaBlock = () => [
  {
    type: {
      type: Number,
      enum: HandActionTypeValues,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  { ...basicSubOpts, discriminatorKey: 'type' },
]
export const HandActionWithShoeSchemaBlock = () => [
  {
    shoeIndex: {
      type: Number,
    },
  },
  { ...basicSubOpts },
]
export const HandActionInsuranceSchemaBlock = () => [
  {
    accept: {
      type: Boolean,
      required: true,
    },
  },
  { ...basicSubOpts },
]
export const HandActionSplitSchemaBlock = () => [
  {
    splitTo: {
      type: Number,
      required: true,
    },
    splitFrom: {
      type: Number,
      required: true,
    },
  },
  { ...basicSubOpts },
]
export const HandSideWagerSchemaBlock = () => [
  {
    type: {
      type: String,
      enum: HandSideWagerTypes,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    outcome: {
      type: String,
      enum: WagerOutcomeTypes,
      default: WagerOutcomeType.Unknown,
      required: true,
    },
  },
  { ...basicSubOpts },
]
export const HandMainWagerSchemaBlock = (
  sideWagerSchema: mongoose.Schema<UserHandSideWager>,
) => [
  {
    type: {
      type: String,
      enum: [HandWagerType.Main],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    sides: {
      type: [sideWagerSchema],
      required: false,
    },
  },
  { ...basicSubOpts },
]
export const HandSchemaBlock = (
  wagerSchema: mongoose.Schema<UserHandMainWager>,
  cardsSchema: mongoose.Schema<PlayerCard>,
  statusSchema: mongoose.Schema<HandStatus>,
  actionsSchema: mongoose.Schema<HandActions>,
) => [
  {
    handIndex: {
      type: Number,
      required: true,
    },
    wager: {
      type: wagerSchema,
    },
    cards: {
      type: [cardsSchema],
      required: true,
    },
    status: {
      type: statusSchema,
      required: (val: Hand) => !!val,
    },
    actions: {
      type: [actionsSchema],
      required: true,
      validate: {
        validator: (actions: any[]) =>
          actions.every(action => isValidAction(action)),
        message: 'Invalid action detected',
      },
    },
  },
  { ...basicSubOpts },
]
export const PlayerSchemaBlock = (handSchema: mongoose.Schema<Hand>) => [
  {
    playerId: {
      type: String,
      required: true,
      index: true,
    },
    betId: {
      type: String,
      index: true,
    },
    seatIndex: {
      type: Number,
      required: false,
    },
    hands: {
      type: [handSchema],
      required: false,
    },
  },
  { ...basicSubOpts },
]
export const GamesSchemaBlock = (
  playerSchema: mongoose.Schema<PlayerSeat>,
) => ({
  status: {
    type: String,
    enum: GameStatuses,
    index: true,
  },
  seed: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
  },
  players: {
    type: [playerSchema],
    required: true,
  },
})
export const setHandActionsSchemaDiscriminators = (
  BlackjackHandActionSchema: mongoose.Schema<HandActions>,
  BlackjackHandActionWithShoeSchema: mongoose.Schema<HandActionWithShoe>,
  BlackjackHandActionInsuranceSchema: mongoose.Schema<HandActionInsurance>,
  BlackjackHandSplitActionSchema: mongoose.Schema<HandActionSplit>,
) => {
  BlackjackHandActionSchema.discriminator(
    HandActionType.Deal,
    BlackjackHandActionWithShoeSchema,
  )
  BlackjackHandActionSchema.discriminator(
    HandActionType.Hit,
    BlackjackHandActionWithShoeSchema,
  )
  BlackjackHandActionSchema.discriminator(
    HandActionType.Stand,
    BlackjackHandActionSchema,
  )
  BlackjackHandActionSchema.discriminator(
    HandActionType.Split,
    BlackjackHandSplitActionSchema,
  )
  BlackjackHandActionSchema.discriminator(
    HandActionType.Insurance,
    BlackjackHandActionInsuranceSchema,
  )
  BlackjackHandActionSchema.discriminator(
    HandActionType.DoubleDown,
    BlackjackHandActionWithShoeSchema,
  )
}

/**
 * Converts a {@link DBBlackjackGame} to a {@link GameState}.
 */
export const toObjectOptions: ToObjectOptions<
  Document<unknown, unknown, FlatRecord<DBBlackjackGame>> &
    FlatRecord<DBBlackjackGame> & { _id: Types.ObjectId }
> = {
  versionKey: false,
  transform: (_doc, ret) => {
    if (ret.players) {
      ret.id = ret._id?.toString()
    }
    ret._id = undefined
    return ret
  },
}
