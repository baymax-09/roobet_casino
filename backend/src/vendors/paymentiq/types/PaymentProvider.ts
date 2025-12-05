export type PaymentProvider =
  | 'SafeCharge'
  | 'Directa24'
  | 'AstroPayCard'
  | 'Interac'
  | 'MuchBetter'
  | 'Payop'
  | 'BestPay'
  | 'CardPay' // Rebranded to 'Unlimint' but still 'CardPay' in requests
  | 'SaltarPay'
  | 'Pay4Fun'
  | 'Pay4FunGo'
  | 'Payper'
  | 'MiFinity'
  | 'PayRetailers'
  | 'EcoPayz'
  | 'Skrill'
  | 'RupeePayments'

type SafeChargePaymentMethodType =
  | 'CreditcardDeposit'
  | 'CreditcardWithdrawal'
  | 'Refund'
  | 'Void'
  | 'SofortDeposit'
  | 'GiropayDeposit'
  | 'PaysafecardDeposit'
  | 'WebRedirectDeposit'
  | 'Capture'
  | 'InstadebitDeposit'
  | 'IDebitDeposit'
  | 'ÌdealDeposit'
  | 'QiwiDeposit'
  | 'EutellerDeposit'
  | 'TrustlyDeposit'
  | 'EpsDeposit'
  | 'BankIBANDeposit'
  | 'Przelewy24Deposit'

type Directa24PaymentMethodType =
  | 'BankDeposit'
  | 'AstroPayBankWithdrawal'
  | 'CreditcardWithdrawal'
type AstroPayCardPaymentMethodType =
  | 'AstroPayCardDeposit'
  | 'AstroPayCardWithdrawal'
  | 'Refund'
type InteracPaymentMethodType =
  | 'BankDeposit'
  | 'InteracWithdrawal'
  | 'InteracDirectWithdrawal'
type MuchBetterPaymentMethodType = 'MuchBetterDeposit' | 'MuchBetterWithdrawal'
type PayopPaymentMethodType =
  | 'CreditcardDeposit'
  | 'BankDeposit'
  | 'CreditcardWithdrawal'
  | 'WebRedirectDeposit'
  | 'Refund'

type BestPayPaymentMethodType =
  | 'BestPayDeposit'
  | 'CommunityBankDeposit'
  | 'BestPayWithdrawal'
  | 'BankIBANWithdrawal'
  | 'CreditcardDeposit'
  | 'BankDeposit'
  | 'CryptoCurrencyWithdrawal'
  | 'CryptoCurrencyDeposit'
  | 'BestPayNetbankingWithdrawal'
  | 'BestPayInteracWithdrawal'
  | 'BestPayNetbankingIdrWithdrawal'
  | 'BestPayBankIBANWithdrawal'

type UnlimintPaymentMethodType =
  | 'CreditcardDeposit'
  | 'CreditcardWithdrawal'
  | 'Refund'
  | 'Void'
  | 'CreditcardAccountVerification'
  | 'Capture'
  | 'BoletoBancarioDeposit'
  | 'LotericaDeposit'
  | 'PagoEfectivoDeposit'
  | 'OxxoDeposit'
  | 'WebRedirectDeposit'
  | 'BankDeposit'
  | 'ThreeDS2Authentication'

type SaltarPayPaymentMethodType =
  | 'CreditcardDeposit'
  | 'Capture'
  | 'Void'
  | 'Refund'

type Pay4FunPaymentMethodType =
  | 'WebRedirectDeposit'
  | 'Pay4FunWithdrawal'
  | 'Pay4FunDeposit'

type Pay4FunGoPaymentMethodType = 'Pay4FunGoDeposit' | 'Pay4FunGoWithdrawal'

type PayperPaymentMethodType =
  | 'WebRedirectDeposit'
  | 'WebRedirectWithdrawal'
  | 'BankDirectDeposit'
  | 'BankDirectWithdrawal'
  | 'CreditcardWithdrawal'
  | 'Reversal'
  | 'Refund'

type MiFinityPaymentMethodType =
  | 'CreditcardWithdrawal'
  | 'MiFinityEWalletDeposit'
  | 'MiFinityEWalletWithdrawal'
  | 'BankDomesticWithdrawal'
  | 'BankLocalWithdrawal'
  | 'BankIBANWithdrawal'
  | 'Reversal'

type PayRetailersPaymentMethodType =
  | 'WebRedirectDeposit'
  | 'PayRetailersWithdrawal'
  | 'PixWithdrawal'
  | 'Reversal'

type EcoPayzPaymentMethodType = 'EcoPayzDeposit' | 'EcoPayzWithdrawal'

type SkrillPaymentMethodType = 'SkrillDeposit' | 'SkrillWithdrawal'

type RupeePaymentsPaymentMethodType =
  | 'BankDeposit'
  | 'BankIntlWithdrawal'
  | 'RupeePaymentsCashDeposit'
  | 'RupeePaymentsCashWithdrawal'

export type PaymentIQTransactionType = 'deposit' | 'withdrawal' | 'unknown'

export type PaymentMethod =
  | SafeChargePaymentMethodType
  | Directa24PaymentMethodType
  | AstroPayCardPaymentMethodType
  | InteracPaymentMethodType
  | MuchBetterPaymentMethodType
  | PayopPaymentMethodType
  | BestPayPaymentMethodType
  | UnlimintPaymentMethodType
  | SaltarPayPaymentMethodType
  | Pay4FunPaymentMethodType
  | Pay4FunGoPaymentMethodType
  | PayperPaymentMethodType
  | MiFinityPaymentMethodType
  | PayRetailersPaymentMethodType
  | EcoPayzPaymentMethodType
  | SkrillPaymentMethodType
  | RupeePaymentsPaymentMethodType

export interface ProviderResponse {
  statusCode?: string
  pspStatusCode?: string
  pspStatusMessage: string
  info?: string
}
