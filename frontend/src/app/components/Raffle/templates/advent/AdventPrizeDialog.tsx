import React from 'react'
import { Button, Dialog } from '@mui/material'
import numeral from 'numeral'
import clsx from 'clsx'

import { api, getCachedSrc, isApiError } from 'common/util'
import { useTranslate } from 'app/hooks'
import { useToasts } from 'common/hooks'
import { roundBalance } from 'app/util'

import AdventBanner from './AdventBanner'
import AdventPrize from './AdventPrize'

import { useAdventPrizeDialogStyles } from './AdventPrizeDialog.styles'

type CoinflipSide = 'heads' | 'tails'

const formatAmount = (amount: number) =>
  numeral(roundBalance(amount)).format('$0,0.00')

const oppositeSide = (side: CoinflipSide): CoinflipSide =>
  side === 'heads' ? 'tails' : 'heads'

export const AdventPrizeDialog = ({
  prize,
  onClose,
  wasClaimed,
  onSuccess,
  raffle,
}) => {
  const classes = useAdventPrizeDialogStyles({
    day: prize.day,
  })
  const translate = useTranslate()
  const [opened, setOpened] = React.useState<boolean>(wasClaimed)
  const [amount, setAmount] = React.useState<number>(0)
  const [coinSide, setCoinSide] = React.useState<CoinflipSide>('heads')
  const [claimed, setClaimed] = React.useState<boolean>(false)
  const [busy, setBusy] = React.useState(false)
  const [wonCoinflip, setWonCoinflip] = React.useState<boolean | undefined>(
    undefined,
  )

  const { toast } = useToasts()

  const displayClaimedToast = React.useCallback(
    (rakebackAmount: number) => {
      toast.success(
        translate('holidayPrizeModal.prizeClaimedCopy', {
          amount: formatAmount(rakebackAmount),
        }),
      )
      onSuccess()
    },
    [toast, onSuccess, translate],
  )

  const displayErrorToast = React.useCallback(
    (error: unknown) => {
      if (isApiError(error)) {
        toast.error(error.response.data)
      } else {
        toast.error('An unknown error occurred.')
      }
    },
    [toast],
  )

  // Claim without flipping coin.
  const handleBaseClaim = React.useCallback<() => void>(async () => {
    setBusy(true)

    try {
      const response = await api.post<undefined, { rakebackAmount: number }>(
        `/raffle/${raffle._id}/claim`,
      )
      displayClaimedToast(response.rakebackAmount)
    } catch (error) {
      displayErrorToast(error)
    } finally {
      setBusy(false)
    }
  }, [raffle._id, displayClaimedToast, displayErrorToast])

  // Claim WITH flipping coin.
  const handleCoinflipClaim = React.useCallback<() => void>(async () => {
    setBusy(true)
    setClaimed(true)

    try {
      const response = await api.post<
        undefined,
        { rakebackAmount: number; wonCoinflip: boolean }
      >(`/raffle/${raffle._id}/claim`, { coinSide })

      setWonCoinflip(response.rakebackAmount !== 0)

      // The animation is 3s, add an extra 500ms.
      await new Promise(resolve => setTimeout(resolve, 3500))

      setAmount(response.rakebackAmount)
    } catch (error) {
      displayErrorToast(error)
    } finally {
      setBusy(false)
    }
  }, [raffle._id, displayErrorToast, coinSide])

  const handleOpen = React.useCallback<() => void>(async () => {
    setBusy(true)

    try {
      const response = await api.post<
        { dry: boolean },
        { rakebackAmount: number }
      >(`/raffle/${raffle._id}/claim`, {
        dry: true,
      })

      setOpened(true)
      setAmount(response.rakebackAmount)
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.response.data)
      } else {
        toast.error('An unknown error occurred.')
      }
    } finally {
      setBusy(false)
    }
  }, [raffle._id, toast])

  return (
    <Dialog
      fullScreen
      open
      classes={{ paper: classes.AdventPrizeModal__paper }}
      onClose={onClose}
    >
      {busy && claimed && (
        <div
          className={classes.AdventPrizeModal__coin}
          data-animate={
            wonCoinflip !== undefined
              ? wonCoinflip
                ? coinSide
                : oppositeSide(coinSide)
              : undefined
          }
        >
          <div
            className={classes.AdventPrizeModal__coin_side}
            data-side="heads"
          />
          <div
            className={classes.AdventPrizeModal__coin_side}
            data-side="tails"
          />
        </div>
      )}
      <div className={classes.AdventPrizeModal__background} />
      <div
        className={clsx(classes.AdventPrizeModal, {
          [classes.AdventPrizeModal_claiming]: busy && opened,
        })}
      >
        <div className={classes.AdventPrizeModal__banner}>
          <AdventBanner
            featureImageSrc={getCachedSrc({ src: raffle.featureImage })}
            showCountdown={false}
          />
        </div>

        {/* Display prize if not opened. */}
        {!opened && (
          <div className={classes.AdventPrizeModal__prizes}>
            <AdventPrize
              focused={true}
              className={clsx(classes.Prizes__prize, {
                [classes.Prize_claimed]: opened,
              })}
              prize={prize}
            />
          </div>
        )}

        {/* Display claim amount if opened. */}
        {opened && (
          <div className={classes.AdventPrizeModal__claim_container}>
            <div className={classes.AdventPrizeModal__claim}>
              <div className={classes.AdventPrizeModal__claim_amount}>
                {formatAmount(amount)}
              </div>
              <span>
                {claimed
                  ? translate('holidayPrizeModal.newClaimBonus')
                  : translate('holidayPrizeModal.currentClaimBonus')}
              </span>
            </div>
          </div>
        )}

        {/* Display status of coinflip. */}
        {opened && (
          <div className={classes.AdventPrizeModal__coinflip_cta}>
            <div className={classes.AdventPrizeModal__coinflip_cta_title}>
              {!claimed && translate('holidayPrizeModal.coinflipCtaTitleStart')}
              {claimed &&
                amount === 0 &&
                translate('holidayPrizeModal.coinflipCtaTitleLose')}
              {claimed &&
                amount > 0 &&
                translate('holidayPrizeModal.coinflipCtaTitleWin')}
            </div>
            <div>
              {!claimed &&
                translate('holidayPrizeModal.coinflipCtaSubtitleStart')}
              {claimed &&
                amount === 0 &&
                translate('holidayPrizeModal.coinflipCtaSubtitleLose')}
              {claimed &&
                amount > 0 &&
                translate('holidayPrizeModal.coinflipCtaSubtitleWin')}
            </div>
          </div>
        )}

        {/* Coinflip selector if opened. */}
        {opened && (
          <div className={classes.AdventPrizeModal__coinflip}>
            <span className={classes.AdventPrizeModal__coinflip_label}>
              {translate('holidayPrizeModal.coinflipSideHeads')}
            </span>
            <div
              className={classes.AdventPrizeModal__coinflip_side}
              onClick={() => !claimed && setCoinSide('heads')}
              data-side="heads"
              data-selected={coinSide === 'heads'}
              data-enabled={!claimed}
              role="button"
            />
            <span>{translate('holidayPrizeModal.coinflipSideOr')}</span>
            <div
              className={classes.AdventPrizeModal__coinflip_side}
              onClick={() => !claimed && setCoinSide('tails')}
              data-side="tails"
              data-selected={coinSide === 'tails'}
              data-enabled={!claimed}
              role="button"
            />
            <span className={classes.AdventPrizeModal__coinflip_label}>
              {translate('holidayPrizeModal.coinflipSideTails')}
            </span>
          </div>
        )}

        <div
          className={clsx(classes.AdventPrizeModal__actions, {
            [classes.AdventPrizeModal__actions_divider]: opened,
          })}
        >
          {/* Action buttons prior to opening prize */}
          {!opened && (
            <>
              <Button
                disabled={busy}
                onClick={handleOpen}
                color="secondary"
                variant="contained"
                size="medium"
              >
                {translate('holidayPrizeModal.open')}
              </Button>
              <Button
                disabled={busy}
                onClick={onClose}
                color="secondary"
                variant="outlined"
                size="medium"
              >
                {translate('holidayPrizeModal.dismiss')}
              </Button>
            </>
          )}

          {/* Action buttons after opening prize */}
          {opened && (
            <>
              <Button
                disabled={busy || claimed}
                onClick={handleCoinflipClaim}
                color="secondary"
                variant="contained"
                size="medium"
              >
                {translate('holidayPrizeModal.flip')}
              </Button>
              {!claimed && (
                <Button
                  disabled={busy}
                  onClick={handleBaseClaim}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                >
                  {translate('holidayPrizeModal.claimAmount', {
                    amount: formatAmount(amount),
                  })}
                </Button>
              )}
              {claimed && amount > 0 && (
                <Button
                  disabled={busy}
                  onClick={() => displayClaimedToast(amount)}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                >
                  {translate('holidayPrizeModal.claimAmount', {
                    amount: formatAmount(amount),
                  })}
                </Button>
              )}
              {claimed && amount === 0 && (
                <Button
                  disabled={busy}
                  onClick={onSuccess}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                >
                  {translate('holidayPrizeModal.dismiss')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default React.memo(AdventPrizeDialog)
