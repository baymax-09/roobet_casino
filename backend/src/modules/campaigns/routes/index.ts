import { type RouterApp } from 'src/util/api'
import { createUniboOptInRouter } from './optInRoute'

export default function (app: RouterApp) {
  app.use('/campaigns', createUniboOptInRouter())
}
