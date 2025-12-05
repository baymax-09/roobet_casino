// TODO stop generating system names inline
import React, { useState } from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  FormLabel,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { useToggle } from 'react-use'

import { api } from 'common/util'
import { useAxiosGet, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { helperTextErrorHelper } from 'admin/util/form'

import { useSettingsRouteStyles } from './SettingsRoute.styles'

interface SiteSettings {
  banner?: string
  bannerLink?: string
  bannerLinkTitle?: string
}

const switchLabels = [
  'Bitcoin Withdraw',
  'Ethereum Withdraw',
  'Litecoin Withdraw',
  'Precredit',
  'Surveys',
  'Bets',
  'App',
  'Chat',
  'Tip',
  'RoobetLive',
] as const

const SwitchWithLabel = props => {
  const classes = useSettingsRouteStyles()
  const { label, ...rest } = props

  return (
    <div className={classes.switchContainer}>
      <FormLabel>{label}</FormLabel>

      <Switch color="primary" {...rest} />
    </div>
  )
}

const AccessBannerUpdateButton = withRulesAccessController(
  ['banner:update'],
  Button,
)
const AccessBannerUpdateFormik = withRulesAccessController(
  ['banner:update'],
  Formik,
)
const AccessRefreshUpdateButton = withRulesAccessController(
  ['refresh:update'],
  Button,
)

export const SettingsRoute: React.FC = () => {
  const classes = useSettingsRouteStyles()
  const { toast } = useToasts()

  const [updatesLoading, setLoading] = useState(false)
  const [settings, setSettings] = React.useState<SiteSettings | null>(null)
  const [toggleLink, setToggleLink] = useToggle(false)
  const { hasAccess: hasRefreshAccess } = useAccessControl(['refresh:update'])
  const { hasAccess: hasTogglesAccess } = useAccessControl(['toggles:update'])

  const [{ loading: getSettingsLoading }] = useAxiosGet<SiteSettings>(
    'admin/getHiddenSettings',
    {
      onCompleted: data => {
        setSettings(data)
        if (data.bannerLink) {
          setToggleLink(true)
        }
      },
      onError: error => {
        toast.error(error.response.data)
      },
    },
  )

  const updateBanner = (values, { setErrors }) => {
    setLoading(true)
    api
      .post('/admin/settings/updateBanner', {
        banner: values.banner,
        bannerLink: toggleLink ? values.bannerLink : '',
        bannerLinkTitle: toggleLink ? values.bannerLinkTitle : '',
      })
      .then(() => {
        toast.success('Updated banner')
      })
      .catch(error => {
        toast.error(error.response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const toggleSetting = (systemName, enabled) => {
    setLoading(true)
    api
      .post('/admin/changeSystemEnabled', {
        systemName: systemName.toLowerCase(), // system endpoints accept the modern system name
        enabled,
      })
      .then(() => {
        toast.success('Changed Setting')
        setSettings({ ...settings, [`disabled${systemName}`]: !enabled })
      })
      .catch(error => {
        toast.error(error.response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const forceRefresh = () => {
    setLoading(true)

    api
      .get('/admin/forceRefresh')
      .catch(error => {
        toast.error(error.response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const askRefresh = () => {
    setLoading(true)

    api
      .get('/admin/refreshRequired')
      .then(() => {
        toast.success('Asked for Refresh')
      })
      .catch(error => {
        toast.error(error.response.data)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const loading = updatesLoading || getSettingsLoading

  return (
    <div className={classes.root}>
      {settings && (
        <>
          <div className={classes.section}>
            <AccessBannerUpdateFormik
              initialValues={{
                banner: settings.banner,
                bannerLink: settings.bannerLink,
                bannerLinkTitle: settings.bannerLinkTitle,
              }}
              onSubmit={updateBanner}
              enableReinitialize
            >
              {({ values, errors, handleChange }) => (
                <div>
                  <Typography variant="h5" paragraph>
                    Update Banner
                  </Typography>
                  <Form>
                    <TextField
                      variant="standard"
                      name="banner"
                      type="text"
                      value={values.banner}
                      error={!!errors.banner}
                      helperText={helperTextErrorHelper(errors.banner)}
                      onChange={handleChange}
                      label="Banner"
                      className={classes.bannerInput}
                    />

                    <AccessBannerUpdateButton
                      disabled={loading}
                      type="submit"
                      color="primary"
                      variant="contained"
                      className={classes.submitButton}
                    >
                      Update Banner
                    </AccessBannerUpdateButton>

                    <FormControlLabel
                      control={
                        <Switch
                          color="secondary"
                          checked={toggleLink}
                          onChange={setToggleLink}
                        />
                      }
                      label="Add Link"
                      className={classes.linkToggle}
                    />
                    {toggleLink ? (
                      <div className={classes.addLink}>
                        <TextField
                          variant="standard"
                          name="bannerLink"
                          type="text"
                          value={values.bannerLink}
                          error={!!errors.bannerLink}
                          helperText={helperTextErrorHelper(errors.bannerLink)}
                          onChange={handleChange}
                          label="Banner Link URL"
                          className={classes.bannerInput}
                        />

                        <TextField
                          variant="standard"
                          name="bannerLinkTitle"
                          type="text"
                          value={values.bannerLinkTitle}
                          error={!!errors.bannerLinkTitle}
                          helperText={helperTextErrorHelper(
                            errors.bannerLinkTitle,
                          )}
                          onChange={handleChange}
                          label="Banner Link Title"
                          className={classes.bannerInput}
                        />
                      </div>
                    ) : null}
                  </Form>
                </div>
              )}
            </AccessBannerUpdateFormik>
          </div>
          {hasRefreshAccess && (
            <div className={classes.section}>
              <Typography variant="h5" paragraph>
                Actions
              </Typography>

              <div className={classes.horizontalFlex}>
                <AccessRefreshUpdateButton
                  color="primary"
                  variant="contained"
                  className={classes.actionButton}
                  onClick={forceRefresh}
                >
                  Force Refresh
                </AccessRefreshUpdateButton>

                <AccessRefreshUpdateButton
                  color="primary"
                  variant="contained"
                  className={classes.actionButton}
                  onClick={askRefresh}
                >
                  Ask Refresh
                </AccessRefreshUpdateButton>
              </div>
            </div>
          )}
          {hasTogglesAccess && (
            <div className={classes.section}>
              <Typography variant="h5" paragraph>
                Toggles
              </Typography>

              <div className={classes.toggleContainer}>
                {switchLabels.map((label, index) => {
                  const legacySystemName = label.replace(/\s/g, '')

                  return (
                    <SwitchWithLabel
                      key={label}
                      label={label}
                      color="primary"
                      checked={!settings['disabled' + legacySystemName]}
                      onChange={() => {
                        toggleSetting(
                          legacySystemName,
                          settings['disabled' + legacySystemName],
                        )
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
