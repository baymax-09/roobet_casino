import React from 'react'
import {
  Toggle,
  type ToggleProps,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { useSelector } from 'react-redux'

import { useTranslate } from 'app/hooks'
import { api } from 'common/util'
import { env } from 'common/constants'
import Google from 'assets/images/icons/Google.svg'
import Steam from 'assets/images/icons/Steam.svg'
import Metamask from 'assets/images/icons/metamask.svg'
import { useToasts } from 'common/hooks'
import { MetamaskSwitch } from 'app/components'

interface LinkedAccountProps {
  text: string
  icon: RoobetAssetPath<'svg'>
  toggleProps: Partial<ToggleProps>
  metamask?: boolean
}

export const useLinkedAccountsStyles = makeStyles(theme =>
  createStyles({
    LinkedAccounts: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      flexWrap: 'wrap',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 'initial',
      },
    },

    LinkedAccount: {
      display: 'flex',
      borderRadius: '12px',
      padding: `${uiTheme.spacing(1.5)} ${uiTheme.spacing(2)} ${uiTheme.spacing(
        1.5,
      )} ${uiTheme.spacing(1.5)}`,
      backgroundColor: uiTheme.palette.neutral[700],
      alignItems: 'center',

      [uiTheme.breakpoints.up('md')]: {
        width: 190,
      },
    },

    LinkedAccount__icon: {
      marginRight: uiTheme.spacing(1.5),
    },
  }),
)

const LinkedAccount: React.FC<LinkedAccountProps> = ({
  text,
  icon,
  toggleProps,
  metamask = false,
}) => {
  const classes = useLinkedAccountsStyles()

  return (
    <div className={classes.LinkedAccount}>
      <img
        alt={text}
        className={classes.LinkedAccount__icon}
        width="32px"
        height="32px"
        src={icon}
      />
      <Typography
        fontWeight={uiTheme.typography.fontWeightMedium}
        variant="body1"
        color={uiTheme.palette.neutral[400]}
        marginRight="auto"
      >
        {text}
      </Typography>
      {metamask ? (
        <MetamaskSwitch {...toggleProps} />
      ) : (
        <Toggle
          customTrackColor={uiTheme.palette.primary[300]}
          {...toggleProps}
        />
      )}
    </div>
  )
}

export const LinkedAccounts: React.FC = () => {
  const classes = useLinkedAccountsStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  const { ethereum } = window

  const googleConnected = useSelector(
    ({ user }) => user?.security?.hasGoogle || false,
  )
  // TODO: Uncomment when Facebook reviews our app
  // const facebookConnected = useSelector(
  //   ({ user }) => user?.security?.hasFacebook || false,
  // )
  const metamaskConnected = useSelector(
    ({ user }) => user?.security?.hasMetamask || false,
  )
  const steamConnected = useSelector(
    ({ user }) => user?.security?.hasSteam || false,
  )

  const [busy, setBusy] = React.useState(false)

  const handleOauthConnect = async (event, provider) => {
    const isLinking = event.target.checked
    if (isLinking) {
      const oauthUri = `${env.API_URL}/auth/oauth/${provider}/link`
      window.location.href = oauthUri
    } else {
      try {
        setBusy(true)
        await api.post<{ provider: string }, { success: boolean }>(
          '/auth/oauth/removeOauthProvider',
          { provider },
        )

        toast.success(translate('securityTab.disconnectedExternalAccount'))
      } catch (err) {
        // This makes me unconscionably sad
        const message =
          err instanceof Object &&
          'message' in err &&
          typeof err.message === 'string'
            ? err.message
            : translate('securityTab.errorDisconnecting')
        toast.error(message)
      } finally {
        setBusy(false)
      }
    }
  }

  const showMetamask = ethereum && ethereum.isMetaMask

  const oAuthProviders = [
    {
      text: translate('securityTab.google'),
      icon: Google,
      toggleProps: {
        checked: googleConnected,
        onChange: event => handleOauthConnect(event, 'google'),
        disabled: busy,
      },
    },
    // TODO: Uncomment when Facebook reviews our app
    // {
    //   text: 'securityTab.facebook',
    //   icon: Google,
    //   toggleProps: {
    //     checked: facebookConnected,
    //     onChange: (event) => handleOauthConnect(event, 'facebook'),
    //     disabled: busy,
    //   }
    // },
    {
      text: translate('securityTab.steam'),
      icon: Steam,
      toggleProps: {
        checked: steamConnected,
        onChange: event => handleOauthConnect(event, 'steam'),
        disabled: busy,
      },
    },
    ...(showMetamask
      ? [
          {
            text: translate('securityTab.metamask'),
            icon: Metamask,
            toggleProps: {
              checked: metamaskConnected,
              onChange: event => handleOauthConnect(event, 'metamask'),
              disabled: busy,
            },
            metamask: true,
          },
        ]
      : []),
  ]

  return (
    <div className={classes.LinkedAccounts}>
      {oAuthProviders.map(props => (
        <LinkedAccount {...props} />
      ))}
    </div>
  )
}
