import {
  CardValueType,
  GameStatus,
  HandActionType,
  HandOutcomeType,
  HandWagerType,
  WagerOutcomeType,
  createUserGame,
  doubleDownUserGame,
  hitUserGame,
  insureUserGame,
  isHandWithStatus,
  isPlayerSeat,
  splitUserGame,
  standUserGame,
  startUserGame,
  type ClientGameState,
  type Hand,
  type HandWithStatus,
  type PlayerHand,
  type PlayerSeat,
  type UserHandMainWagerRequest,
  type UserSeatRequest,
} from '../../lib'
import { buildActionHashRaw, getCardShorthand } from '../../lib/verify'
import { canPlayHandAction, getDealerHand, isPlayableHand } from '../../utils'
import {
  BlackjackRTPGameStatsDefault,
  aggregate,
  type BlackjackRTPGameStats,
  type BlackjackRTPStatsOutcomes,
} from './types'

export type BetAccessor = (betId?: string) => [number, number]

export class PlayerBase {
  private readonly _playerActions = [
    HandActionType.Hit,
    HandActionType.Stand,
    HandActionType.DoubleDown,
    HandActionType.Split,
    HandActionType.Insurance,
  ]

  protected game: ClientGameState
  protected playerId: string
  protected user: { id: string }
  protected playerSeat: PlayerSeat
  protected wagers: UserHandMainWagerRequest[]
  protected betProfit: BetAccessor

  constructor(
    playerId: string,
    wagers: UserHandMainWagerRequest[],
    betProfit: BetAccessor,
  ) {
    this.wagers = wagers
    this.playerId = playerId
    this.user = { id: playerId }
    this.betProfit = betProfit
  }

  private updateState(game: ClientGameState, playerId: string): void {
    this.game = game
    const playerById = game.players
      .filter(isPlayerSeat)
      .find(seat => seat.playerId === playerId)
    if (!playerById) {
      throw new Error(`Player with id ${this.playerId} not found`)
    }
    this.playerId = playerId
    this.playerSeat = playerById
  }

  protected get isGameCompleted(): boolean {
    return this.game.status === GameStatus.Complete
  }

  protected get dealerHand(): Hand {
    return getDealerHand(this.game.players)
  }

  protected yesOrNo(): boolean {
    return Math.random() > 0.5
  }

  protected randomNumber(max: number): number {
    return Math.floor(Math.random() * max)
  }

  protected async ensureActiveGame(): Promise<void> {
    if (!this.game) {
      this.game = await createUserGame({ id: this.playerId })
    }
    if (this.game.status === GameStatus.Pending) {
      const requests: UserSeatRequest[] = [
        {
          seatIndex: 0,
          user: { id: this.playerId },
          wagers: this.wagers,
        },
      ]
      this.updateState(
        await startUserGame(this.game.id, requests),
        this.playerId,
      )
    }
  }

  protected getPossibleActions(handIndex: number): HandActionType[] {
    return this._playerActions.filter(action =>
      canPlayHandAction(action, this.playerSeat, handIndex),
    )
  }

  protected getFirstPlayableHand(): PlayerHand | undefined {
    return this.playerSeat.hands.find(hand => isPlayableHand(hand, false))
  }

  protected getHandWthStatus(handIndex: number): HandWithStatus {
    const hand = this.playerSeat.hands
      .filter(isHandWithStatus)
      .find(hand => hand.handIndex === handIndex)
    if (!hand) {
      throw new Error(`Hand with index ${handIndex} not found with status`)
    }
    return hand
  }

  protected async playHandAction(
    handIndex: number,
    action: HandActionType,
    acceptInsurance: boolean,
  ): Promise<void> {
    switch (action) {
      case HandActionType.DoubleDown:
        this.updateState(
          await doubleDownUserGame(this.game.id, this.user, handIndex),
          this.playerId,
        )
        break
      case HandActionType.Hit:
        this.updateState(
          await hitUserGame(this.game.id, this.user, handIndex),
          this.playerId,
        )
        break
      case HandActionType.Insurance:
        this.updateState(
          await insureUserGame(
            this.game.id,
            this.user,
            handIndex,
            acceptInsurance,
          ),
          this.playerId,
        )
        break
      case HandActionType.Split:
        this.updateState(
          await splitUserGame(this.game.id, this.user, handIndex),
          this.playerId,
        )
        break
      case HandActionType.Stand:
        this.updateState(
          await standUserGame(this.game.id, this.user, handIndex),
          this.playerId,
        )
        break
      default:
        break
    }
  }

  /**
   * Plays the {@link game game} and returns the {@link BlackjackRTPGameStats game stats}
   * @returns The {@link BlackjackRTPGameStats game stats}
   */
  public async getGameResults(): Promise<BlackjackRTPGameStats> {
    await this.playGame()
    const [wagerAmount, handProfit] = this.betProfit(this.playerSeat.betId)
    const actions = buildActionHashRaw(this.game).replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{2,4}Z/g,
      '',
    )
    return this.playerSeat.hands.reduce((pre, cur) => {
      const game = this.game
      const dealer = getDealerHand(game.players)
      const handWon = cur.status.outcome === HandOutcomeType.Win
      const handWager = cur.wager
      const wager213 = handWager.sides?.find(
        side => side.type === HandWagerType.TwentyOnePlusThree,
      )
      const wagerPair = handWager.sides?.find(
        side => side.type === HandWagerType.PerfectPair,
      )
      const wagerInsure = handWager.sides?.find(
        side => side.type === HandWagerType.Insurance,
      )
      const outcomeStats: BlackjackRTPStatsOutcomes = aggregate(
        pre.hands.outcomes,
        {
          [cur.status.isHard ? 'hard' : 'soft']: {
            [cur.status.outcome]: {
              [cur.status.value]: [
                {
                  player: cur.cards.map(getCardShorthand).join(' - '),
                  dealer: dealer.cards.map(getCardShorthand).join(' - '),
                  actions,
                },
              ],
            },
          },
        },
      )
      return {
        rtp: 0,
        hands: {
          total: pre.hands.total + 1,
          won: pre.hands.won + (handWon ? 1 : 0),
          wagered: pre.hands.wagered + wagerAmount,
          profit: pre.hands.profit + handProfit,
          outcomes: outcomeStats,
        },
        perfectPairs: {
          total: pre.perfectPairs.total + (wagerPair ? 1 : 0),
          won:
            pre.perfectPairs.won +
            (wagerPair?.outcome === WagerOutcomeType.Win ? 1 : 0),
          wagered: pre.perfectPairs.wagered + (wagerPair?.amount || 0),
          profit: 0,
        },
        twentyOnePlusThree: {
          total: pre.twentyOnePlusThree.total + (wager213 ? 1 : 0),
          won:
            pre.twentyOnePlusThree.won +
            (wager213?.outcome === WagerOutcomeType.Win ? 1 : 0),
          wagered: pre.twentyOnePlusThree.wagered + (wager213?.amount || 0),
          profit: 0,
        },
        insurance: {
          total: pre.insurance.total + (wagerInsure ? 1 : 0),
          won:
            pre.insurance.won +
            (wagerInsure?.outcome === WagerOutcomeType.Win ? 1 : 0),
          wagered: pre.insurance.wagered + (wagerInsure?.amount || 0),
          profit: 0,
        },
      }
    }, BlackjackRTPGameStatsDefault)
  }

  public playGame(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

/**
 * A player that plays the game using a {@link https://en.wikipedia.org/wiki/Monte_Carlo_method Monte Carlo method}
 *
 * This player tends to have an RTP of 10% +/- 4% - **EXTREMELY** low
 */
export class PlayerMonteCarlo extends PlayerBase {
  public async playGame(): Promise<void> {
    await this.ensureActiveGame()
    while (!this.isGameCompleted) {
      const hand = this.getFirstPlayableHand()
      if (hand) {
        await this.playRandomHandAction(hand.handIndex)
      }
    }
  }

  protected async playRandomHandAction(handIndex: number): Promise<void> {
    const actions = this.getPossibleActions(handIndex)
    if (actions.length > 0) {
      const acceptInsurance = this.yesOrNo()
      const actionIndex = this.randomNumber(actions.length)
      const actionType = actions[actionIndex]
      await this.playHandAction(handIndex, actionType, acceptInsurance)
    }
  }
}

/**
 * A player that plays the game using a modified basic strategy
 *
 * Given the rules:
 * - game—using a 416-card shoe (8 decks)
 * - the dealer hitting on soft 17
 * - surrender not being an option
 *
 * ### Hard Totals
 * - **8 or less**: Always hit.
 * - **9**: Double down if the dealer shows 3 through 6, otherwise hit.
 * - **10**: Double down if the dealer shows 2 through 9, otherwise hit.
 * - **11**: Always double down.
 * - **12**: Hit if the dealer shows 2, 3, or 7 and higher; stand if the dealer shows 4, 5, or 6.
 * - **13-16**: Stand if the dealer shows 2 through 6; hit if the dealer shows 7 and higher.
 * - **17-21**: Always stand.
 *
 * ### Soft Totals
 * - **Soft 13-15**: Always hit.
 * - **Soft 16, Soft 17**: Double down if the dealer shows 3 through 6; otherwise hit.
 * - **Soft 18**: Double down if the dealer shows 3 through 6; stand if the dealer shows 2, 7, or 8; hit if the dealer shows 9, 10, or Ace.
 * - **Soft 19-21**: Always stand.
 *
 * ### Pairs
 * - **Aces and 8s**: Always split.
 * - **2s and 3s**: Split if the dealer shows 2 through 7; otherwise hit.
 * - **4s**: Do not split; hit.
 * - **5s**: Treat as a 10 and double down if the dealer shows 2 through 9; otherwise hit.
 * - **6s**: Split if the dealer shows 2 through 6; otherwise hit.
 * - **7s**: Split if the dealer shows 2 through 7; otherwise hit.
 * - **9s**: Split if the dealer shows 2 through 6, 8, or 9. Stand if the dealer shows 7, 10, or Ace.
 * - **10s**: Never split; always stand.
 *
 * ### Additional Notes
 * - **Doubling Down**: This is an aggressive move that can maximize your winnings under the right circumstances. Given the dealer hits on soft 17, opportunities where doubling down is beneficial might slightly increase, especially with soft hands.
 * - **No Surrender Available**: Since surrendering is not an option, the strategy emphasizes making the best play based on the hand you're dealt and the dealer's upcard, even in tough situations where surrender might otherwise be considered.
 * - **Dealer Hits on Soft 17**: This rule affects the threshold for standing or hitting on certain soft hands. It can also influence the decision to double down with soft hands against a dealer's possible soft 17.
 */
export class PlayerOptimal extends PlayerMonteCarlo {
  public async playGame(): Promise<void> {
    await this.ensureActiveGame()
    while (!this.isGameCompleted) {
      const hand = this.getFirstPlayableHand()
      if (hand) {
        await this.playBestHandAction(hand.handIndex)
      }
    }
  }

  /**
   * A table that maps the best action to take for hard hands.
   * The first key is the players total hand value, the second key is the dealer upcard value.
   */
  private readonly hardTable: Record<
    number,
    Record<CardValueType, HandActionType[]>
  > = {
    4: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    5: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    6: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    7: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    8: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    9: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    10: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    11: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.King]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.DoubleDown, HandActionType.Hit],
    },
    12: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    13: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    14: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    15: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    16: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    17: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    18: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    19: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    20: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    21: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
  }

  /**
   * A table that maps the best action to take for soft hands.
   * The first key is the players non-Ace card value, the second key is the dealer upcard value.
   */
  private readonly softTable: Record<
    CardValueType,
    Record<CardValueType, HandActionType[]>
  > = {
    [CardValueType.Hidden]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.Two]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Three]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Four]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Five]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Six]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Seven]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Eight]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Nine]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Ten]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.Jack]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.Queen]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.King]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.Ace]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
  }

  /**
   * A table that maps the best action to take for each pair of cards.
   * The first key is the players card value, the second key is the dealer upcard value.
   */
  private readonly pairsTable: Record<
    CardValueType,
    Record<CardValueType, HandActionType[]>
  > = {
    [CardValueType.Hidden]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [],
      [CardValueType.Three]: [],
      [CardValueType.Four]: [],
      [CardValueType.Five]: [],
      [CardValueType.Six]: [],
      [CardValueType.Seven]: [],
      [CardValueType.Eight]: [],
      [CardValueType.Nine]: [],
      [CardValueType.Ten]: [],
      [CardValueType.Jack]: [],
      [CardValueType.Queen]: [],
      [CardValueType.King]: [],
      [CardValueType.Ace]: [],
    },
    [CardValueType.Two]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Split],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Three]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Split],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Four]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Five]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Three]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Four]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Five]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Six]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Seven]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.DoubleDown, HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Six]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Hit],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Seven]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Split],
      [CardValueType.Eight]: [HandActionType.Hit],
      [CardValueType.Nine]: [HandActionType.Hit],
      [CardValueType.Ten]: [HandActionType.Hit],
      [CardValueType.Jack]: [HandActionType.Hit],
      [CardValueType.Queen]: [HandActionType.Hit],
      [CardValueType.King]: [HandActionType.Hit],
      [CardValueType.Ace]: [HandActionType.Hit],
    },
    [CardValueType.Eight]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Split],
      [CardValueType.Eight]: [HandActionType.Split],
      [CardValueType.Nine]: [HandActionType.Split],
      [CardValueType.Ten]: [HandActionType.Split],
      [CardValueType.Jack]: [HandActionType.Split],
      [CardValueType.Queen]: [HandActionType.Split],
      [CardValueType.King]: [HandActionType.Split],
      [CardValueType.Ace]: [HandActionType.Split],
    },
    [CardValueType.Nine]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Split],
      [CardValueType.Nine]: [HandActionType.Split],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Ten]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Jack]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Queen]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.King]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Stand],
      [CardValueType.Three]: [HandActionType.Stand],
      [CardValueType.Four]: [HandActionType.Stand],
      [CardValueType.Five]: [HandActionType.Stand],
      [CardValueType.Six]: [HandActionType.Stand],
      [CardValueType.Seven]: [HandActionType.Stand],
      [CardValueType.Eight]: [HandActionType.Stand],
      [CardValueType.Nine]: [HandActionType.Stand],
      [CardValueType.Ten]: [HandActionType.Stand],
      [CardValueType.Jack]: [HandActionType.Stand],
      [CardValueType.Queen]: [HandActionType.Stand],
      [CardValueType.King]: [HandActionType.Stand],
      [CardValueType.Ace]: [HandActionType.Stand],
    },
    [CardValueType.Ace]: {
      [CardValueType.Hidden]: [],
      [CardValueType.Two]: [HandActionType.Split],
      [CardValueType.Three]: [HandActionType.Split],
      [CardValueType.Four]: [HandActionType.Split],
      [CardValueType.Five]: [HandActionType.Split],
      [CardValueType.Six]: [HandActionType.Split],
      [CardValueType.Seven]: [HandActionType.Split],
      [CardValueType.Eight]: [HandActionType.Split],
      [CardValueType.Nine]: [HandActionType.Split],
      [CardValueType.Ten]: [HandActionType.Split],
      [CardValueType.Jack]: [HandActionType.Split],
      [CardValueType.Queen]: [HandActionType.Split],
      [CardValueType.King]: [HandActionType.Split],
      [CardValueType.Ace]: [HandActionType.Split],
    },
  }

  private async playBestHandAction(handIndex: number): Promise<void> {
    const player = this.getHandWthStatus(handIndex)
    const dealer = this.dealerHand
    const possibleActions = this.getPossibleActions(handIndex)
    if (player.status.canSplit) {
      const pairActions =
        this.pairsTable[player.cards[0].value][dealer.cards[0].value]
      const playAction = pairActions.find(action =>
        possibleActions.includes(action),
      )
      if (playAction) {
        return this.playHandAction(handIndex, playAction, false)
      }
    }
    if (player.status.isHard) {
      const hardActions =
        this.hardTable[player.status.value][dealer.cards[0].value]
      const playAction = hardActions.find(action =>
        possibleActions.includes(action),
      )
      if (playAction) {
        return this.playHandAction(handIndex, playAction, false)
      }
    }
    if (player.status.isSoft) {
      const valueCard =
        player.cards.find(card => card.value !== CardValueType.Ace) ??
        player.cards[0]
      const softActions = this.softTable[valueCard.value][dealer.cards[0].value]
      const playAction = softActions.find(action =>
        possibleActions.includes(action),
      )
      if (playAction) {
        return this.playHandAction(handIndex, playAction, false)
      }
    }
    return this.playRandomHandAction(handIndex)
  }
}
