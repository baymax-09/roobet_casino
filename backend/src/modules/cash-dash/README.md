# Yeti Cash Dash

This module is a clone of `towers`.

### Workflow

1. Hit the `/gameboardLayout` endpoint to render the gameboard. You'll need to
   get the gameboard object from this route whenever the user changes the
   difficulty of the game or changes their betAmount. The gameboard can actually
   change depending on those two variables.

2. Hit the '/start' endpoint and pass a clientSeed, amount (betAmount), and
   a difficulty to start the game. Refer to index.js for the difficulties
   (Levels). This will return an activeGameId, bet object, and provablyFairInfo
   object.

3. When the user selects a tile on the tower, call the '/selectCard' route and
   pass an activeGameId and the selectedCard (tile). The selectedCard should be
   a number, ranging from 0 to the number of columns - 1. If the gameboard is set
   up as a matrices -- an array (the tower) of arrays (rows on the tower), then
   the selectedCard should equal the index of the list item in an array (the
   current row).

   Check the currentRow of the activeGame to ensure the user cannot select an
   incorrect tile.

--Example--
A tower with 3 columns and 3 rows.
currentRow is 0 and the user chooses tileB.
selectedCard = 1
[
[tileA, tileB, tileC],
[tileD, tileE, tileF],
[tileG, tileH, tileI]
]

4. If the user chooses a tile with the value of `fruit`, then that result, along with
   the current payoutMultiplier and the provablyFairInfo object, will be returned.
   If the user chooses a tile with the value of `poop` (...what has my life come
   to), then the game ends.

5. The game also ends if the '/cashout' route is called. Pass an activeGameId
   when calling that route.

6. When the game ends, a deck object and a bet object are returned. The deck
   object is a matrix, as explained in (3).
