import React from 'react'
import { useToggle } from 'react-use'
import { useSelector } from 'react-redux'
import { Button, Typography } from '@project-atl/ui'
import clsx from 'clsx'
import { useHistory } from 'react-router'

import {
  useTranslate,
  useDialogsOpener,
  useLocale,
  useIsLoggedIn,
} from 'app/hooks'
import { type NormalizedTPGame } from 'common/types'
import { CurrencySelectorOverlay } from 'app/components'
import { type DisplayCurrency } from 'common/constants'

import { loadGameFrame } from './GameFrameRouteView'
import { CASINO_LOBBY_LINK } from '../CasinoPageRoute'

import { useGameRouteStyles } from './GameRoute.styles'

interface GameRouteOverlayProps {
  errorMessage?: string | null
  isBlocked: boolean
  isMobile: boolean
  game: NormalizedTPGame | null
  toggleRealMode: (nextValue?: any) => void
  supportedCurrencies: DisplayCurrency[] | null
  showCurrencyOverlay: boolean
  setShowCurrencyOverlay: React.Dispatch<React.SetStateAction<boolean>>
  showCurrencyOverlayWithSupportedCurrencies: (
    supportedCurrencies: DisplayCurrency[] | undefined,
    gameIdentifier: string,
    gameCurrency: DisplayCurrency,
  ) => void
  gameCurrency: DisplayCurrency
  setGameCurrency: React.Dispatch<React.SetStateAction<DisplayCurrency>>
}

const GameRouteOverlay: React.FC<GameRouteOverlayProps> = ({
  errorMessage,
  isBlocked,
  isMobile,
  game,
  toggleRealMode,
  supportedCurrencies,
  showCurrencyOverlay,
  setShowCurrencyOverlay,
  showCurrencyOverlayWithSupportedCurrencies,
  gameCurrency,
  setGameCurrency,
}) => {
  const classes = useGameRouteStyles({})
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const locale = useLocale()
  const history = useHistory()

  const isLoggedIn = useIsLoggedIn()
  const countryCode = useSelector(
    ({ settings }) => settings?.countryCode ?? null,
  )

  const [loading, setLoading] = React.useState<boolean>(false)

  // Show login overlay on un'authed desktop after game has loaded.
  const [showLoginOverlay, toggleLoginOverlay] = useToggle(
    !!game && !isLoggedIn && !isMobile,
  )

  const openLoginDialog = () =>
    openDialog('auth', {
      params: {
        tab: 'login',
      },
    })

  const onMobilePlayClick = async (
    realMode: boolean,
    selectedCurrency?: DisplayCurrency,
  ) => {
    if (!game) {
      return
    }

    if (realMode && !isLoggedIn) {
      openDialog('auth')
      return
    }

    setLoading(true)

    const displayCurrency = selectedCurrency ?? gameCurrency

    try {
      const gameFrameData = await loadGameFrame({
        realMode,
        game,
        isMobile,
        locale,
        countryCode,
        displayCurrency,
      })

      if (showCurrencyOverlayWithSupportedCurrencies) {
        showCurrencyOverlayWithSupportedCurrencies(
          gameFrameData?.supportedCurrencies,
          game.identifier,
          displayCurrency,
        )
      }

      if (gameFrameData?.url) {
        window.open(gameFrameData.url, '_self')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Called when the user selected a new currency from the CurrencySelectorOverlay.
  const onModeClick = React.useCallback(
    (real: boolean, selectedCurrency?: DisplayCurrency) => {
      if (isMobile) {
        onMobilePlayClick(real, selectedCurrency)
        return
      }
      toggleRealMode(real)
    },
    [isMobile, toggleRealMode],
  )

  const message =
    errorMessage || (isBlocked && translate('gameRoute.gameNotAvailRegionText'))

  return (
    <>
      {/* Message overlay */}
      {!!message && (
        <div className={classes.errorOverlay}>
          <div className={classes.errorMessageContainer}>
            <Typography
              sx={{
                textAlign: 'center',
                p: 1,
                color: 'neutral.300',
                typography: 'body2',
                fontWeight: 'medium',
              }}
            >
              {message}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => history.push(CASINO_LOBBY_LINK)}
              label={translate('gameRoute.browseOtherGames')}
            />
          </div>
        </div>
      )}

      {/* Login overlay for un-authed desktop */}
      {!message && showLoginOverlay && (
        <div className={classes.loginOverlay}>
          <div className={classes.loginOverlayTitle}>
            {translate('gameRoute.yourePlayingForFunText')}
          </div>
          <div
            className={clsx(classes.actions, classes.ButtonContainer)}
            style={{ marginLeft: 'inherit' }}
          >
            <Button
              fullWidth
              variant="contained"
              color="tertiary"
              onClick={toggleLoginOverlay}
              label={translate('gameRoute.funPlay')}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={openLoginDialog}
              label={translate('gameRoute.login')}
            />
          </div>
        </div>
      )}

      {/* Unsupported Currency Overlay */}
      {showCurrencyOverlay && game?.aggregator && (
        <CurrencySelectorOverlay
          supportedCurrencies={supportedCurrencies}
          setShowCurrencyOverlay={setShowCurrencyOverlay}
          onModeClick={onModeClick}
          isMobile={isMobile}
          gameIdentifier={game.identifier}
          setGameCurrency={setGameCurrency}
        />
      )}

      {/* Show Real & Fun play buttons on mobile */}
      {!message && isMobile && !!game && (
        <div className={classes.mobileView}>
          <div
            className={classes.mobileImage}
            style={{
              backgroundImage: game
                ? `url(${game.cachedSquareImage})`
                : undefined,
            }}
          ></div>

          <div className={clsx(classes.actions, classes.ButtonContainer)}>
            {game.hasFunMode && (
              <Button
                fullWidth
                variant="contained"
                color="tertiary"
                disabled={loading}
                onClick={() => onMobilePlayClick(false)}
                label={translate('gameRoute.funPlay')}
              />
            )}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              onClick={() => onMobilePlayClick(true)}
              label={translate('gameRoute.realPlay')}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default GameRouteOverlay
