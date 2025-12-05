import React from 'react'
import { IconCategoryItem, theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { useHistory, useLocation } from 'react-router'

import { useTranslate } from 'app/hooks'

import { accountSettingsNavButtons } from './constants/accountSettingsNavButtons'

export const useAccountSettingsSideNavigationStyles = makeStyles(() =>
  createStyles({
    AccountSettingsSideNavigation: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '28%',
      maxWidth: '256px',
      backgroundColor: uiTheme.palette.neutral[700],
      gap: uiTheme.spacing(1.5),
      padding: uiTheme.spacing(2),
    },
  }),
)

export const AccountSettingsSideNavigation = () => {
  const classes = useAccountSettingsSideNavigationStyles()
  const location = useLocation()
  const translate = useTranslate()
  const history = useHistory()

  const currentLocation = React.useMemo(
    () => location.pathname + location.search,
    [location],
  )

  return (
    <div className={classes.AccountSettingsSideNavigation}>
      {accountSettingsNavButtons.map(({ text, activeLink, to, ...props }) => {
        const active = activeLink === currentLocation

        return (
          <IconCategoryItem
            sx={{
              height: '36px',
              borderBottom: `2px solid ${
                active ? uiTheme.palette.neutral[800] : 'transparent'
              }`,
              backgroundColor: uiTheme.palette.neutral[800],

              // Filling in checkmark in Verification icon
              ...(!active && {
                '& > div > .Ui-root > g > .Ui-clipPath': {
                  fill: uiTheme.palette.neutral[800],
                },
              }),
            }}
            initialIconColor={uiTheme.palette.neutral[400]}
            fullWidth
            typographyProps={{
              variant: 'body4',
              ...(!active && {
                fontWeight: uiTheme.typography.fontWeightMedium,
                color: uiTheme.palette.neutral[200],
              }),
            }}
            text={translate(text)}
            onClick={() => history.push(to)}
            active={active}
            {...props}
          />
        )
      })}
    </div>
  )
}
