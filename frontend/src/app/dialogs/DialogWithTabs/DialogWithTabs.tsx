import React, { type PropsWithChildren } from 'react'
import {
  Tab,
  Tabs,
  MobileCurvedStroke,
  type DialogProps,
  theme as uiTheme,
} from '@project-atl/ui'
import { Helmet } from 'react-helmet'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import { type DeepReadonly } from 'ts-essentials'

import { useTranslate, useDialogsLinkUpdate } from 'app/hooks'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useDialogWithTabsStyles } from './DialogWithTabs.styles'

interface TabType extends Record<string, any> {
  key: string
  label: string
}

interface DialogWithTabsProps extends DialogProps {
  tabs: DeepReadonly<TabType[]>
  currentTab: number
  setCurrentTab: React.Dispatch<React.SetStateAction<number>>
  onClose: () => void
  helmetTitle?: string
}

export const DialogWithTabs: React.FC<
  PropsWithChildren<DialogWithTabsProps>
> = ({
  tabs,
  currentTab,
  setCurrentTab,
  children,
  onClose,
  helmetTitle,
  ...DialogProps
}) => {
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const classes = useDialogWithTabsStyles()
  const translate = useTranslate()

  const activeTab = tabs[currentTab]

  useDialogsLinkUpdate(
    React.useCallback(
      link => {
        if (activeTab) {
          link.tab = activeTab.key
        }
      },
      [activeTab],
    ),
  )

  return (
    <DialogWithBottomNavigation
      maxWidth="md"
      showCloseInTitle={true}
      handleClose={onClose}
      closeOnBackdropClick={true}
      dialogContentProps={{ className: classes.DialogWithTabs__content }}
      {...DialogProps}
      showMobileCurvedBorder={false}
    >
      <Helmet title={helmetTitle ?? DialogProps.title} />
      {tabs.length > 0 && (
        <Tabs
          className={classes.DialogWithTabs__tabs}
          variant="fullWidth"
          indicatorColor="primary"
          value={currentTab}
          onChange={(_, newTab) => setCurrentTab(newTab)}
        >
          {tabs.map(tab => (
            <Tab
              key={tab.key}
              className={classes.DialogWithTabs__tab}
              label={translate(tab.label)}
              mobile={!isTabletOrDesktop}
            />
          ))}
        </Tabs>
      )}
      {/** Show top curved stroke below the tabs on mobile viewports */}
      {!isTabletOrDesktop && (
        <MobileCurvedStroke
          curvedBorderProps={{
            style: {
              display: 'flex',
              inset: 0,
              position: 'absolute',
              top:
                tabs.length > 0 ? '86px' : uiTheme.shape.toolbarHeight.mobile,
            },
          }}
        />
      )}
      <div
        className={clsx(classes.DialogWithTabs__wrapper, {
          [classes.DialogWithTabs__wrapper_mobile]: !isTabletOrDesktop,
        })}
      >
        {children}
      </div>
    </DialogWithBottomNavigation>
  )
}
