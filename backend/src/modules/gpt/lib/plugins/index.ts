import { APIValidationError } from 'src/util/errors'
import { type User } from 'src/modules/user/types'

import { type PipelineFeedback } from '../../documents/gpt_pipeline'
import { type Offer } from '../../documents/gpt_history'
import Lootably from './lootably'

export type PluginName = 'lootably'
export type PipelineFunction<O extends Offer> = (
  user: User,
  offer: O,
) => Promise<PipelineFeedback>

export interface GPTPlugin<P extends object, O extends Offer> {
  buildOffer: (postbackFields: P) => Promise<{ user: User | null; offer: O }>
  pluginOfferValidate: PipelineFunction<O>
  pluginFraudCheck: PipelineFunction<O>
}

const plugins = {
  lootably: Lootably,
}

export function getNetworkPlugin(network: keyof typeof plugins) {
  const plugin = plugins[network]
  if (!plugin) {
    throw new APIValidationError('invalid_input')
  }
  return plugin
}
