# Hub88

## Documentation

Operator API: https://hub88.io/docs/operator

## How to test

- Turn on VPN 51.79.74.49 (only this IP is whitelisted by their API)
- Run `ngrok`

```sh
ngrok http --hostname=elder-hub88.ngrok.io 3003 (for callbacks)
```

### Bare bones test

- You can search for a `gameID` by searching your local `tp_games` for with `{ aggregator: 'hub88' }`
- The gameId is the `gid` field in the record
- Once you have a game ID you want to test visit:
  http://localhost:3003/hub88/internal/getGameUrl?gameId=`gameIdGoesHere`&platform=desktop
- This will give you a url to hit which will run the game
- Callbacks will go to: `elder-hub88.ngrok.io/hub88/...whatever`

### Known Testable Games:

Vegas Strip Blackjack:

- http://api.pambet.test/hub88/internal/getGameUrl?gameId=2947&platform=desktop
- http://pambet.test/game/hub88:mgg_vegasstripblackjack

## Regression Test Suite

https://fryday.server1.ih.testenv.io/

Get user ID from 1password7
