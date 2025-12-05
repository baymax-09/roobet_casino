import React from 'react'
import clsx from 'clsx'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { type NormalizedTPGame } from 'common/types'
import {
  YGGDRASIL_PROVIDER_NAME,
  isDisplayCurrency,
  type DisplayCurrency,
} from 'common/constants'
import { getStorageItem } from 'app/util'

import GameRouteOverlay from './GameRouteOverlay'
import { PlayngoLauncher } from './PlayngoLauncher'
import { SoftswissLauncher } from './SoftswissLauncher'
import { PragmaticLauncher } from './PragmaticLauncher'
import { Hub88Launcher } from './Hub88Launcher'
import { HacksawLauncher } from './HacksawLauncher'
import { HouseGameLauncher } from './HouseGameLauncher'
import { SlotegratorSlotsLauncher } from './SlotegratorSlotsLauncher'
import { YggdrasilLauncher } from './YggdrasilLauncher'

import { useGameRouteStyles } from './GameRoute.styles'

export interface GameLaunchContainerProps {
  game: NormalizedTPGame | null
  errorMessage: string | null
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  isMobile: boolean
  realMode: boolean
  toggleRealMode: (nextValue?: any) => void
  gameWrapperRef: React.MutableRefObject<HTMLDivElement | null>
  isBlocked: boolean
}

const GameLauncherContainer: React.FC<GameLaunchContainerProps> = ({
  game,
  errorMessage,
  isMobile,
  realMode,
  toggleRealMode,
  gameWrapperRef,
  setErrorMessage,
  isBlocked,
}) => {
  const classes = useGameRouteStyles({
    realMode,
  })
  const history = useHistory()
  const displayCurrency = useSelector(
    ({ user }) => user?.systemSettings?.currency?.displayCurrency ?? null,
  )

  // Show unsupported currency overlay if game provider does not support users current currency.
  const [showCurrencyOverlay, setShowCurrencyOverlay] = React.useState(false)
  const [supportedCurrencies, setSupportedCurrencies] = React.useState<
    DisplayCurrency[] | null
  >(null)
  // Game currency can be different from the users global display currency.
  const [gameCurrency, setGameCurrency] = React.useState<DisplayCurrency>('usd')

  React.useEffect(() => {
    if (displayCurrency) {
      setGameCurrency(displayCurrency)
    }
  }, [displayCurrency])

  const showCurrencyOverlayWithSupportedCurrencies = React.useCallback(
    (
      supportedCurrencies: DisplayCurrency[] | undefined,
      gameIdentifier: string,
      gameCurrency: DisplayCurrency,
    ) => {
      if (!supportedCurrencies) {
        return
      }

      if (supportedCurrencies.includes(gameCurrency)) {
        return
      }

      // Re-use past game currency if there is an invalid currency the user is attempting to play with.
      const localStorageGameIdentifier = getStorageItem(gameIdentifier)

      if (isDisplayCurrency(localStorageGameIdentifier)) {
        setGameCurrency(localStorageGameIdentifier)
        return
      }

      setShowCurrencyOverlay(true)
      setSupportedCurrencies(supportedCurrencies)
    },
    [],
  )

  const goBack = React.useCallback(() => {
    if (isMobile) {
      return
    }

    history.push('/')
  }, [history, isMobile])

  const canPlayDesktop = !isMobile && !errorMessage && !isBlocked && game

  return (
    <>
      <GameRouteOverlay
        errorMessage={errorMessage}
        isBlocked={isBlocked}
        isMobile={isMobile}
        game={game}
        toggleRealMode={toggleRealMode}
        showCurrencyOverlay={showCurrencyOverlay}
        setShowCurrencyOverlay={setShowCurrencyOverlay}
        supportedCurrencies={supportedCurrencies}
        showCurrencyOverlayWithSupportedCurrencies={
          showCurrencyOverlayWithSupportedCurrencies
        }
        gameCurrency={gameCurrency}
        setGameCurrency={setGameCurrency}
      />

      {canPlayDesktop && (
        <div
          className={clsx(classes.sizer, {
            [classes.displayMobile]: !isMobile,
          })}
        >
          {game.aggregator === 'roobet' && (
            <HouseGameLauncher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
            />
          )}

          {game.aggregator === 'playngo' && (
            <PlayngoLauncher
              goBack={goBack}
              realMode={realMode}
              toggleRealMode={toggleRealMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === 'softswiss' && (
            <SoftswissLauncher
              setErrorMessage={setErrorMessage}
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === 'hub88' && (
            <Hub88Launcher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === 'hacksaw' && (
            <HacksawLauncher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === 'pragmatic' && (
            <PragmaticLauncher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === 'slotegrator' && (
            <SlotegratorSlotsLauncher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}

          {game.aggregator === YGGDRASIL_PROVIDER_NAME && (
            <YggdrasilLauncher
              realMode={realMode}
              game={game}
              gameWrapperRef={gameWrapperRef}
              showCurrencyOverlayWithSupportedCurrencies={
                showCurrencyOverlayWithSupportedCurrencies
              }
              gameCurrency={gameCurrency}
            />
          )}
        </div>
      )}
    </>
  )
}

export default GameLauncherContainer
