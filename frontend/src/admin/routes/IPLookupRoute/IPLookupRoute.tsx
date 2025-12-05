import React from 'react'
import { Button, Typography, TextField } from '@mui/material'

import { useAccessControl } from 'admin/hooks'

import IPLookupView from './IPLookupView'

import { useIPLookupRouteStyles } from './IPLookupRoute.styles'

export const IPLookupRoute = () => {
  const classes = useIPLookupRouteStyles()
  const { hasAccess: hasIpLookupAccess } = useAccessControl(['iplookup:read'])

  const inputRef = React.useRef<HTMLInputElement>(null)
  const [ip, setIp] = React.useState('')

  const onSearch = () => {
    if (inputRef.current) {
      setIp(inputRef.current.value)
    }
  }

  const onKeyDownSubmit = ev => {
    if (ev === true || ev.key === 'Enter') {
      ev.preventDefault()
      onSearch()
    }
  }
  if (!hasIpLookupAccess) {
    return null
  }

  return (
    <div className={classes.root}>
      <div className={classes.form}>
        <Typography variant="h5" paragraph>
          IP Lookup
        </Typography>
        <TextField
          variant="standard"
          inputRef={inputRef}
          label="IP Address"
          name="ip"
          onKeyDown={onKeyDownSubmit}
        />
        <Button
          className={classes.button}
          type="submit"
          color="primary"
          variant="contained"
          onKeyDown={onKeyDownSubmit}
          onClick={onSearch}
        >
          Lookup
        </Button>
      </div>
      {ip?.length > 0 && <IPLookupView ip={ip} />}
    </div>
  )
}
