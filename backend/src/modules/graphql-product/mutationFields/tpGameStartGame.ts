import { GraphQLError } from 'graphql'
import { arg, enumType, idArg, mutationField, nonNull, objectType } from 'nexus'

import { getUserSelectedDisplayCurrency } from 'src/modules/currency/lib/currencyFormat'
import { DisplayCurrencyList } from 'src/modules/currency/types'
import { gamesLogger } from 'src/modules/tp-games/lib/logger'
import { config } from 'src/system'
import { createHacksawSession } from 'src/vendors/game-providers/hacksaw'
import { getAvailableCurrencies } from 'src/vendors/game-providers/hacksaw/lib'
import { createSlotegratorSlotsSession } from 'src/vendors/game-providers/slotegrator/slots'
import { createSportsbookSession } from 'src/vendors/game-providers/slotegrator/sports'
import {
  YGGDRASIL_LAUNCH_ORG,
  YGGDRASIL_PROVIDER_NAME,
  getYggdrasilLaunchParams,
  getYggdrasilLaunchUrlForUser,
  type YggdrasilLaunchParams,
} from 'src/vendors/game-providers/yggdrasil'

const TPGameStartGame = objectType({
  name: 'TPGameStartGame',
  definition(type) {
    type.string('url')
    type.string('token')
    type.string('partnerId')
    type.list.nonNull.string('supportedCurrencies')
  },
})

const GameMode = enumType({
  name: 'GameMode',
  description: 'The game mode.',
  members: ['live', 'demo'],
})

export const TPGameStartGameMutationField = mutationField('tpGameStartGame', {
  description: 'Start a TP Game; create a URL or token',
  type: TPGameStartGame,
  args: {
    gameIdentifier: nonNull(idArg()),
    mode: arg({
      type: GameMode,
      default: 'demo',
    }),
    gameCurrency: arg({
      type: 'String',
      default: undefined,
    }),
  },
  auth: {
    authenticated: false,
  },
  resolve: async (_, args, { user, countryCode, requestingIp }) => {
    const { gameIdentifier, mode, gameCurrency } = args

    const logger = gamesLogger('tpGameStartGame', {
      userId: user?.id ?? null,
      countryCode: countryCode ?? undefined,
      ip: requestingIp,
    })

    try {
      // --- Sportsbook
      if (user && gameIdentifier === 'slotegrator:sportsbook-1') {
        const { url, token } = await createSportsbookSession(user)

        return { url, token }
      }

      // --- Slotegrator Slots
      if (gameIdentifier.startsWith('slotegrator:')) {
        const sessionResponse = await createSlotegratorSlotsSession(
          mode === 'live' ? user : undefined,
          gameIdentifier,
          gameCurrency,
        )

        if (!sessionResponse.success) {
          throw new GraphQLError(sessionResponse?.error?.message)
        }

        return {
          url: sessionResponse.payload.url,
          supportedCurrencies: sessionResponse.payload.supportedCurrencies,
        }
      }

      // --- Hacksaw
      if (user && gameIdentifier.startsWith('hacksaw:')) {
        const { gameSessionId } = await createHacksawSession(user)
        const displayCurrency = await getUserSelectedDisplayCurrency(user?.id)
        const supportedCurrencies = await getAvailableCurrencies()

        // If user's current currency is not supported, then send list of supported currencies.
        const unsupportedCurrency =
          !!supportedCurrencies &&
          !supportedCurrencies.includes(displayCurrency)

        return {
          token: gameSessionId,
          partnerId: config.hacksaw.partnerId,
          ...(unsupportedCurrency && {
            supportedCurrencies: config.displayCurrencies.filter(
              displayCurrency => supportedCurrencies.includes(displayCurrency),
            ),
          }),
        }
      }

      // --- Yggdrasil
      if (user && gameIdentifier.startsWith(`${YGGDRASIL_PROVIDER_NAME}:`)) {
        const currency = await getUserSelectedDisplayCurrency(user?.id)
        const { intent, region, gameId } = getYggdrasilLaunchParams(
          mode,
          gameIdentifier,
        )
        const params: YggdrasilLaunchParams = {
          key: '',
          gameId,
          currency,
          channel: 'pc',
          lang: user.locale ?? 'en',
          org: YGGDRASIL_LAUNCH_ORG,
        }
        const { url, token } = getYggdrasilLaunchUrlForUser(
          intent,
          region,
          params,
          user,
        )

        // Remove channel from the URL so frontend can set it based on the device
        url.searchParams.delete('channel')

        return {
          url: url.toString(),
          token,
          supportedCurrencies: [...DisplayCurrencyList],
        }
      }
      throw new GraphQLError('game__does_not_exist')
    } catch (error) {
      logger.error('Failed to create game session.', { args }, error)

      if (error instanceof GraphQLError) {
        throw error
      }

      throw new GraphQLError('game__does_not_exist')
    }
  },
})
