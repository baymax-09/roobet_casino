import { type AlertProps } from '@project-atl/ui'

import { type KYCStatus } from 'app/components/KycForms/types'

export const STATUS_TO_SEVERITY: Record<KYCStatus, AlertProps['severity']> = {
  unavailable: 'info',
  complete: 'success',
  incomplete: 'info',
  pending: 'warning',
  rejected: 'error',
} as const

export const ChangePassword2FAAction = 0
export const Disable2FAAction = 1
export const Enable2FAAction = 2

export type TwoFactorAction =
  | typeof ChangePassword2FAAction
  | typeof Disable2FAAction
  | typeof Enable2FAAction
