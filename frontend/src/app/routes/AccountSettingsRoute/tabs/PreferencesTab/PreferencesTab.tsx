import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Typography,
  Toggle,
  type ToggleProps,
  theme as uiTheme,
} from '@project-atl/ui'

import { changeUserSetting } from 'app/reducers/user'
import { changeSetting } from 'app/lib/user'
import { useTranslate } from 'app/hooks'

import { InfoBlock } from '../common'
import { MutedUsers } from './MutedUsers'

import { usePreferencesTabStyles } from './PreferencesTab.styles'

const PrivacyToggles = [
  'showProfileInfo',
  'maskSensitiveData',
  'incognito',
] as const
type PrivacyToggle = (typeof PrivacyToggles)[number]

interface ToggleContainerProps {
  title: string
  description: string
  toggleProps: Partial<ToggleProps>
}

const ToggleContainer: React.FC<ToggleContainerProps> = ({
  title,
  description,
  toggleProps,
}) => {
  const classes = usePreferencesTabStyles()

  return (
    <div className={classes.ToggleContainer}>
      <Toggle
        customTrackColor={uiTheme.palette.primary[300]}
        {...toggleProps}
      />
      <div className={classes.ToggleContainer__textContainer}>
        <Typography
          variant="body1"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {description}
        </Typography>
      </div>
    </div>
  )
}
export const PreferencesTab: React.FC = React.memo(() => {
  const classes = usePreferencesTabStyles()
  const translate = useTranslate()
  const dispatch = useDispatch()

  const [showProfileInfoBusy, setShowProfileInfoBusy] = React.useState(false)
  const [maskSensitiveDataBusy, setMaskSensitiveDataBusy] =
    React.useState(false)
  const [incognitoBusy, setIncognitoBusy] = React.useState(false)

  const incognito = useSelector(
    ({ user }) => user?.systemSettings.feed.incognito,
  )
  const profileSettings = useSelector(
    ({ user }) => user?.systemSettings.profile.editable,
  )

  const settingsBusyHandler = (field: PrivacyToggle, value: boolean) => {
    switch (field) {
      case 'showProfileInfo':
        setShowProfileInfoBusy(value)
        break
      case 'maskSensitiveData':
        setMaskSensitiveDataBusy(value)
        break
      case 'incognito':
        setIncognitoBusy(value)
        break
    }
  }

  const toggleIncognito = async event => {
    setIncognitoBusy(true)
    const newIncognito = event.target.checked

    try {
      await changeSetting('feed', 'incognito', newIncognito)

      dispatch(
        changeUserSetting({
          systemName: 'feed',
          settingName: 'incognito',
          value: newIncognito,
        }),
      )
    } catch (err) {}

    setIncognitoBusy(false)
  }

  const toggleProfileSetting = (field: PrivacyToggle) => async event => {
    const checked = event.target.checked
    settingsBusyHandler(field, true)

    const update = {
      ...profileSettings,
      [field]: checked,
    }

    try {
      await changeSetting('profile', 'editable', update)

      dispatch(
        changeUserSetting({
          systemName: 'profile',
          settingName: 'editable',
          value: update,
        }),
      )
    } catch (error) {}

    settingsBusyHandler(field, false)
  }

  const yourProfileToggles = React.useMemo(
    () => [
      {
        title: translate('preferencesTab.displayProfileInformation'),
        description: translate('preferencesTab.displayProfileInformationDesc'),
        toggleProps: {
          checked: profileSettings?.showProfileInfo,
          onChange: toggleProfileSetting('showProfileInfo'),
          disabled: showProfileInfoBusy,
        },
      },
      {
        title: translate('preferencesTab.maskSensitiveInfo'),
        description: translate('preferencesTab.maskSensitiveInfoDesc'),
        toggleProps: {
          checked: profileSettings?.maskSensitiveData || false,
          onChange: toggleProfileSetting('maskSensitiveData'),
          disabled: maskSensitiveDataBusy,
        },
      },
    ],
    [
      profileSettings?.showProfileInfo,
      profileSettings?.maskSensitiveData,
      maskSensitiveDataBusy,
      showProfileInfoBusy,
    ],
  )

  return (
    <>
      <InfoBlock title={translate('preferencesTab.yourProfile')}>
        <div className={classes.TogglesContainer}>
          {yourProfileToggles.map(props => (
            <ToggleContainer {...props} />
          ))}
        </div>
      </InfoBlock>
      <InfoBlock title={translate('preferencesTab.gameFeed')}>
        <div className={classes.TogglesContainer}>
          <ToggleContainer
            title={translate('preferencesTab.incognitoMode')}
            description={translate('preferencesTab.gameFeedDesc')}
            toggleProps={{
              checked: incognito,
              onChange: toggleIncognito,
              disabled: incognitoBusy,
            }}
          />
        </div>
      </InfoBlock>

      <InfoBlock title={translate('preferencesTab.mutedUsers')}>
        <MutedUsers />
      </InfoBlock>
    </>
  )
})
