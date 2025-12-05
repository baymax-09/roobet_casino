import { config } from 'src/system/config'

export const isPasswordValid = (value?: string): value is string => {
  return (
    typeof value === 'string' &&
    value.length >= config.minimumPasswordLength &&
    value.length <= 100
  )
}
