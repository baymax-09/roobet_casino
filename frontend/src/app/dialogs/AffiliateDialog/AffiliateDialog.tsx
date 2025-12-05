import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { type DialogProps } from 'app/types'

import AffiliateLink from './AffiliateLink'
import { DialogWithTabs } from '../DialogWithTabs'
import { AffiliateMyEarnings } from './AffiliateMyEarnings'

interface AffiliateDialogViewProps {
  DialogProps: DialogProps
  params: {
    days: string
    tab: string
  }
}

export const useAffiliateDialogStyles = makeStyles(theme =>
  createStyles({
    AffiliateDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '802px',
        },
      },
    },
  }),
)

const AffiliateDialogView: React.FC<AffiliateDialogViewProps> = ({
  DialogProps,
  params,
}) => {
  const classes = useAffiliateDialogStyles()
  const translate = useTranslate()
  const [showTabs, setShowTabs] = React.useState(true)
  const [showReferralHistory, setShowReferralHistory] = React.useState(false)
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const handleReferralHistoryClick = React.useCallback((showTabs: boolean) => {
    setShowReferralHistory(!showTabs)
    setShowTabs(showTabs)
  }, [])

  const _tabs = React.useMemo(
    () => [
      {
        key: 'referFriends',
        // t('affiliateDialog.referFriends')
        label: 'affiliateDialog.referFriends',
        component: <AffiliateLink />,
      },
      {
        key: 'myEarnings',
        // t('affiliateDialog.myEarnings')
        label: 'affiliateDialog.myEarnings',
        component: (
          <AffiliateMyEarnings
            params={params}
            showReferralHistory={showReferralHistory}
            handleReferralHistoryClick={handleReferralHistoryClick}
          />
        ),
      },
    ],
    [params, showReferralHistory, handleReferralHistoryClick],
  )

  const [tab, setTab] = React.useState(() => {
    const defaultTab = _tabs.some(tab => tab.key === params.tab)
      ? params.tab
      : _tabs[0].key
    return _tabs.findIndex(tab => tab.key === defaultTab) || 0
  })

  const activeTab = _tabs[tab]

  return (
    <DialogWithTabs
      className={classes.AffiliateDialog}
      helmetTitle={`${translate('navMenu.history')} - ${translate(
        activeTab.label,
      )}`}
      tabs={showReferralHistory ? [] : _tabs}
      currentTab={tab}
      setCurrentTab={setTab}
      title={translate('affiliateDialog.referAndEarn')}
      maxWidth="md"
      {...DialogProps}
      onClose={DialogProps.onClose}
      showBackInTitle={!showTabs && !isTabletOrDesktop} // Showing only in Referral History mobile view
      showCloseInTitle={showTabs || (!showTabs && isTabletOrDesktop)}
      handleBackButtonClick={() => handleReferralHistoryClick(true)}
    >
      {activeTab.component}
    </DialogWithTabs>
  )
}

export const AffiliateDialog = React.memo(AffiliateDialogView)
