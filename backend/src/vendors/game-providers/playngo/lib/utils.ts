import moment from 'moment'

export function convertBalance(balance: number): string {
  return balance.toFixed(2)
}

export function convertTsToDate(ts: string | Date): string {
  return moment(ts).format('YYYY-MM-DD')
}
