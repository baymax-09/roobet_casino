import { type RouterApp } from 'src/util/api'

import createSettingsRouter from './settings'

export default function (app: RouterApp) {
  app.use('/settings', createSettingsRouter())
}
