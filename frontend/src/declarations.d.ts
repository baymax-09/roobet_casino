import { type MetaMaskInpageProvider } from '@metamask/providers'
import {
  type Rooward,
  type Mode,
  type RoowardTimespan,
  type LevelProgress,
} from 'src/app/types'

import { type RootState } from 'app/reducers'

import { type useToasts } from './common/hooks/useToasts'

import type React from 'react'
import type _PaymentIQCashier from 'paymentiq-cashier-bootstrapper'

export {}

interface BTRenderedOptions {
  /* Unique name of theme provided by Betby. */
  themeName: string

  /* Frame language (default: en). The abbreviation is case-sensitive. */
  lang: string

  /* The parameter defines the gap between window top and opened betslip. */
  betSlipOffsetTop?: number

  /* The parameter defines the gap between window bottom and betslip. */
  betSlipOffsetBottom?: number

  /* The parameter defines the gap between window right side and betslip */
  betSlipOffsetRight?: number

  /* The parameter defines the index of betslip in relation to DOM elements used on
  Partners website. Value should be 100 or more. */
  betslipZIndex: number

  /* The parameter defines the page will be shown to the user after application is initialized. */
  url?: string

  /* The parameter defines the range between top of the window and sticky (fixed)
  elements in the application (sidebar etc.) */
  stickyTop?: number

  /* The parameter defines the scroll button position in the mobile website version. */
  scrollTopButtonPosition?: 'left' | 'right'

  /* The parameter defines the scroll button display in the mobile website version. */
  scrollToTopButtonVisible?: boolean

  /* The parameter defines the name of fonts are used on the Partners website. */
  fontFamilies?: string[]

  /* Betby internal identifier for Partner. */
  brand_id: string

  /* JWT token used to identify the player. */
  key: string | undefined

  /* Target element where game will be rendered. */
  target: HTMLElement

  /* Minium game frame height  */
  minFrameHeight: number

  /* Callback function provided by Partner that will be called when a player navigates across the frame */
  onRouteChange?: (...args: unknown) => void

  /* Callback function provided by Partner that will be called when a player logins with the frame. */
  onLogin: (...args: unknown) => void

  /* Callback function provided by Partner that will be called when a player registers with the frame. */
  onRegister: (...args: unknown) => void

  /* Callback function provided by Partner that is responsible for generating new JWT token and passing to the frame. */
  onSessionRefresh: (...args: unknown) => void

  /* Callback function provided by Partner that will be called when a player makes deposit with the frame. */
  onRecharge: (...args: unknown) => void
}

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    red: Palette['primary']
    green: Palette['primary']
    purple: Palette['primary']
    gray: Palette['primary']
    orange: Palette['primary']
    blue: Palette['primary']
  }
  interface PaletteOptions {
    red: PaletteOptions['primary']
    green: PaletteOptions['primary']
    purple: PaletteOptions['primary']
    gray: PaletteOptions['primary']
    orange: PaletteOptions['primary']
    blue: PaletteOptions['primary']
  }

  interface PaletteColor {
    darker?: string
    lighter?: string
  }
  interface SimplePaletteColorOptions {
    darker?: string
    lighter?: string
  }
}

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}

declare global {
  type AssetType = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'
  /**
   * Used to disambiguate strings from a string that is strictly a path. The only way for something to be an
   * RoobetAssetPath currently is to be imported from that file type. If we need to dynamically determine if
   * something is an RoobetAssetPath then you'll need to write a type guard.
   */
  type RoobetAssetPath<T extends AssetType> = string & {
    __brand: `AssetPath${T}`
  }

  declare module 'assets/icons/*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
    export default content
  }

  declare module 'assets/images/*.svg' {
    const path: RoobetAssetPath<'svg'>
    export default path
  }

  declare module 'assets/images/*.png' {
    const path: RoobetAssetPath<'png'>
    export default path
  }

  declare module 'assets/images/*.gif' {
    const path: RoobetAssetPath<'gif'>
    export default path
  }

  declare module 'assets/images/*.jpg' {
    const path: RoobetAssetPath<'jpg'>
    export default path
  }

  declare module '*.scss' {
    const content: Record<string, string>
    export default content
  }

  interface Document {
    mozCancelFullScreen?: () => Promise<void>
    msExitFullscreen?: () => Promise<void>
    webkitExitFullscreen?: () => Promise<void>
    mozFullScreenElement?: Element
    msFullscreenElement?: Element
    webkitFullscreenElement?: Element
  }

  interface HTMLElement {
    msRequestFullscreen?: () => Promise<void>
    mozRequestFullscreen?: () => Promise<void>
    webkitRequestFullscreen?: () => Promise<void>
  }

  interface Window {
    /** Softswiss */
    sg: {
      launch: (
        launch_options: any,
        onSuccess: () => void,
        onError: (error: unknown) => void,
      ) => void
    }

    /** Betby */
    BTRenderer: {
      new (): typeof window.BTRenderer
      initialize: (options: BTRenderedOptions) => void
      updateOptions: (options: Partial<BTRenderedOptions>) => void
      kill: () => void
    }

    /** Metamask */
    ethereum?: MetaMaskInpageProvider

    /* XCM */
    apg_2b4a9aa5_31c9_4186_a6c3_0f53d37328dd?: {
      init: () => void
    }
    xcm_b6fbd907_6224_495b_891d_cd23b3e29488?: {
      init: () => void
    }

    /** Our weird way of passing marketing/advertising data around */
    tracking: Partial<{
      ref: string
      transactionId: string
      transactionSource: string
      subId: string
      utm_source: string
      utm_medium: string
      utm_campaign: string
      // Cellxpert
      cxd: string
      cxAffId: string
    }>

    /** Google Tag Manager */
    dataLayer: Array<Record<string, any>>

    /** PaymentIQ */
    CashierInstance?: _PaymentIQCashier
    _PaymentIQCashierReset?: () => void

    /** Seon */
    seonSessionPayload: any
    seon: {
      config: any
      getBase64Session: any
    }

    /**
     * Fast Track CRM
     * sid - Authenticates a user to use features from Fast Track CRM, such as Rich Inbox and On-Site Messaging
     */
    sid: string
    fasttrackbrand: string
    fasttrackbrandId: number

    /** Env configuration */
    __env: Record<string, string> | undefined

    hacksaw: any

    /** Used for reconnecting to site on disconnected page */
    reloadOnConnect?: boolean
    hasAsked?: boolean

    socketio?: any
    toast?: ReturnType<typeof useToasts>['toast']
  }
}
declare module 'notistack' {
  interface VariantOverrides {
    // I know it is weird to define this here but the way notistack uses conditional types was not working when doing something like
    // roowardsToast: RoowardToastProps
    roowardsToast: {
      type: RoowardTimespan
      level: LevelProgress
      levelInfo: Rooward
      mode?: Mode
      claimedAmount?: number
    }
    dialogToastError: React.PropsWithChildren<Record<string, unknown>>
  }
}
