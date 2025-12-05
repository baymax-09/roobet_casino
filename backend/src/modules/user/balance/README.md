# Balance

## Glossary

- `BalanceType`: a type of currency that users can have a wallet for on Roobet: `crypto`, `ltc`, `eth`, `cash`, `usdc`, `usdt`
  - Please note that `crypto` should have been `btc` and `cash` should have been `usd`.
- `BalanceField`: a key on the user object that holds the legacy user balances: `balance`, `ltcBalance`, `ethBalance`, `cashBalance`
- `SelectedBalanceField`: the way through which we track which balance the user is wagering with, this is stored on the user object
- `Portfolio`: the method through which we store newer balance types
- `UserObjectBalanceType`: a `BalanceType` that is tracked on the user object
- `PortfolioBalanceType`: a `BalanceType` that is tracked in the Portfolio
- `BalanceIdentifier`: the union of `BalanceField` and `BalanceType` which we are using to help us migrate from the former to the latter. This is deprecated and should coalesce to `BalanceType`

## Where do we go from here?

1. We have made huge strides in scrubbing `balanceField` from the code base and really only use it when we are talking about the `selectedBalanceField`. We need to get this migrated to a `selectedBalanceType`.

2. We should only be passing around `BalanceType` and not `BalanceIdentifier` or `BalanceField`.
   This will require us to modify some interfaces and stop defaulting to `user.selectedBalanceField` inline.
   We also need to make `balanceType` required instead of accepting `null` | `undefined`.

3. The word altcoin is applied to the portfolio in a lot of places but really the portfolio is agnostic of the currencies that it contains.
   We are slowly removing the word altcoin where it is unnecessary.
