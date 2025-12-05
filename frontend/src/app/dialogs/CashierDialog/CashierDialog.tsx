import React from 'react'
import { useSelector } from 'react-redux'
import { type DeepReadonly } from 'ts-essentials'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { LoginOverlay } from 'mrooi'
import { useIsLoggedIn, useTranslate } from 'app/hooks'
import { type DialogProps } from 'app/types'

import {
  DepositTab,
  BuyCryptoTab,
  WithdrawTab,
  TipTab,
  KYCRequired,
} from './tabs'
import { DialogWithTabs } from '../DialogWithTabs'

interface CashierDialogTabConfig {
  key: 'deposit' | 'buy-crypto' | 'withdraw' | 'tip'
  label: string
  Component: React.FC<{ params: Record<string, string> }>
  /** Include if you want to gate tab behind KYC */
  requireKYC?: {
    continueText: string
    promptText: string
  }
}

export const useCashierDialogStyles = makeStyles(theme =>
  createStyles({
    CashierDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '512px',
        },
      },
    },
  }),
)

const CashierTabs: DeepReadonly<CashierDialogTabConfig[]> = [
  {
    key: 'deposit',
    // t('cashier.deposit')
    label: 'cashier.deposit',
    Component: DepositTab,
    requireKYC: {
      // t('depositTab.kycContinue')
      continueText: 'depositTab.kycContinue',
      // t('depositTab.confirmIdentityText')
      promptText: 'depositTab.confirmIdentityText',
    },
  },
  {
    key: 'buy-crypto',
    // t('buyCryptoTab.buyCrypto')
    label: 'buyCryptoTab.buyCrypto',
    Component: BuyCryptoTab,
    requireKYC: {
      // t('depositTab.kycContinue')
      continueText: 'depositTab.kycContinue',
      // t('depositTab.confirmIdentityText')
      promptText: 'depositTab.confirmIdentityText',
    },
  },
  {
    key: 'withdraw',
    // t('cashier.withdraw')
    label: 'cashier.withdraw',
    Component: WithdrawTab,
    requireKYC: {
      // t('withdrawTab.kycContinue')
      continueText: 'withdrawTab.kycContinue',
      // t('withdrawTab.confirmIdentityText')
      promptText: 'withdrawTab.confirmIdentityText',
    },
  },
  {
    key: 'tip',
    // t('cashier.tip')
    label: 'cashier.tip',
    Component: TipTab,
  },
]

const isValidTab = (key: any): key is CashierDialogTabConfig['key'] =>
  CashierTabs.some(tab => tab.key === key)

interface CashierDialogProps {
  DialogProps: DialogProps
  params: Record<string, string>
}

export const CashierDialog: React.FC<CashierDialogProps> = ({
  DialogProps,
  params,
}) => {
  const classes = useCashierDialogStyles()
  const translate = useTranslate()

  const isLoggedIn = useIsLoggedIn()
  const kycLevel = useSelector(({ user }) => user?.kycLevel)

  const [tab, setTab] = React.useState(() => {
    const paramsTab = params.tab
    const defaultTab = isValidTab(paramsTab) ? paramsTab : 'deposit'
    return CashierTabs.findIndex(tab => tab.key === defaultTab) || 0
  })

  const activeTab = CashierTabs[tab]

  const { requireKYC } = activeTab

  // TODO: Remove this after we've moved off MUI v4 entirely.
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <DialogWithTabs
      className={classes.CashierDialog}
      helmetTitle={`${translate('cashierDialog.cashier')} - ${translate(
        activeTab.label,
      )}`}
      title={translate('cashierDialog.cashier')}
      tabs={CashierTabs}
      currentTab={tab}
      setCurrentTab={setTab}
      maxWidth="md"
      {...DialogProps}
    >
      {/* @ts-expect-error we need to fix how LoginOverlay accepts params */}
      {!isLoggedIn && <LoginOverlay dialog="cashier" {...params} />}

      {!!requireKYC && !kycLevel ? (
        <KYCRequired
          continueText={requireKYC.continueText}
          promptText={requireKYC.promptText}
        />
      ) : (
        <activeTab.Component params={params} />
      )}
    </DialogWithTabs>
  )
}
