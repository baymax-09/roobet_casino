import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { LoginOverlay } from 'mrooi'
import { useIsLoggedIn, useTranslate } from 'app/hooks'

import HistoryTable from './HistoryTable'
import { DialogWithTabs } from '../DialogWithTabs'

export const useHistoryDialogStyles = makeStyles(theme =>
  createStyles({
    HistoryDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '696px',
        },
      },
    },
  }),
)

const _tabs = [
  {
    key: 'deposits',
    // t('historyDialog.deposits')
    label: 'historyDialog.deposits',
    fetchUrl: '/history/deposits',
  },
  {
    key: 'withdrawals',
    // t('historyDialog.withdrawals')
    label: 'historyDialog.withdrawals',
    fetchUrl: '/history/withdrawals',
  },
  {
    key: 'bets',
    // t('historyDialog.bets')
    label: 'historyDialog.bets',
    fetchUrl: '/history/bets',
  },
  {
    key: 'all',
    // t('historyDialog.all')
    label: 'historyDialog.all',
    fetchUrl: '/history',
  },
]

const isValidTab = (key: string) => _tabs.some(tab => tab.key === key)

const HistoryDialog = ({ DialogProps, params }) => {
  const classes = useHistoryDialogStyles()
  const translate = useTranslate()
  const isLoggedIn = useIsLoggedIn()

  const [tab, setTab] = React.useState(() => {
    const defaultTab = isValidTab(params.tab) ? params.tab : 'deposits'
    return _tabs.findIndex(tab => tab.key === defaultTab) || 0
  })

  const activeTab = _tabs[tab]

  const [selectedFilterOption, setSelectedFilterOption] =
    React.useState<string>('all')

  return (
    <DialogWithTabs
      className={classes.HistoryDialog}
      helmetTitle={`${translate('navMenu.history')} - ${translate(
        activeTab.label,
      )}`}
      tabs={_tabs}
      currentTab={tab}
      setCurrentTab={setTab}
      title={translate('navMenu.history')}
      onClose={DialogProps.onClose}
      maxWidth="md"
      {...DialogProps}
    >
      {!isLoggedIn && <LoginOverlay dialog="history" {...params} />}
      <HistoryTable
        tab={tab}
        tabKey={activeTab.key}
        fetchUrl={activeTab.fetchUrl}
        selectedFilterOption={selectedFilterOption}
        setSelectedFilterOption={setSelectedFilterOption}
      />
    </DialogWithTabs>
  )
}

export default React.memo(HistoryDialog)
