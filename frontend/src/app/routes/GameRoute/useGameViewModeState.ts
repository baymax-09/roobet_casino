import { useEffect } from 'react'
import { useLocalStorage } from 'react-use'

/**
 * The different view modes the game can be in.
 */
export enum GameViewMode {
  Regular = 'regular',
  Theatre = 'theatre',
  FullScreen = 'fullScreen',
}

const isWindowUndefined = typeof window === 'undefined'

const LOCAL_STORAGE_KEY = 'game:view-mode'

/**
 * Initializes the view mode state from local storage, if available else defaults to regular.
 */
export const useGameViewModeState = () => {
  const [viewMode, setViewMode] = useLocalStorage<GameViewMode>(
    LOCAL_STORAGE_KEY,
    GameViewMode.Regular,
    { raw: true },
  )

  useEffect(() => {
    if (isWindowUndefined) {
      return
    }

    setViewMode(
      viewMode === GameViewMode.FullScreen ? GameViewMode.Regular : viewMode,
    )
  }, [viewMode, setViewMode])

  return {
    viewMode,
    setViewMode,
  }
}
