import React from 'react'
import { Toggle, type ToggleProps, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { api } from 'common/util'
import { useToasts } from 'common/hooks'
import { env } from 'common/constants'

async function getAccounts({
  ethereum,
  setBusy,
  setAccount,
  toast,
  translate,
}) {
  if (!(ethereum && ethereum.isMetaMask)) {
    toast.error(translate('authDialog.missingMetamaskExtension'))
    setBusy(false)
    return
  }

  try {
    const account = await ethereum.request({ method: 'eth_requestAccounts' })
    if (account?.length && typeof account[0] === 'string') {
      setAccount(account[0])
    }
    setBusy(false)
  } catch (error) {
    console.error(error)
  }
}

interface MetamaskSwitchProps extends Omit<ToggleProps, 'customTrackColor'> {}

const MetamaskSwitch: React.FC<MetamaskSwitchProps> = (
  props: MetamaskSwitchProps,
) => {
  const translate = useTranslate()
  const { ethereum } = window

  const { toast } = useToasts()

  const [account, setAccount] = React.useState<string | undefined>(undefined)
  const [signature, setSignature] = React.useState<string | undefined>(
    undefined,
  )
  const [busy, setBusy] = React.useState(false)

  const getMessage = nonce =>
    `Signing one-time nonce ${nonce} for Roobet authentication.`

  React.useEffect(() => {
    async function getMetamaskSignature() {
      if (account) {
        const nonceUri = `/auth/oauth/metamask/link/nonce?address=${account}`
        try {
          const { nonce } = await api.get<null, { nonce: string }>(nonceUri)
          if (nonce) {
            const msg = `0x${Buffer.from(getMessage(nonce), 'utf8').toString(
              'hex',
            )}`
            // Then, attempt to authenticate to link the account
            const sign = await ethereum.request({
              method: 'personal_sign',
              params: [msg, account],
            })
            setSignature(sign)
          }
        } catch (err: any) {
          toast.error(err.message)
          setBusy(false)
        }
      }
    }
    getMetamaskSignature()
  }, [ethereum, account, toast])

  React.useEffect(() => {
    function linkAccount() {
      if (account && signature) {
        window.location.href = `${env.API_URL}/auth/oauth/metamask/link?address=${account}&signature=${signature}`
      }
    }
    linkAccount()
  }, [account, signature])

  return (
    <Toggle
      customTrackColor={uiTheme.palette.primary[300]}
      disabled={busy}
      onChange={async event => {
        const isLinking = event.target.checked
        if (isLinking) {
          setBusy(true)
          getAccounts({ ethereum, setBusy, setAccount, toast, translate })
        } else {
          try {
            const response = await api.post<
              { provider: string },
              { success: boolean }
            >('/auth/oauth/removeOauthProvider', { provider: 'metamask' })

            if (!response.success) {
              throw new Error(translate('securityTab.errorDisconnecting'))
            }

            // Just refresh the page
            window.location.reload()
          } catch (err: any) {
            toast.error(err.message)
            return Promise.reject(err)
          } finally {
            setBusy(false)
          }
        }
      }}
      {...props}
    />
  )
}

export default React.memo(MetamaskSwitch)
