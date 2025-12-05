import React from 'react'
import { useSelector } from 'react-redux'

import { Container } from 'mrooi'
import { env } from 'common/constants'
import { HOUSE_GAMES_NATIVE, type NativeGameImport } from 'common/types'
import { useLazyRoute, useDialogsOpener } from 'app/hooks'

import { type GameRouteViewProps } from '../types'

import { useNativeGameStyles } from './GameEmbeddedRouteView.styles'

interface NativeSwitchProps {
  component: NativeGameImport
  toggleFavorited: (() => Promise<void>) | null
  isFavorited: boolean | null
}

const NativeSwitch: React.FC<NativeSwitchProps> = ({
  component: Game,
  toggleFavorited,
  isFavorited,
}) => {
  const { user, balances } = useSelector(({ user, settings, balances }) => ({
    user,
    balances,
    userLoaded: settings.loaded,
  }))
  const openDialog = useDialogsOpener()

  const currency = user?.systemSettings?.currency?.displayCurrency ?? 'USD'

  // We should ideally update the `balances` property on the user state instead.
  const userWithBalances = {
    ...user,
    balances,
  }

  return (
    <Game
      apiUrl={env.API_URL}
      socketUrl={env.SOCKET_URL}
      currency={currency}
      locale={user?.locale ?? 'en'}
      user={userWithBalances}
      openDialog={openDialog}
      toggleFavorited={toggleFavorited}
      isFavorited={isFavorited}
    />
  )
}

export const GameEmbeddedRouteView: React.FC<GameRouteViewProps> = ({
  gameIdentifier,
  loading: gameLoading,
  favorited,
  toggleFavorited,
}) => {
  // Fetch and memoize game config for later use.
  const gameConfig = React.useMemo(
    () => HOUSE_GAMES_NATIVE[gameIdentifier],
    [gameIdentifier],
  )

  const { done: lazyRouteDone } = useLazyRoute()
  const classes = useNativeGameStyles()

  // Store this in state to trigger re-renders.
  const [packageLoaded, setPackageLoaded] = React.useState<boolean>(false)

  // Track game in ref.
  const game = React.useRef<NativeGameImport | null>(null)

  React.useEffect(() => {
    ;(async () => {
      // Dynamically load game component.
      game.current = await gameConfig.importPackage()

      setPackageLoaded(true)
    })()

    return () => {
      game.current = null
      setPackageLoaded(false)
    }
  }, [gameConfig, gameIdentifier, lazyRouteDone])

  // Finish route transition once page content is loaded.
  React.useEffect(() => {
    if (packageLoaded && !gameLoading) {
      lazyRouteDone()
    }
  }, [packageLoaded, gameLoading, lazyRouteDone])

  // TS: Ref assertion is only for the type checker.
  if (!packageLoaded || !game.current) {
    return null
  }

  return (
    <Container className={classes.EmbeddedGameRoute__Container}>
      <NativeSwitch
        component={game.current}
        isFavorited={favorited}
        toggleFavorited={toggleFavorited}
      />
    </Container>
  )
}
