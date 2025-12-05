import { createBrowserHistory } from 'history'

export const history = createBrowserHistory()

// @ts-expect-error Setting this prop may be unnecessary.
history.scrollRestoration = 'manual'
window.history.scrollRestoration = 'manual'
