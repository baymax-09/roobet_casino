## Local Currency Display <> Softswiss

Tested locally / on stage and Softswiss game: _Spin and Spell_

Process Flow: all bet/win requests are passed through the `/play` route as actions. Play route also handles the `finishGame` logic.

1. Intialize: Provider side currency and initial displayBalance established via `startSession`. The user object returned must contain a unique userId for each user/currency pair. The userID handling occurs via `createSoftswissId` and `parseSoftswissId` functions.

2. Bet: request contains currency field, bet amounts will be in units of that currency.

   - Process requestCurrency, use to convert betAmount to betAmountUSD.
   - Create `Game` (activeBet analog) record with request currency and requested bet amount.
   - Process bet transaction with USD amount.
   - Return new balance converted to a displayBalance via requestCurrency.

3. Win: request contains currency field, win amounts will be in units of that currency.

   - Process request currency, use requestCurrency to convert winAmount to winAmountUSD.
   - Update existing gameRound with winAmount, pass request currency to creation if no gameRound exists.
   - Process win transaction with USD amount.
   - Return new balance converted to a displayBalance via requestCurrency.

4. Rollback: request contains currency field.

   - If the specified Game is found, process requestCurrency and use to convert amount to amountUSD.
   - If type === 'bet', creditBalance with amountUSD.
   - If type === 'win', deductBalance with amountUSD.
   - Return new balance converted to a displayBalance via requestCurrency.

5. Finish: PlayRequest contains currency field.
   - Extract request currency and use to convert amounts to amountUSD before writing to betHistory.

Softswiss provider is `currency aware`, meaning that the provider side has a currency setting that should be passed along with any transactable requests.
As such, the currency conversion for this provider will make use of the `requestCurrency` in back converting amounts prior to transaction.

## Infrastructure

- The Softswiss callback process makes use of the `sf_games` mongo collection.

### Top-Level tests:

- Does the existing flow (USD) remain unchanged?
- Does the displayCurrency (feature access) flow function?
  - Do the displayCurrency conversions yield the expected values? Currencies should be converted to USD prior to transaction logic: 1eur bet ~== 1.06usd transacted
- Does the featureFlag gate & does the non-feature flow match that of the existing flow (USD)?
