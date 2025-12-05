import AstroPayLogo from 'assets/images/psp/astroPay.png'
import InteracLogo from 'assets/images/psp/interac.png'
import PixLogo from 'assets/images/psp/pix.png'
import SkrillLogo from 'assets/images/psp/skrill.png'
import EFLogo from 'assets/images/psp/ef.png'
import UPILogo from 'assets/images/psp/upi.png'
import WebPayLogo from 'assets/images/psp/wp.png'
import BestStartUpCompanyLogo from 'assets/images/awards/bestStartUpCompany.png'
import BestProductLogo from 'assets/images/awards/bestProduct.png'
import BestOperatorLogo from 'assets/images/awards/bestOperator.png'
import { getCachedSrc } from 'common/util'
import {
  CASINO_GAME_SHOWS_LINK,
  CASINO_LIVE_CASINO_LINK,
  CASINO_POPULAR_LINK,
  CASINO_ROOBET_GAMES_LINK,
  CASINO_SLOTS_LINK,
} from 'app/routes/CasinoPageRoute'
import {
  GAME_TAG_BACCARAT_LINK,
  GAME_TAG_BLACKJACK_LINK,
  GAME_TAG_BONUS_BUYS_LINK,
  GAME_TAG_ROULETTE_LINK,
} from 'app/components'

import {
  baseballSearchLink,
  basketballSearchLink,
  counterStrikeSearchLink,
  cricketSearchLink,
  fifaSearchLink,
  iceHockeySearchLink,
  mmaSearchLink,
  soccerSearchLink,
  tableTennisSearchLink,
  tennisSearchLink,
} from './sportsbookLinks'

export interface FooterLink {
  to: string
  label: string
  externalLink?: boolean
  onClick?: () => void
}

interface FooterLinkCategory {
  title: string
  items: FooterLink[]
}

const casinoConfigs = [
  {
    to: CASINO_ROOBET_GAMES_LINK,
    // t('footer.roobetGames')
    label: 'footer.roobetGames',
  },
  {
    to: CASINO_POPULAR_LINK,
    // t('footer.popularGames')
    label: 'footer.popularGames',
  },
  {
    to: CASINO_SLOTS_LINK,
    // t('footer.slots')
    label: 'footer.slots',
  },
  {
    to: GAME_TAG_BONUS_BUYS_LINK,
    // t('footer.bonusBuys')
    label: 'footer.bonusBuys',
  },
  {
    to: CASINO_LIVE_CASINO_LINK,
    // t('footer.liveCasino')
    label: 'footer.liveCasino',
  },
  {
    to: CASINO_GAME_SHOWS_LINK,
    // t('footer.gameShows')
    label: 'footer.gameShows',
  },
  {
    to: GAME_TAG_ROULETTE_LINK,
    // t('footer.roulette')
    label: 'footer.roulette',
  },
  {
    to: GAME_TAG_BLACKJACK_LINK,
    // t('footer.blackjack')
    label: 'footer.blackjack',
  },
  {
    to: GAME_TAG_BACCARAT_LINK,
    // t('footer.baccarat')
    label: 'footer.baccarat',
  },
  {
    to: '/fair',
    // t('footer.fair')
    label: 'footer.fair',
  },
]

const policiesConfig = [
  {
    to: '/terms-and-conditions',
    // t('footer.termsOfService')
    label: 'footer.termsOfService',
  },
  {
    to: '/privacy-policy',
    // t('footer.privacy')
    label: 'footer.privacy',
  },
  {
    to: '/bonus-and-promotion-policy',
    // t('footer.bonus')
    label: 'footer.bonus',
  },
  {
    to: '/sportsbook-policy',
    // t('footer.sportsbookPolicy')
    label: 'footer.sportsbookPolicy',
  },
  {
    to: '/game-policy',
    // t('footer.game')
    label: 'footer.game',
  },
  {
    to: '/kyc-aml-policy',
    // t('footer.aml')
    label: 'footer.aml',
  },
  {
    to: '/responsible-gambling',
    // t('footer.responsibleGambling')
    label: 'footer.responsibleGambling',
  },
]

const promosConfig = [
  {
    to: '/vip',
    // t('footer.vipClub')
    label: 'footer.vipClub',
  },
  {
    to: 'https://promotions.roobet.com/',
    // t('footer.promotion')
    label: 'footer.promotion',
    externalLink: true,
  },
  {
    to: '?modal=redeem',
    // t('footer.redeemPromo')
    label: 'footer.redeemPromo',
  },
  {
    to: 'https://roobetaffiliates.com/',
    // t('footer.affiliates')
    label: 'footer.affiliates',
    externalLink: true,
  },
]

const sportsbookConfig = [
  {
    to: '/sports',
    // t('footer.home')
    label: 'footer.home',
  },
  {
    to: `/sports${soccerSearchLink}`,
    // t('footer.soccer')
    label: 'footer.soccer',
  },
  {
    to: `/sports${basketballSearchLink}`,
    // t('footer.basketball')
    label: 'footer.basketball',
  },
  {
    to: `/sports${tennisSearchLink}`,
    // t('footer.tennis')
    label: 'footer.tennis',
  },
  {
    to: `/sports${counterStrikeSearchLink}`,
    // t('footer.counterStrike')
    label: 'footer.counterStrike',
  },
  {
    to: `/sports${fifaSearchLink}`,
    // t('footer.fifa')
    label: 'footer.fifa',
  },
  {
    to: `/sports${baseballSearchLink}`,
    // t('footer.baseball')
    label: 'footer.baseball',
  },
  {
    to: `/sports${iceHockeySearchLink}`,
    // t('footer.iceHockey')
    label: 'footer.iceHockey',
  },
  {
    to: `/sports${cricketSearchLink}`,
    // t('footer.cricket')
    label: 'footer.cricket',
  },
  {
    to: `/sports${mmaSearchLink}`,
    // t('footer.mma')
    label: 'footer.mma',
  },
  {
    to: `/sports${tableTennisSearchLink}`,
    // t('footer.tableTennis')
    label: 'footer.tableTennis',
  },
]

const supportConfig = [
  {
    to: '/about-us',
    // t('footer.aboutUs')
    label: 'footer.aboutUs',
  },
  {
    to: '',
    // t('footer.liveSupport')
    label: 'footer.liveSupport',
    onClick: () => window.Intercom('show'),
  },
  {
    to: 'https://help.roobet.com',
    // t('footer.helpCenter')
    label: 'footer.helpCenter',
    externalLink: true,
  },
  {
    to: 'https://playroobet.com',
    // t('footer.mirrors')
    label: 'footer.mirrors',
    externalLink: true,
  },
  {
    to: 'https://rooresponsibly.com/',
    // t('footer.rooResponsibility')
    label: 'footer.rooResponsibility',
    externalLink: true,
  },
  {
    to: 'https://bugcrowd.com/roobet-vdp',
    // t('footer.vulnerabilityDisclosure')
    label: 'footer.vulnerabilityDisclosure',
    externalLink: true,
  },
]

export const LINK_CATEGORIES: FooterLinkCategory[] = [
  {
    // t('footer.casino')
    title: 'footer.casino',
    items: casinoConfigs,
  },
  {
    // t('footer.sportsbook')
    title: 'footer.sportsbook',
    items: sportsbookConfig,
  },
  {
    // t('footer.policies')
    title: 'footer.policies',
    items: policiesConfig,
  },
  {
    // t('footer.promos')
    title: 'footer.promos',
    items: promosConfig,
  },
  {
    // t('footer.support')
    title: 'footer.support',
    items: supportConfig,
  },
]

export const PARTNERS_CONFIGS = [
  {
    alt: 'Skrill',
    Icon: getCachedSrc({ src: SkrillLogo, quality: 85 }),
    height: 32,
  },
  {
    alt: 'AstroPay',
    Icon: getCachedSrc({ src: AstroPayLogo, quality: 85 }),
    height: 32,
  },
  {
    alt: 'Interac',
    Icon: getCachedSrc({ src: InteracLogo, quality: 85 }),
    height: 40,
  },
  {
    alt: 'Pix',
    Icon: getCachedSrc({ src: PixLogo, quality: 85 }),
    height: 32,
  },
  {
    alt: 'WebPayPlus',
    Icon: getCachedSrc({ src: WebPayLogo, quality: 85 }),
    height: 32,
  },
  {
    alt: 'UPI',
    Icon: getCachedSrc({ src: UPILogo, quality: 85 }),
    height: 32,
  },
  {
    alt: 'EF',
    Icon: getCachedSrc({ src: EFLogo, quality: 85 }),
    height: 32,
  },
]

export const AWARDS_CONFIGS = [
  {
    alt: 'Best Online Casino Product of the Year',
    Icon: getCachedSrc({ src: BestProductLogo, quality: 85 }),
  },
  {
    alt: 'Best Online Casino Operator of the Year',
    Icon: getCachedSrc({ src: BestOperatorLogo, quality: 85 }),
  },
  {
    alt: 'Best Start-Up Company of the Year',
    Icon: getCachedSrc({ src: BestStartUpCompanyLogo, quality: 85 }),
  },
] as const

export const SOCIAL_LINK_CATEGORIES = [
  {
    to: 'https://www.facebook.com/RoobetCom/',
    icon: ['fab', 'facebook'],
  },
  {
    to: 'https://www.instagram.com/roobet/',
    icon: ['fab', 'instagram'],
  },
  {
    to: 'https://www.twitch.tv/roobetcom',
    icon: ['fab', 'twitch'],
  },
  {
    to: 'https://t.me/roobetcom',
    icon: ['fab', 'telegram-plane'],
  },
  {
    to: 'https://open.spotify.com/user/31fcuitp5bvrxgp364546htxvt7u?si=hS4Tr3vfTUm_CXmvscFHPQ&nd=1',
    icon: ['fab', 'spotify'],
  },
] as const
