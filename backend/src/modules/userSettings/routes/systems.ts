import express from 'express'

import { api, type RoobetReq } from 'src/util/api'

import { changeSystemSettingAsUser } from '../lib'
import {
  isUserEditableSettingName,
  isValidSystemSetting,
} from '../lib/settings_schema'

export default function () {
  const router = express.Router()

  router.post(
    '/changeSystemSettingAsUser',
    api.check,
    api.validatedApiCall(async req => {
      const { user } = req as RoobetReq
      const { systemName, settingName, value } = req.body

      if (
        !isValidSystemSetting(systemName, settingName, value) ||
        !isUserEditableSettingName(settingName)
      ) {
        throw new Error()
      }
      await changeSystemSettingAsUser(user.id, systemName, settingName, value)
    }),
  )

  return router
}
