import React from 'react'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

import { ChatDrawer } from './ChatDrawer'

import { useRulesDrawerStyles } from './RulesDrawer.styles'

interface RulesDrawerProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const renderRule = (text: string) => {
  return (
    <Typography variant="body4" color={uiTheme.palette.neutral[200]}>
      {text}
    </Typography>
  )
}

export const RulesDrawer: React.FC<RulesDrawerProps> = ({ open, setOpen }) => {
  const classes = useRulesDrawerStyles()
  const translate = useTranslate()

  return (
    <ChatDrawer
      title={translate('chatRules.title')}
      setOpen={setOpen}
      open={open}
    >
      <div className={classes.RulesDrawer}>
        <ul className={classes.RulesDrawer__rulesContainer}>
          <li className={classes.RulesDrawer__rule}>
            {renderRule(translate('chatRules.spamming'))}
          </li>
          <li className={classes.RulesDrawer__rule}>
            {renderRule(translate('chatRules.begging'))}
          </li>
          <li className={classes.RulesDrawer__rule}>
            {renderRule(translate('chatRules.advertising'))}
          </li>
          <li className={classes.RulesDrawer__rule}>
            {renderRule(translate('chatRules.harrassment'))}
          </li>
          <li className={classes.RulesDrawer__rule}>
            {renderRule(translate('chatRules.slandering'))}
          </li>
        </ul>
      </div>

      <div className={classes.RulesDrawer__buttonContainer}>
        <Button
          label={translate('chatRules.confirm')}
          variant="contained"
          color="primary"
          size="extraLarge"
          fullWidth
          onClick={() => setOpen(false)}
        />
      </div>
    </ChatDrawer>
  )
}
