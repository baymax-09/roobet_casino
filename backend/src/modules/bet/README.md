# Bet

## Bet Process

- The bet process is started outside of this module -- in the individual game modules.
- A user joins a game (or "starts" a game in the case of mines and towers) and then a bet is placed.
- Then we run placeBet
  - deductFromBalance and create an activeBet record in rethinkdb
- When the game is over, we close out the bet
  - closeoutBet in bets/index.ts
  - prepareAndCloseoutActiveBet -- update the active bet and create a bet history record in rethinkdb
  - closeoutBet in bets/lib/closeout.ts -- settle bet and create bet history record in mongodb
- In general, bets go from activeBet -> BetHistory -> BetHistoryMongo for long term storage
