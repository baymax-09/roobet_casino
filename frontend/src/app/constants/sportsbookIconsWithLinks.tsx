import soccer from 'assets/images/games/sportsbetting/soccer.png'
import mma from 'assets/images/games/sportsbetting/mma.png'
import basketball from 'assets/images/games/sportsbetting/basketball.png'
import baseball from 'assets/images/games/sportsbetting/baseball.png'
import fifa from 'assets/images/games/sportsbetting/fifa.png'
import tennis from 'assets/images/games/sportsbetting/tennis.png'
import counterStrike from 'assets/images/games/sportsbetting/counterStrike.png'
import tableTennis from 'assets/images/games/sportsbetting/tableTennis.png'
import iceHockey from 'assets/images/games/sportsbetting/iceHockey.png'
import cricket from 'assets/images/games/sportsbetting/cricket.png'

import {
  baseballSearchLink,
  basketballSearchLink,
  soccerSearchLink,
  tennisSearchLink,
  counterStrikeSearchLink,
  fifaSearchLink,
  tableTennisSearchLink,
  cricketSearchLink,
  iceHockeySearchLink,
  mmaSearchLink,
} from './sportsbookLinks'

export const SPORTSBOOK_ICONS_WITH_LINKS = [
  {
    key: 'soccer',
    logo: soccer,
    path: soccerSearchLink,
    // t('sportsbookList.soccer')
    title: 'sportsbookList.soccer',
  },
  {
    key: 'basketball',
    logo: basketball,
    path: basketballSearchLink,
    // t('sportsbookList.basketball')
    title: 'sportsbookList.basketball',
  },
  {
    key: 'tennis',
    logo: tennis,
    path: tennisSearchLink,
    // t('sportsbookList.tennis')
    title: 'sportsbookList.tennis',
  },
  {
    key: 'counter-strike',
    logo: counterStrike,
    path: counterStrikeSearchLink,
    // t('sportsbookList.counterStrike')
    title: 'sportsbookList.counterStrike',
  },
  {
    key: 'fifa',
    logo: fifa,
    path: fifaSearchLink,
    // t('sportsbookList.fifa')
    title: 'sportsbookList.fifa',
  },
  {
    key: 'baseball',
    logo: baseball,
    path: baseballSearchLink,
    // t('sportsbookList.baseball')
    title: 'sportsbookList.baseball',
  },
  {
    key: 'ice-hockey',
    logo: iceHockey,
    path: iceHockeySearchLink,
    // t('sportsbookList.iceHockey')
    title: 'sportsbookList.iceHockey',
  },
  {
    key: 'cricket',
    logo: cricket,
    path: cricketSearchLink,
    // t('sportsbookList.cricket')
    title: 'sportsbookList.cricket',
  },
  {
    key: 'mma',
    logo: mma,
    path: mmaSearchLink,
    // t('sportsbookList.mma')
    title: 'sportsbookList.mma',
  },
  {
    key: 'table-tennis',
    logo: tableTennis,
    path: tableTennisSearchLink,
    // t('sportsbookList.tableTennis')
    title: 'sportsbookList.tableTennis',
  },
] as const
