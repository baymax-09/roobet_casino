# Softswiss

## TODO

- separate admin and callback routers

## API Documents

The credentials for logging in are in 1password

https://docs.softswiss.com/display/CASINOPUB/GAME+AGGREGATOR

https://docs.softswiss.com/display/GA/Universal+Game+Content+API

BACKEND_URL: https://intaggr.softswiss.net

SCRIPT_URL: https://intaggr.softswiss.net/public/sg.js

CASINO_URL http://elder-softswiss.ngrok.io

## Dev Environment Testing

Ngrok subdomain `softswiss`

```sh
ngrok http --hostname=elder-softswiss.ngrok.io 3003
```

Test with a `BGaming` game such as `Spin and Spell`.

## Acceptance Testing

> On stage only Bgaming games are available, when you are ready on stage, we can move further on prod and there we will activate other providers' games you want to have on a new project. Also normally on stage among currencies available only EUR, USD, UAH, RUB, BTC, all other currencies will be available on prod.
>
> Acceptance test and Secondary test are to help you with our integration as well as help to understand and fix any issues in integration process if you have them. By cases in the tests we check if you made the integration correctly or not. To test yourself you should "launch" only Acceptance test, Secondary test should be added just for several cases in Acceptance test and it will be run automatically for those cases. If the tests are passed all lights in the test will be green, if you have red lights please see the details of the case, there you will find description of an error you have. When you have all green lights, please give me details to check the test by myself.
>
> After I check your Acceptance test, I need to make a quick check how Bgaming games work on prod, how the balance shown on front and in our logs, how you send responses, etc. After I check this, we can move further on prod, on prod you also should firstly add Bgmaing games, I will also make a quick check and then we will activate other providers for you.

```yml
---
- title: Secondary game
  identifier: acceptance:secondary_test
  identifier2:
  provider: acceptance
  producer: softswiss
  category: slots
  has_freespins: true
  feature_group: basic
  devices:
    - desktop
    - mobile
  restrictions:
    default:
      blacklist: []
- title: Tests
  identifier: acceptance:test
  identifier2:
  provider: acceptance
  producer: softswiss
  category: slots
  has_freespins: true
  feature_group: basic
  devices:
    - desktop
    - mobile
  restrictions:
    default:
      blacklist: []
```

```json
{
  "_id": { "$oid": "5f3ab9b2a5218c34189b911d" },
  "identifier": "acceptance:test",
  "__v": 0,
  "aggregator": "softswiss",
  "backgroundImage": false,
  "blacklist": [],
  "category": "slots",
  "createdAt": { "$date": "2020-06-17T20:34:13.114Z" },
  "devices": ["desktop", "mobile"],
  "hasFreespins": false,
  "hasFunMode": true,
  "image": false,
  "largeImage": false,
  "live": null,
  "payout": 94.74,
  "producer": "BGaming",
  "producerInternal": "bgaming",
  "provider": "softswiss",
  "recalled": null,
  "squareImage": false,
  "title": "Acceptance Test",
  "updatedAt": { "$date": "2020-08-17T17:06:56.140Z" },
  "whitelist": null
}
```

Insert this json blob into `tp_games` to be able to go to http://localhost:9000/slots/acceptance:test
