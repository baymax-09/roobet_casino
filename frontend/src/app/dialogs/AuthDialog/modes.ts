export const LoginMode = 'login'
export const RegisterMode = 'register'
export const ResetMode = 'reset'
export const SetUsernameMode = 'setUsername'
export const TwoFactorRequiredMode = 'twofactorRequired'
export const TwoFactorEmailMode = 'twofactorEmail'

export type Mode =
  | typeof LoginMode
  | typeof RegisterMode
  | typeof ResetMode
  | typeof SetUsernameMode
  | typeof TwoFactorRequiredMode
  | typeof TwoFactorEmailMode
