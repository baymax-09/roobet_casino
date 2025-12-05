# Coin Flip

Coinflip is one of our Roobet house games.

Coinflip is a PVP game where a user can create multiple games to play against other players or a bot (playing against the house). Users call if the coin will land on heads or tails and place a bet.

Coinflip games exist in states: open, started, finished, cancelled.
When games are created, they are OPEN.
When a player or bot joins a game they are STARTED.
When a game is resolved and the player paid (if they won), then the game is FINISHED.
If a game is refunded or failed for some other reason after being started, then the game is CANCELLED.

Open -> Started -> (Finished || Cancelled)

For coinflip, we use a pattern of only updating game records if they match certain conditions. The main condition being the game state (or the "status" field on the record).
This ensures that we only update a game if it is in the state that we are expecting.

## Game Resolution Queue

This house game uses a queue to resolve games. Games that have been joined and put into the STARTED state will be published to a queue for processing.
The queue consumer handles all steps for resolving a game:

1. Validation Checks -- Is the game in the correct state? And is all the game/bet/user info correct?
2. Calculating Game Result
3. Closing out the bet -- includes paying the user if they won

## Testing

To test the module, run the following command:

    $ npm run test:coinflip
