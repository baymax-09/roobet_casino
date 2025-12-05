import React from 'react'
import { Button, Paper, Select, Typography } from '@mui/material'

import { useAccessControl } from 'admin/hooks'
import { withRulesAccessController } from 'admin/components'
import { type KYCLevel } from 'common/types'

import { useStyles } from './KYCLevelBaseContainer.styles'

interface KYCLevelBaseContainerProps {
  title: string
  buttonText: string
  onClick: (kycLevel: KYCLevel) => void
  initialKycLevel?: KYCLevel
  kycLevelOptions: KYCLevel[]
  errorMessage?: string
}

const ButtonActions = withRulesAccessController(['kyc:update'], Button)
const UpdateSelectActions = withRulesAccessController(['kyc:update'], Select)

export const KYCLevelBaseContainer: React.FC<KYCLevelBaseContainerProps> = ({
  title,
  buttonText,
  onClick,
  initialKycLevel,
  kycLevelOptions,
  errorMessage,
}) => {
  const classes = useStyles()
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])

  const initialKYCLevel = initialKycLevel ?? 1

  const [kycLevel, setKYCLevel] = React.useState(initialKYCLevel)

  const handleButtonClick = () => {
    onClick(kycLevel)
    setKYCLevel(kycLevel)
  }

  React.useEffect(() => {
    setKYCLevel(initialKYCLevel)
  }, [initialKYCLevel, setKYCLevel])

  if (!hasKYCAccess) {
    return null
  }

  return (
    <Paper className={classes.root} elevation={2}>
      <div className={classes.resetKYCContainer}>
        <Typography variant="h6">{title}</Typography>
        <div className={classes.resetInputFields}>
          <UpdateSelectActions
            native
            type="number"
            name="kycLevel"
            value={kycLevel}
            onChange={event => {
              setKYCLevel(Number(event.target.value) as KYCLevel)
            }}
            label="KYC Level"
          >
            {kycLevelOptions.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </UpdateSelectActions>
        </div>
        <ButtonActions
          onClick={handleButtonClick}
          disableElevation
          color="primary"
          variant="contained"
        >
          {buttonText}
        </ButtonActions>
      </div>
      <Typography variant="body1" color="textPrimary">
        {errorMessage}
      </Typography>
    </Paper>
  )
}
