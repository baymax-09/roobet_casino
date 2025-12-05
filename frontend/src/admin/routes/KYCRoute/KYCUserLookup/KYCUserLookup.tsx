import React from 'react'
import { Typography, TextField, Button } from '@mui/material'

import { withRulesAccessController } from 'admin/components'
import { useAxiosGet } from 'common/hooks'
import { type KYCGetForUserResponse } from 'admin/components/KYCOverview/types'
import { history } from 'admin/history'

import { useKYCUserLookupStyles } from './KYCUserLookup.styles'

export const KYCUserLookup: React.FC = () => {
  const classes = useKYCUserLookupStyles()
  const [lookupText, setLookupText] = React.useState<string>('')
  const [lookupError, setLookupError] = React.useState<boolean>(false)

  const [{ loading }, getKYCData] = useAxiosGet<
    KYCGetForUserResponse,
    { userId: string }
  >('/admin/kyc/getKYCForUserId', {
    lazy: true,
    onCompleted: data => {
      const username = data.user.nameLowercase
      history.push(
        `/users?userDropdown=kyc&index=nameLowercase&key=${username}`,
      )
    },
    onError: error => setLookupError(error),
  })

  const AccessUserLookupButton = withRulesAccessController(['kyc:read'], Button)

  const submitWithEnter = event => {
    if (event.KeyCode === 13 || event.code === 'Enter') {
      event.preventDefault()
      getKYCData({ userId: lookupText })
    }
  }

  const handleLookupTextChange = ({ target: { value } }) => {
    if (lookupError) {
      setLookupError(false)
    }
    setLookupText(value)
  }
  const handleUserLookup = () => {
    getKYCData({ userId: lookupText })
  }

  return (
    <div className={classes.KYCUserLookup}>
      <Typography variant="h3">User Lookup</Typography>
      <TextField
        variant="standard"
        name="lookupText"
        type="text"
        value={lookupText}
        error={lookupError}
        helperText={lookupError && 'Could not find user'}
        onChange={handleLookupTextChange}
        label="Lookup by Document Reference"
        className={classes.KYCUserLookup__lookupText}
        onKeyDown={submitWithEnter}
      />

      <AccessUserLookupButton
        disabled={loading}
        type="submit"
        color="primary"
        variant="contained"
        className={classes.KYCUserLookup__lookupButton}
        onClick={handleUserLookup}
      >
        Lookup
      </AccessUserLookupButton>
    </div>
  )
}
