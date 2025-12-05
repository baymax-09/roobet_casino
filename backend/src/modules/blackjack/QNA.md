# Question & Answers

## Regarding `GameStatus`: <sup>(`pending`, `active`, `complete`, `rejected`)</sup>

- Does the pending state mean game creation is an async process?

  - In the sense that a game is created (`pending`), but not started (`active`) until the player has submitted wagers per hand indicating how many hands will be played.

- When would rejected be thrown?

  - A status of `rejected` is never thrown. A game could be in a status of rejected if it were acted on my a support agent. There are currently no other cases where a game would be rejected.

- When would a game creation endpoint (POST /blackjack) ever return a complete status?

  - A creation request will never return a `complete` status. A `start` request can return `complete`, if one of the players, or the dealer, is dealt a blackjack (exactly two cards totalling 21).

- If an active game is already underway, does a POST to this endpoint just return the current active game associated with the player?
  - The `create` endpoint will ALWAYS create a new game and doesn't receive a game id.
  - In general, calling an inappropriate endpoint will return an error. Each endpoint validates the game is in the correct state before acting on it.

## Regarding `HandStatus`: <sup>`isHard`, `isSoft`, etc.</sup>

- What do these mean?
  - Here's a complete breakdown of the values on `HandStatus`:
    - `value` <sup>(`number`)</sup>: The total optimistic numeric value of the hand
      - Ace being either 11 or 1, are counted as whichever is more advantageous to the player
    - `isHard` <sup>(`boolean`)</sup>:
      - A hand without an Ace or an Ace counted as 1 to avoid busting.
    - `isSoft` <sup>(`boolean`)</sup>:
      - A hand that includes an Ace counted as 11 without busting.
    - `isBust` <sup>(`boolean`)</sup>:
      - The hand value cannot be counted as less than 21.
    - `isBlackjack` <sup>(`boolean`)</sup>:
      - The hand has exactly two cards totaling exactly 21.
    - `canHit` <sup>(`boolean`)</sup>:
      - The hand is eligible to `hit` and will validate as such on the server.
    - `canStand` <sup>(`boolean`)</sup>:
      - The hand is eligible to `stand` and will validate as such on the server.
    - `canInsure` <sup>(`boolean`)</sup>:
      - Insurance has been offered to the hand based on the dealers hand, and is eligible to be insured and will validate as such on the server.
    - `canSplit` <sup>(`boolean`)</sup>:
      - The hand is eligible to `split` and will validate as such on the server.
    - `canDoubleDown` <sup>(`boolean`)</sup>:
      - The hand is eligible to `double down` and will validate as such on the server.

## Regarding `hand.actions`:

- This is the history of actions a player took against each hand correct?
  - Yes, that's correct.

## Regarding `card.value: "hidden"`:

- When would a card value be hidden? Is this for the dealer's flip card?
  - Correct, this is used exclusively for the dealer's hole-card.

## Regarding `HandActions.shoeIndex`:

- What significance does the shoe card have in game or the UI?

  - It may have no significance in the UX, but it represents the index in the shoe from which a card was dealt.

- Is the shoe card physically represented in Roo's first person blackjack or other blackjack games that don't have a dealer?
  - Not that I'm aware of. It's a vital part of game verification once the game is complete, but it's likely not a part of the UX.
