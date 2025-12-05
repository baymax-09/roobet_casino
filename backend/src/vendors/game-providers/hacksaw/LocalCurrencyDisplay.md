## Local Currency Display <> Hacksaw

Tested locally / on stage and Hacksaw game: _It's Bananas_

Process Flow:

1. Intialize: Provider side currency and initial displayBalance established via `AUTHENTICATE_EVENT`

2. BALANCE_EVENT: Provider pings for current balance. Respond with the users displayCurrency setting (converted to currencyCode) and their balance converted to units of that currency.

3. BET_EVENT: request contains currency field, bet amounts will be in units of that currency. <br> a. Process requestCurrency, use to convert betAmount to betAmountUSD <br> b. Create activeBet record with request currency and requested bet amount <br> c. Process bet transaction with USD amount. <br> d. Return new balance converted to a displayBalance via requestCurrency.

4. WIN_EVENT: request contains currency field, win amounts will be in units of that currency. <br> a. Process request currency, use requestCurrency to convert winAmount to winAmountUSD. <br> b. Closeout bet, convert request amounts to USD before writing to betHistory. <br> c. Process win transaction with USD amount. <br> d. Return new balance converted to a displayBalance via requestCurrency.

5. ROLLBACK_EVENT: request contains currency field. <br> a. If the specified activeBet is found, process requestCurrency and use to convert amount to amountUSD. <br> b. If type === 'bet', creditBalance with amountUSD. <br> c. If type === 'win', deductBalance with amountUSD. <br> d. Return new balance converted to a displayBalance via requestCurrency.

Hacksaw provider is `currency aware`, meaning that the provider side has a currency setting that should be passed along with any transactable requests.
As such, the currency conversion for this provider will make use of the `requestCurrency` in back converting amounts prior to transaction.

## Infrastructure

- The Hacksaw callback process makes use of the `ActiveBet` mongo collection.

- The entry point for Hacksaw display currency is the `currency` field in the initial `AUTHENTICATION_EVENT`

### Top-Level tests:

- Does the existing flow (USD) remain unchanged?
- Does the displayCurrency (feature access) flow function?
  - Do the displayCurrency conversions yield the expected values? Currencies should be converted to USD prior to transaction logic: 1eur bet ~== 1.06usd transacted
- Does the featureFlag gate & does the non-feature flow match that of the existing flow (USD)?

### Route-Level tests:

#### AUTHENTICATE_EVENT

- Does the return contain the users `displayCurrency` setting?
- Does the return contain the users current balance converted to the specified currency?
- Given the response `displayBalance` and `currency` fields, is the backConverted balance at unity with the known balance? (unit test?)

#### BALANCE_EVENT

- Does the return contain the users `displayCurrency` setting?
- Does the return contain the users current balance converted to the specified currency?
- Given the response `displayBalance` and `currency` fields, is the backConverted balance at unity with the known balance? (unit test?)

#### BET_EVENT (Request - Has Currency Field)

- Is the requestCurrency processed against our `DisplayCurrency` type?
- Is the betAmount converted to betAmountUSD via requestCurrency?
- Is the activeBet record created with betAmountUSD?
- Are any balance transactions completed in USD?
- Is the return balance converted via the requestCurrency?

#### WIN_EVENT (Request - Has Currency Field)

- Is the requestCurrency used for converting betAmount to betAmountUSD?
- Is the activeBet payout amount updated with the request winnings?
- Are any balance changes transacted in USD?
- Are we writing to betHistory with converted USD amounts?
- Is the return balance converted based via the requestCurrency?

#### ROLLBACK_EVENT (Request - Has Currency Field)

- Does the rollback amount in USD match the target transaction amount in USD?
