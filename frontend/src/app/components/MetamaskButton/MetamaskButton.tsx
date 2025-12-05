import React from 'react'
import { Button } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { api } from 'common/util'
import { env } from 'common/constants'
import { useToasts } from 'common/hooks'
import metamask from 'assets/images/icons/metamask.svg'

const getMessage = nonce =>
  `Signing one-time nonce ${nonce} for Roobet authentication.`

async function getAccounts({
  ethereum,
  setBusy,
  toast,
  signup,
  translate,
  setAccount,
  setSignature,
}) {
  if (!(ethereum && ethereum.isMetaMask)) {
    toast.error(translate('authDialog.missingMetamaskExtension'))
    setBusy(false)
    return
  }

  try {
    const requestedAccount = await ethereum.request({
      method: 'eth_requestAccounts',
    })
    if (requestedAccount?.length && typeof requestedAccount[0] === 'string') {
      const account = requestedAccount[0]
      const nonceUri = `/auth/oauth/metamask/nonce?address=${account}`
      try {
        const { nonce } = await api.get<null, { nonce: string }>(
          signup ? `${nonceUri}&signup=true` : nonceUri,
        )
        if (nonce) {
          const msg = `0x${Buffer.from(getMessage(nonce), 'utf8').toString(
            'hex',
          )}`
          // Then, attempt to authenticate to link the account
          const sign = await ethereum.request({
            method: 'personal_sign',
            params: [msg, account],
          })
          setAccount(account)
          setSignature(sign)
        }
      } catch (err: any) {
        toast.error(err.message)
        setBusy(false)
      }
    }
    setBusy(false)
  } catch (error) {
    console.error(error)
  }
}

interface MetamaskButtonProps {
  className: string
  disabled: boolean
  signup: boolean
  callback: (uri: string) => void
  onlyIcon?: boolean
}

const MetamaskButton: React.FC<MetamaskButtonProps> = (
  props: MetamaskButtonProps,
) => {
  const { ethereum } = window

  const { toast } = useToasts()
  const translate = useTranslate()

  const [account, setAccount] = React.useState<string | undefined>(undefined)
  const [signature, setSignature] = React.useState<string | undefined>(
    undefined,
  )
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    function linkAccount() {
      if (account && signature) {
        const authUri = `${env.API_URL}/auth/oauth/metamask?address=${account}&signature=${signature}`
        props.callback(authUri)
      }
    }
    linkAccount()
  }, [account, signature, props])

  return (
    <Button
      className={props.className}
      variant="contained"
      color="tertiary"
      aria-label="Metamask Login"
      disabled={busy || props.disabled}
      size="medium"
      onClick={() => {
        setBusy(true)
        getAccounts({
          ethereum,
          toast,
          signup: props.signup,
          setBusy,
          translate,
          setAccount,
          setSignature,
        })
      }}
      {...(!props.onlyIcon && {
        startIcon: <img alt="Metamask" src={metamask} />,
      })}
      label={
        props.onlyIcon ? <img alt="Metamask" src={metamask} /> : 'Metamask'
      }
    />
  )
}

export default MetamaskButton
