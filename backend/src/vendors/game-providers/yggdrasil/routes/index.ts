import { type RouterApp } from 'src/util/api'
import { createCallbackRouter } from './callback'
import { createCallbackRouterForQA } from './qa'
import { config } from 'src/system/config'

export default function (app: RouterApp) {
  // Callbacks.
  app.use('/yggdrasil/callback', createCallbackRouter())

  // QA Helpers.
  if (!config.isProd) {
    app.use('/yggdrasil/qa', createCallbackRouterForQA())
  }
}
