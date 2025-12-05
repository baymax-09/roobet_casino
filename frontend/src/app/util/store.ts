import { createStore, applyMiddleware } from 'redux'

import { reducers } from 'app/reducers'

const logMiddleware = store => next => action => {
  return next(action)
}

function configureStore(rootReducer, initialState) {
  const create = window.devToolsExtension
    ? window.devToolsExtension()(createStore)
    : createStore

  const createStoreWithMiddleware = applyMiddleware(logMiddleware)(create)

  const store = createStoreWithMiddleware(rootReducer, initialState)

  if (module.hot) {
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers')
      store.replaceReducer(nextReducer)
    })
  }

  return store
}

export const store = configureStore(reducers)
