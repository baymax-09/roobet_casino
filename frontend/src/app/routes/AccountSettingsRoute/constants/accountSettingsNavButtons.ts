import {
  AccountSettings,
  Preferences,
  Security,
  Verification,
} from '@project-atl/ui/assets'

import {
  ACCOUNT_SETTINGS_GENERAL_LINK,
  ACCOUNT_SETTINGS_PREFERENCES_LINK,
  ACCOUNT_SETTINGS_SECURITY_LINK,
  ACCOUNT_SETTINGS_VERIFICATION_LINK,
} from './accountSettingsLinks'

export const accountSettingsNavButtons = [
  {
    key: 'general',
    activeLink: ACCOUNT_SETTINGS_GENERAL_LINK,
    to: ACCOUNT_SETTINGS_GENERAL_LINK,
    icon: AccountSettings,
    // t('accountSettings.general')
    text: 'accountSettings.general',
  },
  {
    key: 'security',
    activeLink: ACCOUNT_SETTINGS_SECURITY_LINK,
    to: ACCOUNT_SETTINGS_SECURITY_LINK,
    icon: Security,
    // t('accountSettings.security')
    text: 'accountSettings.security',
  },
  {
    key: 'preferences',
    activeLink: ACCOUNT_SETTINGS_PREFERENCES_LINK,
    to: ACCOUNT_SETTINGS_PREFERENCES_LINK,
    icon: Preferences,
    // t('accountSettings.preferences')
    text: 'accountSettings.preferences',
  },
  {
    key: 'verification',
    activeLink: ACCOUNT_SETTINGS_VERIFICATION_LINK,
    to: ACCOUNT_SETTINGS_VERIFICATION_LINK,
    icon: Verification,
    // t('accountSettings.verification')
    text: 'accountSettings.verification',
  },
]
