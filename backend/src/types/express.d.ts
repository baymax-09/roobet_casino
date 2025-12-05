import { type User as RoobetUser } from 'src/modules/user/types'

declare global {
  namespace Express {
    export interface User extends RoobetUser {}

    export interface Request {
      // Original body of request, in Buffer form.
      rawBody: Buffer

      // App-specific contextual information attached to the request.
      context?: Partial<{
        // Resolved requesting IP.
        requestingIp: string

        // True if request was sent to {domain}/_api instead of api.{domain}.
        apiRewrite: boolean

        // The decrypted payload from an Ember link.
        emberUserId: string
      }>
    }
  }
}
