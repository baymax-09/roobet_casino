import React from 'react'
import { useHistory } from 'react-router'

import { useToasts } from 'common/hooks'

const authNotificationParams = [
  {
    key: 'authSuccesses',
    type: 'success',
  },
  {
    key: 'authErrors',
    type: 'error',
  },
]

const AuthNotifications: React.FC = () => {
  const { toast } = useToasts()
  const history = useHistory()

  const urlParams = new URLSearchParams(window.location.search)
  for (const authNotificationParam of authNotificationParams) {
    if (urlParams.has(authNotificationParam.key)) {
      const rawString = urlParams.get(authNotificationParam.key)
      const isError = authNotificationParam.type === 'error'
      if (rawString && rawString.length) {
        const authNotifications = JSON.parse(rawString)
        if (Array.isArray(authNotifications)) {
          authNotifications.map(authNotification => {
            if (isError) {
              return toast.error(authNotification)
            } else {
              urlParams.delete(authNotificationParam.key)
              history.replace(`${location.pathname}?${urlParams}`)
              return toast.success(authNotification)
            }
          })
        } else {
          isError
            ? toast.error(authNotifications)
            : toast.success(authNotifications)
        }
      }
    }
  }

  return <></>
}

export default React.memo(AuthNotifications)
