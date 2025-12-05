import { OTHER_REASON } from 'common/types'

export const UserLockReasons = [
  'AML | A1',
  'AML | A2',
  'AML | A3',
  'AML | A4',
  'AML | A5',
  'AML | A6',
  'AML | A7',
  'AML | A8',
  'AML | Linked/Blacklisted Account',
  'Delete Account Request',
  'Fraud | F1',
  'Fraud | F2',
  'Fraud | F3',
  'Fraud | F4',
  'Fraud | F5',
  'Fraud | F6',
  'Fraud | F7',
  'Fraud | F8',
  'Fraud | Linked/Blacklisted Account',
  'Fraud | Unresponsive KYC Request',
  'Illicit Funds / Chainalysis Risk Alert | Blank',
  'Illicit Funds / Chainalysis Risk Alert | Chainalysis Linked/Blacklisted Account',
  'Legal | L1',
  'Legal | L2',
  'Responsible Gambling | Responsible Gambling Violation',
  'Responsible Gambling | RG Linked/Blacklisted Account',
  'Responsible Gambling | Self Exclusion',
  'Responsible Gambling | Temporary Break',
  'Responsible Gambling | Restricted Age',
  'Responsible Gambling | Restricted Age Linked Account',
  'Restricted Territory - Self Lock',
  'Restricted Territory - Other | RT1',
  'Restricted Territory - Other | RT2',
  'Restricted Territory - Other | RT3',
  'Restricted Territory - Other | RT Linked/Blacklisted Account',
  'Other',
].map(reason => ({ key: reason, value: reason }))

export const UserTransactionToggleReasons = [
  'Chainalysis',
  'Restricted Territory',
  'Responsible Gambling',
  'Bonus Abuse',
  'Payments & Fraud',
  'Casino Fraud',
  'Sportsbook Fraud',
  'Partnerships',
  OTHER_REASON,
].map(reason => ({ key: reason, value: reason }))

export const handleToggleReasons = (params): string | false => {
  const { reason, other } = params

  if (reason && reason !== OTHER_REASON) {
    return reason
  }
  if (reason === OTHER_REASON && other) {
    return `Other - ${other}`
  } else {
    return false
  }
}
