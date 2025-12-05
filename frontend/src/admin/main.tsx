import React from 'react'
import ReactDOM from 'react-dom'
import WebFont from 'webfontloader'

import { api, hideLoader } from 'common/util'
import { type User } from 'common/types'

import { AdminProviders } from './MainComponent'

async function render() {
  const { result: user } = await api.get<null, { result: User }>('account/get')
  hideLoader(true)
  ReactDOM.render(
    <AdminProviders user={user} />,
    document.getElementById('root'),
  )
}

WebFont.load({
  google: {
    families: ['Roboto:300,400,500,700&display=swap'],
  },

  active() {
    render()
  },
})
