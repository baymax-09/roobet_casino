import 'express-session'

declare module 'express-session' {
  interface SessionData {
    affiliateName?: string
    linking?: boolean
    signup?: boolean
    openIdState?: string
    curriedRedirect?: string
    validate2fa?: {
      userId: string
    }
  }
}
