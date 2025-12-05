import { type RouterApp } from 'src/util/api'

import createSystemRouter from './systems'

export default function (app: RouterApp) {
  app.use('/system', createSystemRouter())
}
