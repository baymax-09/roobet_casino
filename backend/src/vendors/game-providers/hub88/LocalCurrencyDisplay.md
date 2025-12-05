## Local Currency Display <> Hub88

Tested locally / on stage and Genii (Hub88) game: _Elementium_

Process Flow:

1. Intialize: Provider side currency constructed in `getGameURL`

2. Balance Request: Provider pings for current balance. Respond with the users displayCurrency setting (converted to countryCode) and their balance converted to units of that currency.

3. Bet Request: request contains currency field, bet amounts will be in units of that currency.

   - Process request currency, create gameSession with request currency and amounts native to provider (displayCurrency).
   - Use requestCurrency to convert betAmount to betAmountUSD.
   - Process bet transactions with USD amount.
   - Return new balance converted to a displayBalance via requestCurrency.

4. Win Request: request contains currency field, win amounts will be in units of that currency.

   - Process request currency, update gameSession with won amount in units native to provider (displayCurrency).
   - Use requestCurrency to convert winAmount to winAmountUSD.
   - Process win transaction with USD amount.
   - Amounts written to betHistory table are converted to USD via requestCurrency
   - Return new balance converted to a displayBalance via requestCurrency.

5. Rollback Request: request DOES NOT contain currency field. Request will reference a gameRound/session/transaction.
   - If a previous transaction exist, that transaction will have a request which contains a currency field, this currency is used for the conversion of amounts to USD.
   - Otherwise this follows the same logic as typical bet and win requests, in reverse.

Hub88 provider is `currency aware`, meaning that the provider side has a currency setting that should be passed along with any transactable requests.
As such, the currency conversion for this provider will make use of the `requestCurrency` in back converting amounts prior to transaction.

## Infrastructure

- The Hub88 callback process makes use of the `hub88GameSession` mongo collection; whose function is analogous to that of the `activeBet` records.

- The Hub88 callback process makes use of the `hub88Transactions` mongo collection.

- The entry point for Hub88 display currency is the `currency` field in the frontend call to `/getGameURL`.
  - Requires frontend changes: on branch `PD-2928-3rdParty_frontend`

### Top-Level tests:

- Does the existing flow (USD) remain unchanged?
- Does the displayCurrency (feature access) flow function?
  - Do the displayCurrency conversions yield the expected values? Currencies should be converted to USD prior to transaction logic: 1eur bet ~== 1.06usd transacted
- Does the featureFlag gate & does the non-feature flow match that of the existing flow (USD)?

### Route-Level tests:

#### /user/balance

- Does the return contain the users `displayCurrency` setting?
- Does the return contain the users current balance converted to the specified currency?
- Given the response `displayBalance` and `currency` fields, is the backConverted balance at unity with the known balance?

#### /user/info

- In regards to currency conversion testing within the Hub88 callback process, this test is the exact same as that of `/user/balance`.

#### /transaction/bet (Request - Has Currency Field)

- GameSession (activeBet analog) currency amounts stored as the provider native units (`displayCurrency`)
  - if request betAmount = `1eur` then the gameSession should record a bet with `amount = 1` and `currency = EUR`
- Is the requestCurrency processed against our `DisplayCurrency` type?
- Is the gameSession created appropriately? (Ref first line)
- Is the requestCurrency used for conversion to USD?
- Are any balance transactions completed in USD?
- Is the return balance converted via the requestCurrency?

#### /transaction/win

- Does the request currency match that of the gameSession currency? (still working out what to do for this one)
- Is the gameSession payout amount updated with the request winnings?
- Is the requestCurrency used for converting betAmount to betAmountUSD?
- Are any balance changes transacted in USD?
- Are we writing to betHistory with converted USD amounts?
- Is the return balance converted based via the requestCurrency?

#### /transaction/rollback

- Does the requested transaction to be rolledBack have known units of currency?
  If No, then the process must be structured (or restructured) to store the currency as we expect the provider <bold>WOULD</bold> pass via request.

- Does the rollback amount in USD match the target transaction amount in USD?
