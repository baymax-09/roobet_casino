import {
  type RoutingKey,
  type ExchangeName,
  type Queue,
} from 'src/util/rabbitmq'
import { runWorker } from 'src/util/workerRunner'
import { createConsumer } from 'src/util/rabbitmq/lib/eventConsumer'
import { RippleInboundTransactionHooks } from 'src/modules/crypto/ripple/hooks/inboundTransactions'

import { handler } from './handler'
import {
  type CryptoDepositPayload,
  type CryptoTransaction,
  type InboundTransactionQueueHook,
} from '../../types'
import { type RippleTransaction, type RippleDeposit } from '../../ripple/types'
import {
  type Transaction as TronTransaction,
  type TronDeposit,
} from '../../tron/types'
import { TronInboundTransactionHooks } from '../../tron/hooks/inboundTransactions'

type CryptoInboundQueue = Extract<
  Queue,
  'inboundRippleTransaction' | 'inboundTronTransaction'
>

interface InboundQueueConsumerConfig<T, U> {
  routingKey: RoutingKey<ExchangeName>
  queue: CryptoInboundQueue
  hooks: InboundTransactionQueueHook<T, U>
}

export async function run() {
  runWorker('inboundTransactionQueues', start, false)
}

/** There should be a queue for each crypto network
 * Since our handler function is the same, spin up a consumer for
 * each queue and run them altogether in a single container.
 */
async function start(): Promise<void> {
  const rippleConsumer: InboundQueueConsumerConfig<
    RippleTransaction,
    RippleDeposit
  > = {
    routingKey: 'payments.inboundRippleTransaction',
    queue: 'inboundRippleTransaction',
    hooks: RippleInboundTransactionHooks,
  }
  const tronConsumer: InboundQueueConsumerConfig<TronTransaction, TronDeposit> =
    {
      routingKey: 'payments.inboundTronTransaction',
      queue: 'inboundTronTransaction',
      hooks: TronInboundTransactionHooks,
    }

  const runConsumer = async <
    T extends CryptoTransaction,
    U extends CryptoDepositPayload,
  >(
    consumerConfig: InboundQueueConsumerConfig<T, U>,
    prefetch: number,
  ) => {
    await createConsumer({
      exchangeName: 'payments',
      routingKey: consumerConfig.routingKey,
      queue: consumerConfig.queue,
      handler: handler(consumerConfig.hooks),
      prefetch,
    })
  }
  const inboundQueueConsumers = [rippleConsumer, tronConsumer]

  for (const consumer of inboundQueueConsumers) {
    if (consumer.queue === 'inboundRippleTransaction') {
      await runConsumer(rippleConsumer, 1)
    }

    if (consumer.queue === 'inboundTronTransaction') {
      await runConsumer(tronConsumer, 10)
    }
  }
}
