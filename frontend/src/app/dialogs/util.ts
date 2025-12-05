import { type DeepRequired } from 'ts-essentials'

import { AffiliateDialog } from './AffiliateDialog'
import { CashierDialog } from './CashierDialog'
import { AuthDialog } from './AuthDialog'
import { RegionRestrictedDialog } from './RegionRestrictedDialog'
import { SetUsernameDialog } from './SetUsernameDialog'
import { KOTHLeaderboardDialog } from './KOTHLeaderboardDialog'
import { RoowardsDialog } from './RoowardsDialog'
import { HistoryDialog, HistoryDetailsDialog } from './HistoryDialog'
import { FreePlayDialog } from './FreePlayDialog'
import { LocaleDialog } from './LocaleDialog'
import { ProfileDialog } from './ProfileDialog'
import { FairnessDialog } from './FairnessDialog'
import { GameDialog } from './GameDialog'
import { ConfirmAccountLinkDialog } from './ConfirmAccountLinkDialog'
import { ConfirmSignupDialog } from './ConfirmSignupDialog'
import { WalletSettingsDialog } from './WalletSettingsDialog'
import { RedeemDialog } from './RedeemDialog'
import { NotificationsDialog } from './NotificationsDialog'
import { KOTHDialog } from './KOTHDialog'
import { TwoFactorCodeDialog } from './TwoFactorCodeDialog'
import { AccountCloseDialog } from './AccountCloseDialog'
import { TwoFactorConfirmDialog } from './TwoFactorConfirmDialog'

const DIALOGS = {
  affiliate: {
    component: AffiliateDialog,
    options: {
      requiresAuth: true,
      params: ['days'],
    },
  },

  accountClose: {
    component: AccountCloseDialog,
  },

  cashier: {
    component: CashierDialog,
    options: {
      params: ['tab', 'expanded'],
      requiresAuth: true,
    },
  },

  freePlay: {
    component: FreePlayDialog,
    options: {
      params: ['expanded'],
    },
  },

  redeem: {
    component: RedeemDialog,
    options: {
      params: ['expanded'],
    },
  },

  history: {
    component: HistoryDialog,
    options: {
      params: ['tab', 'expanded'],
    },
  },

  historyDetails: {
    component: HistoryDetailsDialog,
    options: {
      params: ['tabKey', 'row'],
    },
  },

  auth: {
    component: AuthDialog,
    options: {
      params: ['tab'],
    },
  },

  setUsername: {
    component: SetUsernameDialog,
    options: {
      requiresAuth: true,
    },
  },
  roowards: {
    component: RoowardsDialog,
    options: {
      requiresAuth: true,
    },
  },

  regionRestricted: {
    component: RegionRestrictedDialog,
  },

  kothLeaderboard: {
    component: KOTHLeaderboardDialog,
  },

  koth: {
    component: KOTHDialog,
  },

  locale: {
    component: LocaleDialog,
  },

  fairness: {
    component: FairnessDialog,
    options: {
      params: ['gameName'],
    },
  },

  game: {
    component: GameDialog,
    options: {
      params: ['id', 'gameName'],
    },
  },

  profile: {
    component: ProfileDialog,
    options: {
      params: ['user'],
    },
  },

  confirmAccountLink: {
    component: ConfirmAccountLinkDialog,
    options: {
      params: ['provider', 'userId', 'uniqueId', 'accessToken', 'name'],
    },
  },

  confirmSignup: {
    component: ConfirmSignupDialog,
    options: {
      params: ['query'],
    },
  },

  walletSettings: {
    component: WalletSettingsDialog,
    options: {
      params: ['userId'],
    },
  },

  notifications: {
    component: NotificationsDialog,
    options: {
      params: ['tab'],
    },
  },

  twoFactorCode: {
    component: TwoFactorCodeDialog,
  },

  twoFactorConfirm: {
    component: TwoFactorConfirmDialog,
    options: {
      params: ['isEmail'],
    },
  },
} as const

type Dialogs = typeof DIALOGS
export type DialogKey = keyof Dialogs

interface DialogSettings {
  component: any
  options?: {
    requiresAuth?: boolean
    params?: readonly string[]
  }
}

export interface DialogConfig extends DeepRequired<DialogSettings> {
  key: DialogKey
}

/**
 * Instead of dealing with optionality, reify the dialog settings when fetched.
 */
const normalizeDialog = <T extends DialogSettings>(
  obj: T,
  key: DialogKey,
): DialogConfig => ({
  ...obj,
  key,
  options: {
    params: [],
    requiresAuth: false,
    ...(obj.options ?? {}),
  },
})

export const getDialog = (key: DialogKey) => {
  return normalizeDialog(DIALOGS[key], key)
}

const isDialogKey = (key: string | null): key is DialogKey => {
  return !!key && Object.keys(DIALOGS).includes(key)
}

/**
 * Used when rendering dialog based on querystring
 */
export const possiblyGetDialog = (key: string | null): DialogConfig | null => {
  if (isDialogKey(key)) {
    return getDialog(key)
  }
  return null
}

type DialogOptions<K extends DialogKey> = Dialogs[K] extends { options: object }
  ? Dialogs[K]['options']
  : undefined
type DialogParamNames<K extends DialogKey> = DialogOptions<K> extends {
  params: Readonly<string[]>
}
  ? DialogOptions<K>['params']
  : undefined
export type DialogParams<K extends DialogKey> =
  DialogParamNames<K> extends Readonly<string[]>
    ? Partial<Record<DialogParamNames<K>[number], string>>
    : undefined
