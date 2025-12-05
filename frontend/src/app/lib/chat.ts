import { store } from 'app/util'
import { api } from 'common/util'

interface ChatMessage {
  user?: {
    name?: string
  }
}

export const getLatestMessages = async overrideLocale => {
  const currentReduxState = store.getState()
  // check for user
  // check for settings
  let chatLocale = 'en' // default;
  const userRedux = currentReduxState.user
  const settingsRedux = currentReduxState.settings
  if (userRedux && userRedux.chatLocale) {
    chatLocale = userRedux.chatLocale
  } else if (settingsRedux && settingsRedux.locale) {
    chatLocale = settingsRedux.locale
  }
  try {
    const response = await api.get<null, ChatMessage[]>('/chat/latest', {
      params: {
        locale: overrideLocale || chatLocale,
      },
    })
    const nameList: string[] = []
    response.forEach(row => {
      if (row.user && row.user.name && !nameList.includes(row.user.name)) {
        nameList.push(row.user.name)
      }
    })
    return true
  } catch (err) {
    return false
  }
}
