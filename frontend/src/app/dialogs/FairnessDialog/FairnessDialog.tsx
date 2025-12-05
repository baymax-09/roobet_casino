import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

import { DialogTitle, Dialog } from 'mrooi'
import { getStorageItem, setStorageItem } from 'app/util'
import { useTranslate, useDialogsLinkUpdate } from 'app/hooks'
import { useAxiosGet, useAxiosPost, useToasts } from 'common/hooks'

import { useCommonDialogStyles } from '../Dialog.styles'

import { useFairnessDialogStyles } from './FairnessDialog.styles'

const _makeId = length => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  setStorageItem('clientSeed', result)
  return result
}

export const FairnessDialogView = ({ params: data, DialogProps }) => {
  const classes = useFairnessDialogStyles()
  const commonDialogClasses = useCommonDialogStyles({})
  const translate = useTranslate()
  const { toast } = useToasts()

  const [state, setState] = React.useState({
    clientSeed: getStorageItem('clientSeed') || _makeId(25),
  })
  const { clientSeed } = state
  const { gameName } = data

  const updateLink = React.useCallback(
    link => {
      if (gameName) {
        link.gameName = gameName
      }
    },
    [gameName],
  )
  useDialogsLinkUpdate(updateLink)

  const [{ data: fairData, loading: getLoading }, refetchSeed] = useAxiosGet<
    { round: { currentRound?: { hash: string; nonce: number } } },
    { clientSeed: string }
  >(`/game/${gameName}/currentRoundHash`, {
    params: {
      clientSeed,
    },
    skip: !gameName,
  })

  const serverSeedHashText = !fairData?.round?.currentRound
    ? translate('fairnessModal.playOneGameText')
    : fairData.round.currentRound.hash
  const nonceText = !fairData?.round?.currentRound
    ? translate('fairnessModal.playOneGameText')
    : fairData.round.currentRound.nonce

  const [_refreshServerSeed, { loading: postLoading }] = useAxiosPost(
    `/game/${gameName}/endRound`,
    {
      onCompleted: () => {
        refetchSeed({ clientSeed })
        toast.success('Reset server seed!')
      },
      onError: () => {
        toast.error(translate('fairnessModal.pleaseWaitAndTryAgain'))
      },
    },
  )

  const loading = getLoading || postLoading

  if (!gameName) {
    return null
  }

  return (
    <Dialog maxWidth="sm" fullWidth {...DialogProps}>
      <DialogTitle onClose={DialogProps.onClose}>
        {translate('fairnessModal.changeSeeds')}
      </DialogTitle>
      <Helmet title={translate('fairnessModal.fairness')} />

      <div className={classes.fairnessModal}>
        <p>{translate('fairnessModal.titleDesc')}</p>
        <div>
          <div className={classes.changeGroup}>
            <span className={commonDialogClasses.formLabel}>
              {translate('fairnessModal.clientSeed')}
            </span>
            <div>
              <input
                type="text"
                value={clientSeed}
                placeholder={translate('fairnessModal.enterNewSeed')}
                className={commonDialogClasses.formTextInput}
                maxLength={25}
                disabled={loading}
                onChange={event => {
                  setState(prevState => ({
                    ...prevState,
                    clientSeed: event.target.value,
                  }))
                  setStorageItem('clientSeed', event.target.value)
                }}
              />
              <button
                disabled={loading}
                onClick={() => toast.success(translate('fairnessModal.saved'))}
              >
                {translate('fairnessModal.save')}
              </button>
            </div>
          </div>

          <div className={classes.changeGroup}>
            <span className={commonDialogClasses.formLabel}>
              {translate('fairnessModal.serverSeedHashed')}
            </span>
            <div>
              <input
                disabled
                type="text"
                value={loading ? 'Loading...' : serverSeedHashText}
                className={commonDialogClasses.formTextInput}
              />
              <button disabled={loading} onClick={() => _refreshServerSeed()}>
                {translate('fairnessModal.change')}
              </button>
            </div>
          </div>

          <div className={classes.changeGroup}>
            <span className={commonDialogClasses.formLabel}>
              {translate('fairnessModal.nonce')}
            </span>
            <div>
              <input
                disabled
                type="text"
                value={loading ? 'Loading...' : nonceText}
                className={commonDialogClasses.formTextInput}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export const FairnessDialog = connect(({ user }) => {
  return {
    user,
  }
})(FairnessDialogView)
