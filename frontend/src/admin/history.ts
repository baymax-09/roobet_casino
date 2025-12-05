import { createBrowserHistory, createHashHistory } from 'history'

import { env } from 'common/constants'

export const history =
  env.NODE_ENV === 'production' ? createBrowserHistory() : createHashHistory()
