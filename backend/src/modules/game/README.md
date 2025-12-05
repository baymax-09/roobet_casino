# Game

## Adding a Client-Side Game with Optional Cashout

Example: Mines, Towers, Blackjack, etc.

# Provably Fair

These types of games will use functions from /lib/shuffle.js and /lib/round.js

1. Add your game to roundTables in round.js
2. Import startNewRound from round.js and buildGroup from shuffle.js into
   whatever file is responsible for the core functionality of your game.

## Provably Fair Explanation -- User Generated Game Results

1. Attempt to start a new round
   - End current round if one exists.
   - Create a new round.
   - Create the round's server seed using the ObjectId from the round record.
   - Update round with server seed.

# Active Game

1. Your game will need its own active games table. Look at Mines module for
   example.
