# Slotegrator Slots

This module includes the models, routes, and business logic for our Slotegrator Slots integration. The integration shares some common code with the Slotegrator Sports module, but they are entirely separate concerns.

## Local Testing

To test locally, you must start the following ngrok tunnel:

```
$ ngrok http -subdomain=elder-slotegrator 3003
```

Additionally, ensure the games are available in your database by running the `tpGamesUpdater` worker. You can enable them via the Games Manager in the ACP.

## Enabling Additional Providers

Unlike our other game integrations, there are special cases and exceptions for each provider.

The list of enabled providers can be found here: [`providers.ts`](./lib/providers.ts)

### Round Closure

For each provider, the marker for round closure is different. Some providers support multiple wins per round. If that is the case, there _should_ be a `finished` boolean on win requests.

In [`win.ts`](./lib/events/win.ts), there is a dictionary (`isRoundFinished`) that includes a resolver per provider.

**IMPORTANT: Reach out to Slotegrator to confirm round closure logic/support prior to enabling a provider.**

## Currency Support

This module has been updated to support multiple unlimited different currencies. We fetch the list of available currencies from Slotegrator's API. There should be no code changes necessary to enable additional currencies.

Locally, only EUR is enabled at the moment.

### Stored amounts

The amounts written to the [`slotegrator_slots_actions`](./documents/slotegratorSlotsActions.ts) collection are in the local currency.

All other amounts written to our persistent stores (active bets, bet histories) are in USD.
