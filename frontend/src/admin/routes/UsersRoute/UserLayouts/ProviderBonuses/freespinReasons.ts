export const OTHER_REASON = 'Other (Please Specify Below)'

export const providerFreespinReasons = [
  'VIP - Friday Roospins',
  'VIP - HV Monday Roospins',
  'VIP - Monthly Competition Spins',
  'VIP - Mid-Month Bonus Feature',
  'VIP - Monthly Newsletter Spins',
  'VIP - Birthday Bonus',
  'VIP - Verification Bonus',
  'VIP - Hospitality Costs',
  'VIP - Loyalty Bonus',
  'CS - Customer Retention',
  'CS - Support Bonus Spins',
  'CS - Marketing Promotion',
  'Sports - UFC Promo',
  'Sports - CRM Promo',
  'Sports - Goodwill',
  'CSC - Monday Roospins',
  'CSC - Monthly Competition Roospins',
  'CSC - Mid-Month Bonus Feature',
  'CSC - Retention',
  'CSC - Bonus Spins',
  'CSC - Marketing Promotion',
  OTHER_REASON,
]

export const handleReasons = params => {
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
