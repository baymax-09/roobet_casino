import { scopedLogger } from 'src/system/logger'

import { globalFraudCheck } from './global/fraud'
import { globalOfferValidate } from './global/validate'
import { getNetworkPlugin } from './plugins'
import { payoutOffer, integratePipelineFeedback } from './actions'

const gptLogger = scopedLogger('gpt')

export async function offerPipeline(postback: any) {
  const plugin = getNetworkPlugin(postback.network)
  const { user, offer } = await plugin.buildOffer(postback)
  if (!user) {
    return
  }

  const pipeline = [
    globalOfferValidate,
    plugin.pluginOfferValidate,
    globalFraudCheck,
    plugin.pluginFraudCheck,
    payoutOffer,
  ] as const

  const logger = gptLogger('offerPipeline', { userId: user.id })

  for (const pipelineProcess of pipeline) {
    const pipelineFeedback = await pipelineProcess(user, offer)
    logger.info('processing pipeline', {
      name: pipelineProcess.name,
      feedback: pipelineFeedback,
    })
    const { abortPipeline } = await integratePipelineFeedback(
      user,
      offer,
      pipelineFeedback,
    )
    if (abortPipeline) {
      logger.error('aborting pipeline', {
        name: pipelineProcess.name,
        offerId: offer.id,
        network: offer.network,
        feedback: pipelineFeedback,
      })
      break
    }
  }
}
