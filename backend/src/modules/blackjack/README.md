# Blackjack

This module is the Blackjack game. For more information consult the [Questions & Answers](./QNA.md).

## Hand Value & Status

The value of a hand is the sum of the value of it's cards, subtracting 10 if an Ace is present and the hand value is greater than 21.

### Status

| Status        | Type               | Description                                                                                     |
| ------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| value         | `number`           | The total numeric value of the hand                                                             |
| isHard        | `boolean`          | True if the hand does not contain an Ace, or if the Ace is counted as 1 to avoid busting        |
| isSoft        | `boolean`          | True if the hand contains an Ace counted as 11 without busting                                  |
| isBust        | `boolean`          | True if the hand's value exceeds 21                                                             |
| isBlackjack   | `boolean`          | True if the hand is two-cards totalling 21                                                      |
| canHit        | `boolean`          | True if the server would process a hit request for this hand                                    |
| canStand      | `boolean`          | True if the server would process a stand request for this hand                                  |
| canInsure     | `boolean`          | True if the dealer shows an Ace and the server would process an insurance request for this hand |
| canSplit      | `boolean`          | True if the server would process a split request for this hand                                  |
| canDoubleDown | `boolean`          | True if the server would process a double down request for this hand                            |
| splitFrom     | `number` OR `null` | The index of the hand that this hand was split from, or null if it was not split                |
| wasDoubled    | `boolean`          | True if the hand was doubled down                                                               |
| outcome       | `HandOutcomeType`  | The outcome of the hand                                                                         |

## Side Wagers

### Perfect Pairs

The "Perfect Pairs" side bet in Blackjack is a popular wager that players can make in addition to their standard blackjack bet. This side bet is based on the first two cards a player is dealt. It must be placed before the cards are dealt.

#### Winning Conditions

The bet wins if the first two cards dealt to the player form a pair. There are typically three types of pairs that are recognized, each with different payouts:

- Perfect Pair: Two identical cards in terms of both rank and suit (e.g., two Kings of Hearts). This yields the highest payout.
- **Colored Pair**: Two cards of the same rank and color but different suits (e.g., a King of Hearts and a King of Diamonds).
- **Mixed Pair**: Two cards of the same rank but different colors and suits (e.g., a King of Hearts and a King of Clubs).

### 21+3

The "21+3" side bet in Blackjack is a wager that combines elements of Blackjack and Three-Card Poker. It's made in addition to the standard Blackjack bet and is based on the player's first two cards and the dealer's up-card. It must be placed before the cards are dealt.

#### Winning Conditions

The 21+3 bet pays out if the player's first two cards combined with the dealer's up-card form a qualifying three-card poker hand. There are several hand types that are typically recognized, similar to poker hands:

- **Flush**: All three cards are of the same suit.
- **Straight**: All three cards are in sequence but not of the same suit.
- **Three of a Kind**: All three cards are of the same rank.
- **Straight Flush**: All three cards are in sequence and of the same suit.
- **Suited Three of a Kind**: All three cards are of the same rank and suit.

## Insurance

Insurance is offered when the dealers up-card (the one visible at deal), is an `Ace`. To accept insurance, the player bet's half of their hand's main wager as the insurance side wager. If the dealer has a `Blackjack`, the player wins the insurance bet, and the hand is a push. If the dealer does not have a `Blackjack`, the insurance bet is lost, and the hand is played out as normal.

## Glossary

Common Blackjack game terminology, phrases, and their definitions:

| Term             | Definition                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Blackjack        | A two-card hand with an Ace and a 10-value card, worth 21 points.          |
| Bust             | When a hand's value exceeds 21, resulting in a loss.                       |
| Hit              | To request an additional card for your hand.                               |
| Stand            | To keep your current hand without requesting more cards.                   |
| Double Down      | Doubling your initial bet and receiving only one more card.                |
| Split            | Splitting a pair of cards into two separate hands, each with its own bet.  |
| Surrender        | Forfeiting the game and receiving half of your bet back.                   |
| Push             | A tie between the player and the dealer, resulting in a refund of the bet. |
| Dealer           | The casino representative responsible for dealing and managing the game.   |
| Hole Card        | The face-down card that the dealer has in their hand.                      |
| Insurance        | A side bet to protect against the dealer having a Blackjack.               |
| Soft Hand        | A hand that includes an Ace counted as 11 without busting.                 |
| Hard Hand        | A hand without an Ace or an Ace counted as 1 to avoid busting.             |
| Shoe             | A device used to hold and dispense cards to the dealer.                    |
| Burn Card        | A card discarded from the deck before starting a new round.                |
| House Edge       | The statistical advantage the casino has over players.                     |
| Natural          | A two-card Blackjack, typically an Ace and a 10-value card.                |
| Shoe Game        | A Blackjack game using multiple decks, typically 4 to 8 decks.             |
| Single Deck Game | A Blackjack game using only one deck of cards.                             |
| Early Surrender  | Surrender option allowed before the dealer checks for Blackjack.           |
| Late Surrender   | Surrender option allowed after the dealer checks for Blackjack.            |

These terms and phrases are essential to understand when playing or discussing Blackjack. They help players communicate and make informed decisions during the game.
