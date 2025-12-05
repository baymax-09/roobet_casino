import moment from 'moment'

const now = moment()

export const mockRain = {
  id: 'rain',
  balanceType: 'btc',
  creatorUserId: 'test',
  creatorName: 'test',
  createdByUser: true,
  amount: 10,
  rainInit: now.toISOString(),
  rainStartTime: now.add(1, 'minutes').toISOString(),
  rainEndTime: now.add(2, 'minutes').toISOString(),
  usersEnteredRain: { 'test2': true },
  usersShareOfRain: { 'test2': 100 },
  status: 'countdown',
}
