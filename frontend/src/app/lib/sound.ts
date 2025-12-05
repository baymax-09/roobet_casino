import { Howler, Howl } from 'howler'

import { store } from 'app/util'
import { changeUserSetting } from 'app/reducers/user'

const DEFAULT_VOLUME = 0.4
Howler.volume(DEFAULT_VOLUME)

// We have volume settings for various systems in the settings schema but only use 'app' at the moment
const getVolume = (systemName = 'app') => {
  const user = store.getState().user

  if (!user) {
    return DEFAULT_VOLUME
  }

  const setting = user.systemSettings[systemName] ?? user.systemSettings.app
  return setting.volume ? DEFAULT_VOLUME : 0
}

export const changeVolume = (systemName = 'app', newVolume) => {
  store.dispatch(
    changeUserSetting({
      systemName,
      settingName: 'volume',
      value: newVolume,
    }),
  )
  Howler.volume(newVolume ? DEFAULT_VOLUME : 0)
}

const sounds = {
  notification: {
    newNotif: new Howl({
      src: ['sounds/notification.mp3'],
    }),
  },
  rain: {
    start: new Howl({
      src: ['sounds/rain_starting.mp3'],
    }),
  },
  bet: {
    place: new Howl({
      src: ['sounds/bet.mp3'],
    }),
    modify: new Howl({
      src: ['sounds/bet_modify.mp3'],
    }),
  },
  seasonal: {
    raffle: new Howl({
      src: ['sounds/halloween.mp3'],
      loop: true,
      preload: false,
    }),
  },
  mines: {
    win: new Howl({
      preload: false,
      src: ['sounds/mines_win.mp3'],
    }),
    tile: new Howl({
      preload: false,
      src: ['sounds/mines_tile.mp3'],
    }),
    bomb: new Howl({
      preload: false,
      src: ['sounds/mines_bomb.mp3'],
    }),
  },
  roulette: {
    start: new Howl({
      preload: false,
      src: ['sounds/roulette_start.mp3'],
    }),
    end: new Howl({
      preload: false,
      src: ['sounds/roulette_end.mp3'],
    }),
    win: new Howl({
      preload: false,
      src: ['sounds/roulette_win.mp3'],
    }),
    win_long: new Howl({
      preload: false,
      src: ['sounds/roulette_win_long.mp3'],
    }),
  },
} as const

type Sounds = typeof sounds
type SoundScope = keyof Sounds
type ScopedSound<T extends SoundScope> = keyof Sounds[T]

/**
 * @todo remove optional chaining when TS is reliable
 */
export const playSound = <T extends SoundScope, V extends ScopedSound<T>>(
  scope: T,
  sound: V,
) => {
  sounds[scope]?.[sound]?.play()
}

/**
 * @todo remove optional chaining when TS is reliable
 */
export const stopSound = <T extends SoundScope, V extends ScopedSound<T>>(
  scope: T,
  sound: V,
) => {
  sounds[scope]?.[sound]?.stop()
}

/**
 * @todo remove optional chaining when TS is reliable
 */
export const loadSoundScope = <T extends SoundScope>(scope: T) => {
  Object.values(sounds[scope]).forEach(sound => sound.load())
}
