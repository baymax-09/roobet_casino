import { exists } from 'src/util/helpers/types'
import {
  type GameUpdaterGames,
  type GameUpdater,
  type GameUpdaterGame,
} from 'src/modules/tp-games/lib'

import { GameKeys, fetchGames } from './games'
import { type TPGameDevices } from 'src/modules/tp-games/documents/games'

function getCategory(gameType: string) {
  if (typeof gameType !== 'string') {
    return false
  }
  gameType = gameType.toLowerCase()
  if (gameType.includes('slot')) {
    return 'slots'
  }
  if (gameType.includes('bingo')) {
    return 'bingo'
  }
  return false
}

const changes = [
  {
    identifier: 'playngo:HotelYetiWay',
    gid: 'hotelyetiway',
  },
  {
    identifier: 'playngo:HouseofDoomCrypt2',
    gid: 'thecrypt',
  },
  {
    identifier: 'playngo:MuertoEnMictlan',
    gid: 'muertoenmictlan',
  },
  {
    identifier: 'playngo:AliceCoopertheTombofMadness',
    gid: 'alicecooper',
  },
  {
    identifier: 'playngo:OdinProtectorofRealms',
    gid: 'odinprotectorofrealms',
  },
  {
    identifier: 'playngo:ThreeClownMonty',
    gid: 'threeclownmonty',
  },
  {
    identifier: 'playngo:RichWildeandtheAmuletoftheDead',
    gid: 'amuletofdead',
  },
  {
    gid: 'thefacesoffreya',
    identifier: 'playngo:TheFacesOfFreya',
  },
  {
    gid: 'catwildeeclipse',
    identifier: 'playngo:CatWildeInTheEclipseOfTheSunGod',
  },
  {
    gid: 'ladyofthelake',
    identifier: 'playngo:LordMerlinAndTheLadyOfTheLake',
  },
  {
    gid: 'twentyfourkdragon',
    identifier: 'playngo:24KDragon',
  },
  {
    gid: 'coilsofcash',
    identifier: 'playngo:CoilsOfCash',
  },
  {
    gid: 'riseofathena',
    identifier: 'playngo:RiseOfAthena',
  },
  {
    gid: 'riddlereels',
    identifier: 'playngo:RiddleReelsACaseofRiches',
  },
  {
    gid: 'reactoonztwo',
    identifier: 'playngo:reactoonztwo',
  },
  {
    gid: 'shieldofathena',
    identifier: 'playngo:RichWildeandtheShieldofAthena',
  },
  {
    gid: 'charliechancehelltopay',
    identifier: 'playngo:CharlieChance',
  },
  {
    gid: '5xmagic',
    identifier: 'playngo:VxMagic',
  },
  {
    gid: 'sevensins',
    identifier: 'playngo:VIISins',
  },
  {
    gid: 'bakerstreat',
    identifier: 'playngo:BakersTreat',
  },
  {
    gid: 'copsnrobbers',
    identifier: 'playngo:CopsnRobbers',
  },
  {
    gid: 'fuerdai',
    identifier: 'playngo:FuErDai',
  },
  {
    gid: 'gemix',
    identifier: 'playngo:GEMiX',
  },
  {
    gid: 'goldtrophy2',
    identifier: 'playngo:GoldTrophyII',
  },
  {
    gid: 'gunslingerreloaded',
    identifier: 'playngo:GunslingerReloaded',
  },
  {
    gid: 'hugosadventure',
    identifier: 'playngo:HugosAdventure',
  },
  {
    gid: 'mermaidsdiamond',
    identifier: 'playngo:MermaidsDiamond',
  },
  {
    gid: 'queensdaytilt',
    identifier: 'playngo:QueensDayTilt',
  },
  {
    gid: 'reactoonz',
    identifier: 'playngo:Reactoonz_desktop',
  },
  {
    gid: 'sweet27',
    identifier: 'playngo:SweetIIVII',
  },
  {
    gid: 'winabeest',
    identifier: 'playngo:WinaBeest',
  },
]

export const updatePlayngoGameList: GameUpdater = async () => {
  const rawGamesList: Array<Record<string, any>> = await fetchGames()

  const games = rawGamesList.reduce<GameUpdaterGames>((games, playngoGame) => {
    const category = getCategory(playngoGame[GameKeys.GameType])

    if (!category) {
      return games
    }

    if (!playngoGame[GameKeys.DefaultPayout]) {
      return games
    }

    const devices: TPGameDevices = (
      [
        playngoGame[GameKeys.NumericGameIDDesktop] ? 'desktop' : null,
        playngoGame[GameKeys.NumericGameIDMobile] ? 'mobile' : null,
      ] as const
    ).filter(exists)

    const game: GameUpdaterGame = {
      gid: `${playngoGame[GameKeys.TextGameIDDesktop]}`,
      gidNumericDesktop: `${playngoGame[GameKeys.NumericGameIDDesktop]}`,
      gidNumericMobile: `${playngoGame[GameKeys.NumericGameIDMobile]}`,
      title: playngoGame[GameKeys.GameName],
      devices,
      hasFreespins: playngoGame[GameKeys.FreeGames] === 'Yes',
      aggregator: 'playngo',
      provider: "Play'n Go",
      providerInternal: 'playngo',
      category,
      blacklist: [
        'ES',
        'AF',
        'AS',
        'AO',
        'AU',
        'BE',
        'BA',
        'DE',
        'KH',
        'HR',
        'DK',
        'ET',
        'HU',
        'IQ',
        'IR',
        'IT',
        'LA',
        'LV',
        'LT',
        'RO',
        'SG',
        'SY',
        'UG',
        'GB',
        'US',
        'VU',
        'YE',
        'CZ',
        'KP',
        'AW',
        'CW',
        'SX',
        'SE',
      ], // country codes blacklisted from playing
      hasFunMode: true,
      live: false,
      payout: Number(
        parseFloat(
          playngoGame[GameKeys.DefaultPayout].replace('%', ''),
        ).toFixed(2),
      ),
    }

    // TODO are these URLs correct?
    playngoGame.image = `https://cdn.softswiss.net/i/s1/${
      game.provider
    }/${game.title.replace(/\s/g, '')}.png`
    playngoGame.squareImage = `https://cdn.softswiss.net/i/s3/${
      game.provider
    }/${game.title.replace(/\s/g, '')}.png`

    for (const change of changes) {
      if (playngoGame[GameKeys.TextGameIDDesktop] === change.gid) {
        playngoGame.image = `https://cdn.softswiss.net/i/s1/${game.provider}/${
          change.identifier.split(':')[1]
        }.png`
        playngoGame.squareImage = `https://cdn.softswiss.net/i/s3/${
          game.provider
        }/${change.identifier.split(':')[1]}.png`
      }
    }

    const identifier = `playngo:${playngoGame[GameKeys.TextGameIDDesktop]}`

    return {
      ...games,
      [identifier]: game,
    }
  }, {})

  return {
    games,
    recalls: [],
  }
}
