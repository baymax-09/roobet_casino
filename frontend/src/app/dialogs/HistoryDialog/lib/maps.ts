// TODO: Standardize cases.
export const typeMap = {
  // t('historyTable.all')
  all: 'All',
  // t('historyTable.bet')
  bet: 'Bet',
  // t('historyTable.deposit')
  deposit: 'Deposit',
  // t('historyTable.raffle_reward')
  raffle_reward: 'Raffle Reward',
  dailyClaim: 'Daily Claim', // TODO: Is this still needed?
  // t('historyTable.tip')
  tip: 'Tip',
  // t('historyTable.affiliate')
  affiliate: 'Affiliate Earnings',
  // t('historyTable.adminAddBalance')
  adminAddBalance: 'Admin Add',
  // Legacy transaction type for admin setting a balance to an amount
  // t('historyTable.adminResetBalance')
  adminResetBalance: 'Admin Modify',
  // t('historyTable.adminSetBalance')
  adminSetBalance: 'Admin Modify',
  // t('historyTable.withdrawal')
  withdrawal: 'Withdrawal',
  Rain: 'Rain', // TODO: Is this still needed?
  // t('historyTable.rain')
  rain: 'Rain',
  PromoCode: 'Promo Code', // TODO: Is this still needed?
  // t('historyTable.promo')
  promo: 'Promo Code',
  faucet: 'Faucet Claim', // TODO: Is this still needed?
  // t('historyTable.refund')
  refund: 'Refund',
  // t('historyTable.bonus')
  bonus: 'Bonus',
  rakeback: 'Rakeback', // TODO: Is this still needed?
  // t('historyTable.koth')
  koth: 'King Roo',
  // t('historyTable.roowards')
  roowards: 'Roowards',
  // t('historyTable.payout')
  payout: 'Payout',
  // t('historyTable.cash transfer')
  'cash transfer': 'Cash Transfer',
  // t('historyTable.freeBet')
  freeBet: 'Free Bet',
  // t('historyTable.chargeback')
  chargeback: 'Chargeback',
  // t('historyTable.promoBuyin')
  promoBuyin: 'Promo Buyin',
  // t('historyTable.winRollback')
  winRollback: 'Win Rollback',
  // t('historyTable.survey')
  survey: 'Survey',
  // t('historyTable.cancelledWithdrawal')
  cancelledWithdrawal: 'Cancelled Withdrawal',
  // t('historyTable.declinedWithdrawal')
  declinedWithdrawal: 'Declined Withdrawal',
  // t('historyTable.marketingBonus')
  marketingBonus: 'Marketing Bonus',
  // t('historyTable.matchPromo')
  matchPromo: 'Match Promo',
  // t('historyTable.depositBonus')
  depositBonus: 'Deposit Bonus',
  // t('historyTable.early abort match promo')
  'early abort match promo': 'Early Abort Match Promo',
  // t('historyTable.roowardsReload')
  roowardsReload: 'Roowards Reload',
  prizeDrop: 'Prize Drop',
  // t('historyTable.emberTransfer')
  emberTransfer: 'Ember Transfer',
}

export const cryptoPluginMap = {
  bitcoin: {
    depositLabel: 'Bitcoin',
    withdrawLabel: 'Bitcoin',
  },
  ethereum: {
    depositLabel: 'Ethereum',
    withdrawLabel: 'Ethereum',
  },
  litecoin: {
    depositLabel: 'Litecoin',
    withdrawLabel: 'Litecoin',
  },
  dogecoin: {
    depositLabel: 'Dogecoin',
    withdrawLabel: 'Dogecoin',
  },
  tether: {
    depositLabel: 'Tether',
    withdrawLabel: 'Tether',
  },
  usdc: {
    depositLabel: 'USDC',
    withdrawLabel: 'USDC',
  },
}

export const cashPluginMap = {
  astropay: {
    depositLabel: 'USD',
    withdrawLabel: 'USD',
    detailsLabel: 'Astropay',
  },
  totalProcessing: {
    depositLabel: 'USD',
    withdrawLabel: 'USD',
    detailsLabel: 'Card',
  },
}

export const pluginMap = {
  ...cryptoPluginMap,
  ...cashPluginMap,
}
