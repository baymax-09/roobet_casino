import React from 'react'
import { Redirect } from 'react-router-dom'

import { GAME_TAG_FAVORITES_LINK, RouteErrorBoundary } from 'app/components'
import { REDIRECTS } from 'app/constants'

import { HomepageRoute } from './HomepageRoute'
import { JapanRoute } from './JapanRoute'
import { GameRoute } from './GameRoute'
import { CrashRoute } from './CrashRoute'
import { VIPRoute } from './VIPRoute'
import { RaffleRoute } from './RaffleRoute'
import { DiceRoute } from './DiceRoute'
import { MinesRoute } from './MinesRoute'
import { PlinkoRoute } from './PlinkoRoute'
import { SportsbettingRoute } from './SportsbettingRoute'
import { FairRoute } from './FairRoute'
import { VipBenefitsRoute } from './VipBenefitsRoute'
import {
  KYCAMLRoute,
  PrivacyRoute,
  PromotionTermsRoute,
  ResponsibleGamblingRoute,
  SiteTermsRoute,
  SportsbookPolicyRoute,
  GamePolicyRoute,
  AboutUsRoute,
} from './Legal'
import { LazySwitch } from './LazyRouter'
import { HotBoxRoute } from './HotBoxRoute'
import { TowersRoute } from './TowersRoute'
import { CoinflipRoute } from './CoinflipRoute'
import { JungleMinesRoute } from './JungleMinesRoute'
import { RouletteNewRoute } from './RouletteNew'
import { MissionUncrossableRoute } from './MissionUncrossableRoute'
import {
  GameTagRoute,
  GameProviderRoute,
  GameFavoritesRoute,
} from './GameListRoute'
import { CasinoPageRoute } from './CasinoPageRoute'
import { AccountSettingsRoute } from './AccountSettingsRoute'
import { RumRoute } from './RumRoute'

// 10 seconds.
const MAX_ROUTE_TRANSITION_MS = 10000

// All routes should be monitored by RUM.
const Route = RumRoute

const Routes: React.FC = () => (
  <LazySwitch
    errorBoundary={RouteErrorBoundary}
    maxLoadingMs={MAX_ROUTE_TRANSITION_MS}
  >
    {[...REDIRECTS].map(([orig, dest]) => (
      <Route
        key={orig}
        path={orig}
        component={() => <Redirect to={dest} push={false} exact />}
      />
    ))}
    <Route path="/" component={HomepageRoute} exact />
    <Route path="/jp" component={JapanRoute} exact />
    <Route path="/fair" component={FairRoute} exact />
    <Route path="/plinko" component={PlinkoRoute} exact />
    <Route path="/snoops-hotbox" component={HotBoxRoute} exact />
    <Route path="/crash" component={CrashRoute} exact />
    <Route path="/roulette" component={RouletteNewRoute} exact />
    <Route path="/dice" component={DiceRoute} exact />
    <Route path="/mines" component={MinesRoute} exact />
    <Route path="/towers" component={TowersRoute} exact />
    <Route path="/coinflip" component={CoinflipRoute} exact />
    <Route path="/junglemines" component={JungleMinesRoute} exact />
    <Route
      path="/mission-uncrossable"
      component={MissionUncrossableRoute}
      exact
    />
    <Route path="/raffle/:slug" component={RaffleRoute} exact />
    <Route path="/vip" component={VIPRoute} exact />
    <Route path="/about-us" component={AboutUsRoute} exact />
    <Route path="/terms-and-conditions" component={SiteTermsRoute} exact />
    <Route
      path="/bonus-and-promotion-policy"
      component={PromotionTermsRoute}
      exact
    />
    <Route path="/privacy-policy" component={PrivacyRoute} exact />
    <Route path="/kyc-aml-policy" component={KYCAMLRoute} exact />
    <Route
      path="/responsible-gambling"
      component={ResponsibleGamblingRoute}
      exact
    />
    <Route path="/vip-benefits" component={VipBenefitsRoute} exact />
    <Route path="/sportsbook-policy" component={SportsbookPolicyRoute} exact />
    <Route path="/game-policy" component={GamePolicyRoute} exact />
    <Route path="/slots/:name" component={GameRoute} />
    <Route path="/game/:name" component={GameRoute} />
    <Route path="/sports" component={SportsbettingRoute} />

    <Route path={GAME_TAG_FAVORITES_LINK} component={GameFavoritesRoute} />
    <Route path="/tag/:path" component={GameTagRoute} />
    <Route path="/provider/:path" component={GameProviderRoute} />
    <Route path="/casino" component={CasinoPageRoute} />
    <Route path="/account-settings" component={AccountSettingsRoute} />

    {/* 404 Redirect */}
    <Route component={() => <Redirect to="/" push={false} exact />} />
  </LazySwitch>
)

export default Routes
