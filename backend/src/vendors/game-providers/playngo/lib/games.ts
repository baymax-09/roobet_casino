import { GoogleSpreadsheet } from 'google-spreadsheet'

import { config } from 'src/system'
import { getGame } from 'src/modules/tp-games/documents/games'

export const GameKeys = {
  GameName: 'Game Name',
  GameType: 'Game Type',
  SkinID: 'Skin ID',
  NumericGameIDDesktop: 'Game ID(Desktop)',
  TextGameIDDesktop: 'GID(Desktop)',
  NumericGameIDMobile: 'Game ID(Mobile)',
  TextGameIDMobile: 'GID(Mobile)',
  HTML5Support: 'HTML5Support',
  FLASHSupport: 'FLASHSupport',
  GambleMode: 'GambleMode',
  ProgressiveJackpot: 'ProgressiveJackpot',
  FreeGames: 'FreeGames',
  PersistentState: 'PersistentState',
  DefaultPayout: 'Default',
  '96Config': '96% Config', // whether you can config to diff payouts i think?
  '94Config': '94% Config',
  '91Config': '91% Config',
  '87Config': '87% Config',
  '84Config': '84% Config',
  'X/10': 'X/10',
  Rating: 'RATING',
  FreeSpinsFrequency: 'Free SpinsFrequency(1:X)',
  BonusFrequency: 'BonusFrequency(1:X)',
  DenominationsDefault: 'DenominationsDefault in bold',
  MaximumCoins: 'MaximumCoins',
  MaximumLines: 'MaximumLines',
  MinimumBet: 'MinimumBet',
  MaximumBet: 'MaximumBet',
  MaxExposure: 'MaximumExposure(Max. Bet & Default RTP)',
  Curacao: 'Curacao',
} as const

export async function fetchGames() {
  const doc = new GoogleSpreadsheet(config.playngo.gameInjectionSheet)
  await doc.useServiceAccountAuth({
    client_email: config.googleDrive.client_email,
    private_key: config.googleDrive.private_key,
  })
  await doc.loadInfo()

  const sheet = doc.sheetsByIndex[0]
  const rows = await sheet.getRows()

  const toReturn = []
  for (let i = 0; i < rows.length; i++) {
    const injectedRow = {}
    for (let j = 0; j < Object.keys(GameKeys).length; j++) {
      // @ts-expect-error TODO use Map or something better for accessing
      const currentKey = GameKeys[Object.keys(GameKeys)[j]]
      // @ts-expect-error see above TODO
      injectedRow[currentKey] = rows[i][currentKey]
    }
    toReturn.push(injectedRow)
  }
  return toReturn
}

export const fetchPlayngoGame = async (gameId: string) => {
  return await getGame({
    $or: [
      { gidNumericDesktop: gameId, providerInternal: 'playngo' },
      { gidNumericMobile: gameId, providerInternal: 'playngo' },
    ],
  })
}
