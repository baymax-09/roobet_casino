import React, { useRef, useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import Lottie from 'react-lottie'
import {
  Divider,
  Popover,
  Typography,
  Fab,
  Button,
  Zoom,
  useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {
  usePopupState,
  bindPopover,
  bindToggle,
} from 'material-ui-popup-state/hooks'
import WarningIcon from '@mui/icons-material/Warning'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment'
import { theme as uiTheme } from '@project-atl/ui'

import { AnimatedNumber } from 'mrooi'
import { updateMatchPromo } from 'app/reducers/user'
import { store } from 'app/util'
import { useCurrencyDisplay, useTranslate } from 'app/hooks'
import { useConfirm, useToasts } from 'common/hooks'
import { api } from 'common/util'
import giftAnimationData from 'app/lottiefiles/test/9750-gift.json'
import { FIXED_TYPE, type DepositBonusType } from 'common/types/depositBonus'
import { useApp } from 'app/context'

import LeftToWagerTooltip from './LeftToWagerTooltip'
import { Currency } from '../DisplayCurrency'

import { styles, useMatchPromoStyles } from './MatchPromo.styles'

const GiftAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: giftAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
}

const deriveCurrencyFormat = number =>
  number >= 100000
    ? '(0.00a)'
    : number > 100
      ? '0,0'
      : number >= 0 && number < 1
        ? '0,0.00'
        : '0,0.00'

export interface MatchPromoProps {
  // TODO make these a Match Promo type?
  amountMatched: number
  leftToWager: number
  bonusType: DepositBonusType
  maxMatch?: number
  percentMatch?: number
  wagerRequirementMultiplier?: number
  fixedAmount?: number
  expirationDate?: Date
  minDeposit?: number
  amountDeposited?: number
}

const MatchPromoView: React.FC<MatchPromoProps> = ({ ...matchPromo }) => {
  const initialRef = useRef(true)
  const { width, height } = useWindowSize()
  const lastWagerRef = useRef<number | null>(null)
  const translate = useTranslate()
  const { toast } = useToasts()
  const displayCurrencyExchange = useCurrencyDisplay()
  const { chatHidden } = useApp()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [lastWager, setLastWager] = useState<number>(0)
  const totalNeededToWager =
    !!matchPromo.wagerRequirementMultiplier && !!matchPromo?.amountMatched
      ? matchPromo.wagerRequirementMultiplier *
        (matchPromo.amountMatched + (matchPromo.amountDeposited ?? 0))
      : 0
  const [requiredWager, setRequiredWager] = useState<number>(
    totalNeededToWager ?? 0,
  )
  const isFixedBonusType =
    matchPromo.bonusType === FIXED_TYPE.toLowerCase() ?? false

  const promotionActive = typeof matchPromo.amountMatched !== 'undefined'
  const leftToWager = Math.max(0, promotionActive ? matchPromo.leftToWager : 0)
  const completedPromotion = promotionActive && leftToWager <= 0
  const percentage =
    promotionActive && matchPromo.wagerRequirementMultiplier
      ? (1 - leftToWager / requiredWager) * 100
      : 0
  const classes = useMatchPromoStyles()
  const confirm = useConfirm()
  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'matchPromoPopover',
  })

  const onForfeit = () =>
    confirm({
      title: translate('matchPromo.forfeitDepositBonus'),
      message: translate('matchPromo.forfeitConfirmText'),
    }).then(
      () =>
        api
          .post('/promo/abortMatchPromoWithPenalty')
          .then(() => {
            store.dispatch(updateMatchPromo(null))
            toast.success(translate('matchPromo.depositBonusForfeitText'))
          })
          .catch(error =>
            toast.error(
              !!error.response && !!error.response.data
                ? error.response.data
                : error.message,
            ),
          ),
      () => toast.info(translate('matchPromo.canceledDepositText')),
    )

  useEffect(() => {
    if (!completedPromotion) {
      return
    }

    popupState.close()

    if (matchPromo.wagerRequirementMultiplier) {
      toast.success(translate('matchPromo.depositWithdrawSuccessText'))
    }

    const timeout = setTimeout(() => {
      store.dispatch(updateMatchPromo(null))
    }, 8000)

    return () => {
      clearTimeout(timeout)
    }
  }, [completedPromotion])

  useEffect(() => {
    if (!promotionActive || leftToWager <= 0) {
      setShowPreview(false)
      return
    }
    if (initialRef.current) {
      initialRef.current = false
      return
    }

    setLastWager(lastWagerRef.current || leftToWager)
    lastWagerRef.current = leftToWager

    setShowPreview(true)

    const timeout = setTimeout(() => {
      setShowPreview(false)
    }, 2500)

    return () => {
      clearTimeout(timeout)
    }
  }, [promotionActive, leftToWager, setShowPreview])

  const exchangedLastWager = displayCurrencyExchange(lastWager)
  const exchangedLeftToWager = displayCurrencyExchange(leftToWager)
  const fixedAmount =
    (matchPromo.fixedAmount &&
      displayCurrencyExchange(matchPromo.fixedAmount)) ??
    0
  const minDeposit =
    (matchPromo.minDeposit && displayCurrencyExchange(matchPromo.minDeposit)) ??
    0
  const maxMatch =
    (matchPromo.maxMatch && displayCurrencyExchange(matchPromo.maxMatch)) ?? 0

  return (
    <div>
      <Zoom in>
        <LeftToWagerTooltip
          arrow
          disableFocusListener
          disableHoverListener
          disableTouchListener
          pending={!promotionActive}
          open={
            (completedPromotion ||
              (showPreview && !popupState.isOpen) ||
              (!promotionActive && !popupState.isOpen)) &&
            // Don't show Tooltip when chat is open on mobile devices
            (isTabletOrDesktop || (!isTabletOrDesktop && chatHidden))
          }
          placement="top"
          title={
            <span>
              {completedPromotion ? (
                <>
                  <Confetti width={width} height={height} />
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <FontAwesomeIcon icon="check" /> Bonus Completed!
                </>
              ) : !promotionActive ? (
                `${translate('matchPromo.waitingForDeposit')}...`
              ) : (
                <>
                  <AnimatedNumber
                    lastValue={exchangedLastWager.exchangedAmount}
                    value={exchangedLeftToWager.exchangedAmount}
                    symbol={exchangedLeftToWager.currencySymbol}
                    format={deriveCurrencyFormat(leftToWager)}
                  />
                  {translate('matchPromo.remaining')}
                </>
              )}
            </span>
          }
        >
          <Fab
            {...bindToggle(popupState)}
            disableRipple
            className={classes.MatchPromo__eventIcon}
            disabled={completedPromotion}
            size="small"
            sx={{
              backgroundColor: popupState.isOpen
                ? 'secondary.main'
                : 'deprecated.primary.main',
              '&:hover': {
                backgroundColor: 'secondary.main',
              },
            }}
          >
            <Zoom
              in={
                !completedPromotion &&
                !showPreview &&
                !popupState.isOpen &&
                promotionActive
              }
            >
              <div className={classes.MatchPromo__percentBadge}>
                {!completedPromotion && !!percentage && isFinite(percentage)
                  ? `${percentage.toFixed(2)}%`
                  : '0%'}
              </div>
            </Zoom>

            {!popupState.isOpen ? (
              <Lottie options={GiftAnimationOptions} height={30} width={30} />
            ) : (
              <CloseIcon className={classes.MatchPromo__closeIcon} />
            )}
          </Fab>
        </LeftToWagerTooltip>
      </Zoom>

      <Popover
        {...bindPopover(popupState)}
        slotProps={{
          paper: {
            sx: styles.MatchPromo__eventDialog,
          },
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Typography
          variant="h6"
          classes={{ h6: classes.EventDialog_headerBold }}
          color="deprecated.textPrimary"
        >
          {translate('matchPromo.depositBonusActive')}
        </Typography>
        <Typography
          variant="body2"
          classes={{ body2: classes.EventDialog_subheaderLighten }}
          color="deprecated.text.secondary"
        >
          {promotionActive ? (
            <>
              <FontAwesomeIcon icon="lock" />{' '}
              <Currency
                amount={matchPromo.amountMatched}
                format={deriveCurrencyFormat(matchPromo.amountMatched)}
              />{' '}
              {translate('matchPromo.matched')}
            </>
          ) : (
            translate('matchPromo.waitingForDeposit')
          )}
        </Typography>

        {promotionActive ? (
          <>
            <div className={classes.EventDialog__progressBar}>
              <div
                className={classes.ProgressBar__currentProgress}
                style={{ width: `${percentage.toFixed(2)}%` }}
              />
            </div>
            <Typography
              variant="caption"
              classes={{ caption: classes.EventDialog__leftToWager }}
              color="deprecated.text.secondary"
            >
              {translate('matchPromo.wagerAtLeast')}
              <span>
                <Currency
                  amount={leftToWager}
                  format={deriveCurrencyFormat(leftToWager)}
                />
              </span>
              {translate('matchPromo.moreToBeElgText')}
            </Typography>
          </>
        ) : (
          <Typography
            variant="caption"
            classes={{ caption: classes.EventDialog__message }}
            color="deprecated.text.secondary"
          >
            {!isFixedBonusType && !!maxMatch && (
              <>
                {translate('matchPromo.match')}
                <span>{`${matchPromo?.percentMatch}%`}</span>
                {translate('matchPromo.matchUpTo')}
                <span>
                  {maxMatch.currencySymbol}
                  {maxMatch.exchangedAmount.toFixed(2)}
                </span>
                <br />
              </>
            )}

            {isFixedBonusType && !!fixedAmount && (
              <>
                {translate('matchPromo.fixedAmount')}
                <span>
                  {fixedAmount.currencySymbol}
                  {fixedAmount.exchangedAmount.toFixed(2)}
                </span>
                {translate('matchPromo.fixedAmount2')}
                <br />
              </>
            )}
            <div className={classes.MatchPromo__itemContainer}>
              {!!matchPromo.wagerRequirementMultiplier && (
                <ul>
                  <li className={classes.MatchPromo__item}>
                    {translate('matchPromo.wagerReq', {
                      wagerReq: matchPromo?.wagerRequirementMultiplier,
                    })}
                  </li>
                </ul>
              )}

              {!!matchPromo?.expirationDate && (
                <ul>
                  <li className={classes.MatchPromo__item}>
                    {translate('matchPromo.expires')}
                    {moment
                      .utc(matchPromo.expirationDate)
                      .format('YYYY/MM/DD, HH:mm [UTC]')}
                  </li>
                </ul>
              )}
              {!!minDeposit && (
                <ul>
                  <li className={classes.MatchPromo__item}>
                    {translate('matchPromo.minDeposit')}
                    <span>
                      {minDeposit.currencySymbol}
                      {minDeposit.exchangedAmount.toFixed(2)}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          </Typography>
        )}
        {!!matchPromo.wagerRequirementMultiplier && promotionActive && (
          <>
            <Divider className={classes.EventDialog__divider} />
            <Button
              onClick={onForfeit}
              startIcon={<WarningIcon />}
              className={classes.EventDialog__forfeitButton}
            >
              {translate('matchPromo.forfeitAndReset')}
            </Button>
          </>
        )}
      </Popover>
    </div>
  )
}

export const MatchPromo = React.memo(MatchPromoView)
