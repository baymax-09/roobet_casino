# Blackjack API

The following documentation describes the Blackjack API endpoints.

## Authentication

All requests must be authenticated and carry the credential cookie with them. The cookie is set by the server on successful login.

## Endpoints

### Create a Game `POST /blackjack`

This endpoint creates a new game of Blackjack with one seat for the requesting player. The player is automatically seated at the table.

#### Request

No additional request data is required.

#### Response

A `ClientGameState` object is returned.

### Get a Game `GET /blackjack/active`

This endpoint returns the current state of all games of Blackjack the user is active in.

#### Request

No additional request data is required.

#### Response

A `Array` of `ClientGameState` objects is returned, or empty if there are no active games for the player.

### Start a Game `PATCH /blackjack/:id/start`

This endpoint starts a game of Blackjack. The game must be in the `pending` (previously created) state to be started.

#### Request

The request data MUST be a `BlackjackStartGameRequest` object.

#### Response

A `ClientGameState` object is returned.

### Get a Game `GET /blackjack/:id`

This endpoint returns the current state of a game of Blackjack.

#### Request

No additional request data is required.

#### Response

A `ClientGameState` object is returned.

### Hit a Hand `POST /blackjack/:id/hit`

This endpoint hits a hand in a game of Blackjack. The game must be in the `active` state to hit a hand and the hand `status` must indicate `canHit: true`, otherwise an error will be returned.

#### Request

The request data MUST be a `BlackjackActionRequest` object.

#### Response

A `ClientGameState` object is returned.

### Stand a Hand `POST /blackjack/:id/stand`

This endpoint stands a hand in a game of Blackjack. The game must be in the `active` state to stand a hand and the hand `status` must indicate `canStand: true`, otherwise an error will be returned.

#### Request

The request data MUST be a `BlackjackActionRequest` object.

#### Response

A `ClientGameState` object is returned.

### Double Down a Hand `POST /blackjack/:id/doubleDown`

This endpoint doubles down a hand in a game of Blackjack. The game must be in the `active` state to double down a hand and the hand `status` must indicate `canDoubleDown: true`, otherwise an error will be returned.

#### Request

The request data MUST be a `BlackjackActionRequest` object.

#### Response

A `ClientGameState` object is returned.

### Insure a Hand `POST /blackjack/:id/insure`

This endpoint insures a hand in a game of Blackjack. The game must be in the `active` state to insure a hand and the hand `status` must indicate `canInsure: true`, otherwise an error will be returned.

#### Request

The request data MUST be a `BlackjackInsureRequest` object.

#### Response

A `ClientGameState` object is returned.

### Insure a Hand `POST /blackjack/:id/split`

This endpoint splits a hand in a game of Blackjack. The game must be in the `active` state to split a hand and the hand `status` must indicate `canSplit: true`, otherwise an error will be returned.

#### Request

The request data MUST be a `BlackjackActionRequest` object.

#### Response

A `ClientGameState` object is returned.

## Entities

### BlackjackStartGameRequest

The `BlackjackStartGameRequest` object is used to start a game of Blackjack. It contains the following fields in the body:

| Field   | Type                  | Description                                              |
| ------- | --------------------- | -------------------------------------------------------- |
| `seats` | `PlayerSeatRequest[]` | The players seated at the table and their bets per hand. |

### BlackjackActionRequest

The `BlackjackActionRequest` object is used to perform a basic action in a game of Blackjack. It contains the following fields in the body:

| Field       | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `handIndex` | `number` | The index of the hand to perform the action on. |

### BlackjackInsureRequest

The `BlackjackInsureRequest` object is used to insure a hand in a game of Blackjack. It contains the following fields in the body:

| Field       | Type      | Description                                     |
| ----------- | --------- | ----------------------------------------------- |
| `handIndex` | `number`  | The index of the hand to perform the action on. |
| `accept`    | `boolean` | Whether to accept or decline the insurance.     |

### PlayerSeatRequest

The `PlayerSeatRequest` object represents a player at the table. It contains the following fields:

| Field      | Type                  | Description                                                          |
| ---------- | --------------------- | -------------------------------------------------------------------- |
| `playerId` | `string`              | The unique identifier for the player, the `User.id`.                 |
| `wagers`   | `UserHandMainWager[]` | The wagers for each hand. Each instance becomes a hand to be played. |

### ClientGameState

The `ClientGameState` object is returned by the server to the client to represent the current state of the game. It contains the following fields:

| Field     | Type           | Description                                                                        |
| --------- | -------------- | ---------------------------------------------------------------------------------- |
| `id`      | `string`       | The unique identifier for the game. This will be required in all subsequent calls. |
| `status`  | `GameStatus`   | The current status of the game.                                                    |
| `players` | `PlayerSeat[]` | The players at the table, terminated by the table dealer.                          |

### GameStatus

This is an enum that represents the current status of the game. It can be one of the following values:

| Value      | Description                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `pending`  | The game has been created but has not yet started.                                                 |
| `active`   | The game is currently in progress.                                                                 |
| `complete` | The game has completed. This is a terminal state and no further actions can be taken.              |
| `rejected` | The game was rejected by the server. This is a terminal state and no further actions can be taken. |

### PlayerSeat

The `PlayerSeat` object represents a player at the table. It contains the following fields:

| Field      | Type     | Description                                                                       |
| ---------- | -------- | --------------------------------------------------------------------------------- |
| `playerId` | `string` | The unique identifier for the player.                                             |
| `betId`    | `string` | The unique identifier for the player's bet, or `undefined` if this is a demo bet. |
| `hands`    | `Hand[]` | The player's hands.                                                               |

### DealerSeat

The `DealerSeat` object represents the dealer at the table, when a game is completed this look identical to a `PlayerSeat`. It contains the following fields:

| Field      | Type                | Description                                                  |
| ---------- | ------------------- | ------------------------------------------------------------ |
| `playerId` | `dealer` (`string`) | The identifier for the dealer is always the string `dealer`. |
| `hands`    | `[Hand]`            | A `Hand[]` with exactly one hand. \*                         |

\* Note: The dealer's single hand will always be the only hand in the dealer's `hands` array. Additionally, the dealer's hole-card will be hidden, and the `suit` and `value` delivered as `hidden`, with `hidden: true`, and with a default `status` (everything `false` and `0`) until the game is complete.

### Hand

Except for the dealer's special case, a `Hand` object represents a player's hand. It contains the following fields:

| Field     | Type                | Description                                             |
| --------- | ------------------- | ------------------------------------------------------- |
| `cards`   | `PlayerCard[]`      | The cards in the hand.                                  |
| `wager`   | `UserHandMainWager` | The wager amount, and any side wagers, for the hand.    |
| `status`  | `HandStatus`        | The status of the hand.                                 |
| `actions` | `HandActions`       | The actions the player has taken so far with this hand. |

### PlayerCard

The `PlayerCard` object represents a single card in a hand. It contains the following fields:

| Field    | Type            | Description                           |
| -------- | --------------- | ------------------------------------- |
| `suit`   | `CardSuitType`  | The suit of the card.                 |
| `value`  | `CardValueType` | The value of the card.                |
| `hidden` | `boolean`       | Whether the card is hidden in the UX. |

### CardSuitType

This is an enum that represents the suit of a card. It can be one of the following values:

- `Hearts`
- `Diamonds`
- `Clubs`
- `Spades`
- `Hidden`

### CardValueType

This is an enum that represents the value of a card. It can be one of the following values:

- `0` (hidden)
- `2` (Two)
- `3` (Three)
- `4` (Four)
- `5` (Five)
- `6` (Six)
- `7` (Seven)
- `8` (Eight)
- `9` (Nine)
- `10` (Ten)
- `10.1` (Jack)
- `10.2` (Queen)
- `10.3` (King)
- `1 | 11` (Ace)

### UserHandMainWager

The `UserHandMainWager` object represents the wager amount, and any side wagers, for a hand. It contains the following fields:

| Field   | Type                 | Description                            |
| ------- | -------------------- | -------------------------------------- |
| `type`  | `HandWagerType.Main` | The type of wager.                     |
| `sides` | `UserHandWagers`     | The side wagers, if any, or undefined. |

### UserHandWagers

The `UserHandWagers` object represents the side wagers for a hand. It contains the following fields:

| Field     | Type               | Description                                              |
| --------- | ------------------ | -------------------------------------------------------- |
| `type`    | `HandWagerType`    | The type of wager, will never be `Main`.                 |
| `amount`  | `number`           | The amount of the wager.                                 |
| `outcome` | `WagerOutcomeType` | The outcome of the wager. This defaults to `unknown`. \* |

\* Note: The `outcome` will be resolved immediately when possible, and it can change in any action response. Side wagers like `Perfect Pairs` and `21+3` will be resolved immediately after cards are dealt, but `Insurance` will not be resolved until the dealer's hand is complete.

### HandWagerType

This is an enum that represents the type of a wager. It can be one of the following values:

- `insurance`
- `perfect-pairs`
- `twenty-one-plus-three`

### WagerOutcomeType

This is an enum that represents the outcome of a wager. It can be one of the following values:

- `win`
- `loss`
- `draw`
- `unknown`

### HandStatus

The `HandStatus` object represents the status of a hand. It contains the following fields:

| Field           | Type      | Description                           |
| --------------- | --------- | ------------------------------------- |
| `value`         | `number`  | The value of the hand.                |
| `isHard`        | `boolean` | Whether the hand is hard or not.      |
| `isSoft`        | `boolean` | Whether the hand is soft or not.      |
| `isBust`        | `boolean` | Whether the hand is bust or not.      |
| `isBlackjack`   | `boolean` | Whether the hand is blackjack or not. |
| `canHit`        | `boolean` | Whether the hand can hit or not.      |
| `canStand`      | `boolean` | Whether the hand can stand or not.    |
| `canInsure`     | `boolean` | Whether the hand can insure or not.   |
| `canSplit`      | `boolean` | Whether the hand can split or not.    |
| `canDoubleDown` | `boolean` | Whether the hand can double or not.   |

### HandActions

The `HandActions` field is an array of `HandAction` object that represents the actions the player has taken so far with a hand. Each one contains the following fields:

| Field       | Type             | Description                      |
| ----------- | ---------------- | -------------------------------- |
| `type`      | `HandActionType` | The type of action.              |
| `timestamp` | `Date`           | The date and time of the action. |

### HandActionType

This is an enum that represents the type of a hand action. It can be one of the following values:

- `0` (deal)
- `1` (hit)
- `2` (stand)
- `3` (double down)
- `4` (split)
- `6` (insurance)

Some action have additional information associated with them. Those types and their additional fields are described below.:

#### Deal, Hit, and Double Down

The `HandActionType.Deal`, `HandActionType.Hit`, and `HandActionType.DoubleDown` actions are all action types that include a card removed from the shoe. They contain the following additional fields:

| Field       | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| `shoeIndex` | `number` | The index of the shoe card that was dealt. |

#### Insurance

The `HandActionType.Insurance` action is an action type that includes a wager when accepted. It contains the following additional fields:

| Field    | Type      | Description                                                                           |
| -------- | --------- | ------------------------------------------------------------------------------------- |
| `accept` | `boolean` | `true` if insurance was offered and accepted, `false` if it was offered and declined. |
