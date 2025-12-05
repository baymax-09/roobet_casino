import express from 'express'
import moment from 'moment'
import routeCache from 'route-cache'
import numeral from 'numeral'

import { t } from 'src/util/i18n'
import { config, io } from 'src/system'
import {
  getUserForDisplay,
  updateUser,
  getUserById,
  incrementUserField,
} from 'src/modules/user'
import { logAdminAction } from 'src/modules/admin/middleware'
import { recordStats, incrementUniqueStat } from 'src/modules/stats'
import { api, type RouterApp, type RoobetReq } from 'src/util/api'
import { APIValidationError } from 'src/util/errors'
import { acquireLock } from 'src/util/named-lock'
import { isGlobalSystemEnabled } from 'src/modules/siteSettings'
import { ioRoute } from 'src/util/io'
import { addAdminNoteToUser } from 'src/modules/admin'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

import {
  getLatestMessagesByLocale,
  hideMessage,
  hideUserRecentMessages,
  type ChatHistory,
} from '../documents/chat_history'
import { bans } from '../documents/chat_bans'
import { processMessage } from '../lib/process'
import { checkSlowmode } from '../lib/commands'
import { chatModMiddleware } from '../middleware'
import { chatLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/chat', router)

  ioRoute('chat_send', async (data, userId) => {
    let { message, userStatus } = data

    // Check if system wide chat is enabled.
    const isGlobalChatEnabled = await isGlobalSystemEnabled('chat')
    if (!isGlobalChatEnabled) {
      throw new APIValidationError('action__disabled')
    }

    const ban = await bans.checkChatBan(userId)
    if (ban) {
      throw new APIValidationError(ban)
    }

    const user = await getUserById(userId)
    if (!user) {
      throw new APIValidationError('action__disabled')
    }

    await checkSlowmode(user.id)

    if (!message || /^\s+$/.test(message)) {
      throw new APIValidationError(t(user, 'chat__blank_message'))
    }

    if (!user.staff) {
      try {
        await acquireLock([user.id, 'chat'], 3000)
      } catch {
        throw new APIValidationError(t(user, 'chat__delay', ['3']))
      }
    }

    message = message.replace(/<[^>]+>/g, '')

    if (!user.staff) {
      if (message.length > 120) {
        throw new APIValidationError(t(user, 'chat__max_characters'))
      }
    }

    if (!user.twofactorEnabled && config.isProd) {
      throw new APIValidationError(t(user, 'chat__enable_2fa'))
    }

    // TODO clean up the staff logic in this function
    // non-staff members need to have bet at least $500 to send messages
    if (!user.staff && user.hiddenTotalBet < 500 && config.isProd) {
      const convertedWager = await exchangeAndFormatCurrency(500, user)
      throw new APIValidationError(
        t(user, 'chat__convertedWager', [`${convertedWager}`]),
      )
    }

    message = message.replace(
      /@([a-z\d_-]+)/gi,
      '<a href="/?modal=profile&user=$1" class="mention $1" data-user="$1">@$1</a>',
    )

    const chatMessage: ChatHistory & { userId: string } = {
      timestamp: moment().toISOString(),
      message,
      userId: user.id,
      type: 'regular',
      locale: 'en',
      user: await getUserForDisplay(user),
      userStatus,
    }

    await processMessage(chatMessage)
    incrementUserField(chatMessage.userId, 'chatMessages')

    chatLogger('chat_send', { userId: user.id }).info('Chat message sent', {
      message,
    })

    recordStats(user, [{ key: 'chatMessages', amount: 1 }])
    incrementUniqueStat(user, 'uniqueChatUsers', 1)
  })

  router.post(
    '/ban',
    api.check,
    chatModMiddleware,
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { userId, reason } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('No User ID provided')
      }
      if (!reason) {
        throw new APIValidationError('No Reason provided')
      }

      await bans.chatBan(userId, adminUser.name, reason)
      await hideUserRecentMessages(req.body.userId)
      io.emit('delete_all_messages', req.body.userId)
      res.json({ result: true })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} banned player.
        </br>Reason: <span style="font-style: italic">${reason}</span>`,
      )
    }),
  )

  router.post(
    '/unBan',
    api.check,
    chatModMiddleware,
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('No User ID provided')
      }

      await bans.chatUnBan(userId)
      res.json({ result: true })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} un-banned player.`,
      )
    }),
  )

  router.post(
    '/unMute',
    api.check,
    chatModMiddleware,
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { userId } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('No User ID provided')
      }

      await bans.unMute(userId)
      res.json({ result: true })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} un-muted player.`,
      )
    }),
  )

  router.post(
    '/mute',
    api.check,
    chatModMiddleware,
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      const { userId, reason } = req.body
      let { seconds } = req.body
      const { user: adminUser } = req as RoobetReq

      if (!userId) {
        throw new APIValidationError('api__missing_param', ['userId'])
      }
      if (!seconds && !isNaN(seconds)) {
        throw new APIValidationError('api__invalid_param', ['seconds'])
      }
      if (!reason) {
        throw new APIValidationError('api__missing_param', ['reason'])
      }

      seconds = parseInt(seconds)
      if (seconds < 10) {
        throw new APIValidationError('api__invalid_param', ['seconds < 10'])
      }

      await bans.mute(userId, adminUser.name, seconds, reason)
      await hideUserRecentMessages(req.body.userId)
      io.emit('delete_all_messages', userId)
      res.json({ result: true })

      addAdminNoteToUser(
        userId,
        adminUser,
        `<b>ACP Action:</b> ${adminUser.name} muted player for ${numeral(
          seconds / 60,
        ).format('0,0')} minutes.
        </br>Reason: <span style="font-style: italic">${reason}</span>`,
      )
    }),
  )

  router.post(
    '/delete',
    api.check,
    chatModMiddleware,
    logAdminAction,
    api.validatedApiCall(async (req, res) => {
      if (!req.body.id) {
        throw new APIValidationError('api__missing_param', ['id'])
      }

      await hideMessage(req.body.id)
      io.emit('delete_message', req.body.id)
      res.json({ result: true })
    }),
  )

  router.post(
    'deleteAll',
    api.check,
    chatModMiddleware,
    api.validatedApiCall(async (req, res) => {
      if (!req.body.userId) {
        throw new APIValidationError('api__missing_param', ['userId'])
      }

      await hideUserRecentMessages(req.body.userId)
      io.emit('delete_all_messages', req.body.userId)
      res.json({ result: true })
    }),
  )

  router.get(
    '/latest',
    routeCache.cacheSeconds(2),
    api.validatedApiCall(async (req, res) => {
      let locale = req.query.locale || 'en'
      if (!(typeof locale === 'string' && ['en', 'balkan'].includes(locale))) {
        locale = 'en'
      }
      const messages = await getLatestMessagesByLocale(locale)
      res.json(messages.reverse())
    }),
  )

  router.post(
    '/setLocale',
    api.check,
    api.validatedApiCall(async req => {
      const { locale } = req.body
      const { user } = req as RoobetReq
      await updateUser(user.id, { chatLocale: locale })
      return true
    }),
  )
}
