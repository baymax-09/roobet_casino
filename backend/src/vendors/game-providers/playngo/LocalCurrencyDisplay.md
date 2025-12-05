## Local Currency Display <> Playngo

Tested locally / on stage and PlayNGo game: _Ace of Spades_

Process Flow:

1. Intialize: Provider side currency and initial displayBalance established in the `/authenticate` callback response.

- Must create a unique `externalId` for each new user/currency pair.

2. Balance: Provider pings for current balance with a currency field bearing request. The request currency is used to convert the users Balance into a displayBalance for return.

3. Reserve (bet): request contains currency field, bet amounts will be in units of that currency.

   - Create gameRound with bet request.
   - Use the request currency to convert betAmount to betAmountUSD.
   - Process bet transaction with USD amount.
   - Return new balance converted to a displayBalance via requestCurrency.

4. Release (win): request contains currency field, win amounts will be in units of that currency.

   - Extract request currency and update existing gameRound with winAmount, pass request currency to creation input if no gameRound exists.
   - Closeout bet, convert request amounts to USD before writing to betHistory.
   - Process win transaction with USD amount.
   - Return new balance converted to a displayBalance via requestCurrency.

5. CancelReserve (rollback): request contains currency field.
   - If the specified gameRound is found, update amount(s).
   - Extract request currency and use to convert amounts to USD before transaction.
   - Return new balance converted to a displayBalance via requestCurrency.

PNG is `currency aware`, meaning that the provider side has a currency setting that should be passed along with any transactable requests.
As such, the currency conversion for this provider will make use of the `requestCurrency` in back converting amounts prior to transaction.

## Infrastructure

- The PNG callback process makes use of the `png_game_rounds` mongo collection.

### Top-Level Tests

- Does the existing flow (USD) remain unchanged?
- Does the displayCurrency (feature access) flow function?
  - Do the displayCurrency conversions yield the expected values? Currencies should be converted to USD prior to transaction logic: 1eur bet ~== 1.06usd transacted
- Does the featureFlag gate & does the non-feature flow match that of the existing flow (USD)?
