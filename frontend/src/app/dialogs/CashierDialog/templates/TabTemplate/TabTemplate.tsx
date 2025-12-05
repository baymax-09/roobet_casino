import React, { type PropsWithChildren } from 'react'
import {
  Button,
  Explainer,
  type ButtonProps,
  type ExplainerProps,
} from '@project-atl/ui'

import { useTabTemplateStyles } from './TabTemplate.styles'

interface TabTemplateProps {
  buttonRef?: React.RefObject<any>
  buttonProps?: ButtonProps
  explainerProps?: ExplainerProps
  belowButtonComponent?: React.ReactNode
  aboveButtonComponent?: React.ReactNode
}

export const TabTemplate: React.FC<PropsWithChildren<TabTemplateProps>> = ({
  buttonRef,
  buttonProps,
  explainerProps,
  belowButtonComponent,
  aboveButtonComponent,
  children,
}) => {
  const classes = useTabTemplateStyles()

  return (
    <div className={classes.TabTemplate}>
      <div className={classes.ContentContainer}>{children}</div>
      {explainerProps?.message && <Explainer {...explainerProps} />}
      {buttonProps && (
        <div className={classes.ButtonContainer}>
          {aboveButtonComponent}
          {/* The ref prop passed to Button doesn't work as expected */}
          <div ref={buttonRef}>
            <Button
              size="extraLarge"
              variant="contained"
              color="primary"
              fullWidth
              {...buttonProps}
            />
          </div>
          {belowButtonComponent}
        </div>
      )}
    </div>
  )
}
