# Plinko

Plinko works by calling `POST /plinko/roll { clientSeed[string], amount[float], numberOfRows[float], riskLevel[string] }`

- numberOfRows is 8 through 11
- riskLevel is 'low', 'medium', or 'high'

The route returns `{ roll, bet, provablyFairInfo } `

- `roll` is the number which was rolled
- `hole` is the number of the hole that was landed on
- `bet` is an instance of `modules/bet/bet_history` which contains the `bet.payoutValue`, explaining how much the bet was won from the roll

`provablyFairInfo` has the schema `{ newRound[bool], roundStartInfo[object], currentRound[object], clientSeed[string] }`

If you don't pass a `clientSeed` to roll, it will be auto generated. `currentRound` is the provably fair round which contains a nonce (which number roll the user is on).

When the user makes their first bet they will receive `roundStartInfo` which gives them a hash they can use to verify their rolls once they end the round.
If the user is reloading the page you can call `GET /plinko/currentRoundHash` to get their hash (used to verify the round)

At some point the user will want to end their plinko round so you can call `POST /endRound`
This will return a seed which the user can use to verify all their previous rolls.

The next time the user calls `POST /plinko/roll` it will start a new round + determine the next hole for the ball.

When you make a roll the results are stored in `bet_history.` Therefore you can use the following `bet` routes to get plinko history:

`GET /bet/getPublicHistoryForGame?gameName=plinko` (returns the latest 50 bets for plinko
`GET /bet/getUserHistoryForGame?userId=<your_user_id>` (returns the latest 50 bets for a user)

`getUserHistoryForGame` can be used to get your own current bets (pass your own id) or the bets of
another user in particular (pass their id). If that user has a private profile, it wont work though.

There is also a new socket event called `new_bet` which returns all values from `bet_history` as they come in. This is for any game. So it would make sense that you build a switch on a per-game basis for instance

```js
socket.on('new_bet', function(bet) {
  if (bet.gameName === 'plinko') {
    append to plinko list
  }
}
```

Remember, all games including plinko, crash and dice are stored in `bet_history`. This will reduce a lot of work in the future and you should use it to your advantage.

The current production edge for plinko is 1%. to modify it, modify `k8s/backend.json` (search for `PLINKO_HOUSE_EDGE`)
