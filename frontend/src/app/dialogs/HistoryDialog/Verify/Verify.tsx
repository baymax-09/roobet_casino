import React from 'react'
import { Button, InputField, theme as uiTheme, Loading } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { useAxiosGet, useToasts } from 'common/hooks'
import { type HouseGame } from 'common/types'

import {
  VerifyMultiplierResults,
  VerifyDiceResults,
  VerifyMinesResults,
  VerifyRouletteResults,
  VerifyTowersResults,
  VerifyCoinflipResults,
  VerifyLinearMinesResults,
  VerifyBlackjackResults,
} from './VerifyResults'
import { useCommonDialogStyles } from '../../Dialog.styles'

import { useVerifyStyles } from './Verify.styles'

interface VerifyProps {
  gameName: HouseGame
  betId: string
}

interface VerificationResults {
  serverSeed: string
  hashedServerSeed: string | null
  nonce?: number | null
  clientSeed: string | undefined
  result: any
  gameHash?: string
  outcome?: 'heads' | 'tails'
  blockHeight?: number
  hashForOtherPlayer?: { gameFinalHash?: string | null } | null
  gridSize?: number
}

const verifyResultsMap: Record<
  HouseGame,
  React.FC<{ results: VerificationResults }>
> = {
  roulette: VerifyRouletteResults,
  crash: VerifyMultiplierResults,
  dice: VerifyDiceResults,
  mines: VerifyMinesResults,
  towers: VerifyTowersResults,
  cashdash: VerifyTowersResults,
  plinko: VerifyMultiplierResults,
  hotbox: VerifyMultiplierResults,
  coinflip: VerifyCoinflipResults,
  junglemines: VerifyMinesResults,
  linearmines: VerifyLinearMinesResults,
  blackjack: VerifyBlackjackResults,
} as const

export const Verify: React.FC<VerifyProps> = ({ gameName, betId }) => {
  const classes = useVerifyStyles()
  const translate = useTranslate()
  const { toast } = useToasts()
  const commonDialogClasses = useCommonDialogStyles({
    color: uiTheme.palette.common.white,
  })

  const [{ data, loading }, fetchVerification] = useAxiosGet<
    VerificationResults,
    { betId: string }
  >(`/game/${gameName}/verify`, {
    params: { betId },
    lazy: true,
    onError: error => toast.error(error.response.data),
  })

  const clientSeedText = ['crash', 'roulette', 'hotbox'].includes(gameName)
    ? translate('verifyModal.publicKey')
    : translate('verifyModal.clientSeed')

  const VerifyResultComponent = verifyResultsMap[gameName]

  return (
    <>
      {loading && (
        <Loading className={classes.Verify__loading} widthAndHeight={33} />
      )}
      {!data && (
        <Button
          label={translate('historyDialog.verifyBet')}
          variant="contained"
          color="primary"
          size="medium"
          fullWidth
          onClick={() => fetchVerification()}
        />
      )}
      {data && !loading && (
        <div className={classes.Verify}>
          {!!data.hashedServerSeed && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.hashedServerSeed')}
              </span>
              <InputField
                type="text"
                value={data.hashedServerSeed}
                placeholder={translate('verifyModal.hashedServerSeed')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.serverSeed && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.serverSeed')}
              </span>
              <InputField
                type="text"
                value={data.serverSeed}
                placeholder={translate('verifyModal.serverSeed')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.clientSeed && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {clientSeedText}
              </span>
              <InputField
                type="text"
                value={data.clientSeed}
                placeholder={translate('verifyModal.clientSeed')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {(!!data.nonce || data.nonce === 0) && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.nonce')}
              </span>
              <InputField
                type="text"
                value={data.nonce}
                placeholder={translate('verifyModal.nonce')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.gridSize && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.gridSize')}
              </span>
              <InputField
                type="text"
                value={data.gridSize}
                placeholder={translate('verifyModal.gridSize')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.gameHash && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.gameHash')}
              </span>
              <InputField
                type="text"
                value={data.gameHash}
                placeholder={translate('verifyModal.gameHash')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.blockHeight && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.blockHeight')}
              </span>
              <InputField
                type="text"
                value={data.blockHeight}
                placeholder={translate('verifyModal.blockHeight')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.hashForOtherPlayer && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.opponentHashServerSeed')}
              </span>
              <InputField
                type="text"
                value={data.hashForOtherPlayer.gameFinalHash}
                placeholder={translate('verifyModal.opponentHashServerSeed')}
                className={classes.Verify__formInput}
                disabled
              />
            </>
          )}
          {!!data.result && (
            <>
              <span className={commonDialogClasses.formLabel}>
                {translate('verifyModal.result')}
              </span>
              <VerifyResultComponent results={data} />
            </>
          )}
        </div>
      )}
    </>
  )
}
