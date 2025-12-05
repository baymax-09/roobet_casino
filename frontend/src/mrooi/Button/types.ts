export const ButtonTypeKeys = [
  'white',
  'yellow',
  'green',
  'red',
  'lightPurple',
  'darkPurple',
  'modifierButton',
  'gameSetting',
  'lightSuffix',
  'light',
  'transparent',
] as const
export type ButtonType = (typeof ButtonTypeKeys)[number]
