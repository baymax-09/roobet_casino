# Play n Go

## Integration Instructions

- call `/playngo/internal/getGameConfig` to receive `token` which identifies the user and is passed in via the `username` field on desktop or the `ticket` field on mobile. This token is only valid for 5 minutes as per playngo instructions.

## Deploy Checklist

- Make playngo access token and add to env var `PLAYNGO_ACCESS_TOKEN`

## Local Tunnel

```sh
ngrok http --region=us --hostname=elder-playngo.ngrok.io 3003
```
