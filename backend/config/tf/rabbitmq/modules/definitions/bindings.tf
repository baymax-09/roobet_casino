resource "rabbitmq_binding" "events_fasttrack" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name

  destination      = rabbitmq_queue.fasttrack.name
  destination_type = "queue"
  routing_key      = ""
  arguments = {
    "cc"      = rabbitmq_queue.fasttrack.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_fasttrackDataPipeline" {
  for_each = var.environment == "staging" ? toset([var.environment]) : toset([])
  
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name

  destination      = rabbitmq_queue.fasttrackDataPipeline[each.key].name
  destination_type = "queue"
  routing_key      = ""
  arguments = {
    "cc"      = rabbitmq_queue.fasttrack.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_confirmEthereumTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name

  destination      = rabbitmq_queue.confirmEthereumTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.confirmEthereumTransaction.name}"
  arguments = {
    "cc"      = rabbitmq_queue.confirmEthereumTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_cryptoWithdrawal" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.cryptoWithdrawal.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.cryptoWithdrawal.name}"
  arguments = {
    "cc"      = rabbitmq_queue.cryptoWithdrawal.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_outboundEthereumTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.outboundEthereumTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.outboundEthereumTransaction.name}"
  arguments = {
    "cc"      = rabbitmq_queue.outboundEthereumTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_reports" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.reports.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.reports.name}"
  arguments = {
    "cc"      = rabbitmq_queue.reports.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_resolveGame" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.resolveGame.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.resolveGame.name}"
  arguments = {
    "cc"      = rabbitmq_queue.resolveGame.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_scheduledEvents_messagingEmitScheduledMessage" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.scheduledEvents.name
  destination_type = "exchange"
  routing_key      = "events.${rabbitmq_exchange.scheduledEvents.name}"
  arguments = {
    "cc"      = rabbitmq_queue.messagingEmitScheduledMessage.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_scheduledEvents_slotPotatoEventStart" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.scheduledEvents.name
  destination_type = "exchange"
  routing_key      = "events.${rabbitmq_exchange.scheduledEvents.name}"
  arguments = {
    "cc"      = rabbitmq_queue.slotPotatoEventStart.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_seonHooks" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.seonHooks.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_queue.seonHooks.name}"
  arguments = {
    "cc"      = rabbitmq_queue.seonHooks.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_deposit" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.deposit"
  arguments = {
    "cc"      = "deposit"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_inboundRippleTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.inboundRippleTransaction"
  arguments = {
    "cc"      = "inboundRippleTransaction"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_outboundRippleTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.outboundRippleTransaction"
  arguments = {
    "cc"      = "outboundRippleTransaction"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_outboundRippleConfirmation" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.outboundRippleConfirmation"
  arguments = {
    "cc"      = "outboundRippleConfirmation"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_inboundTronTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.inboundTronTransaction"
  arguments = {
    "cc"      = "inboundTronTransaction"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_outboundTronTransaction" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.outboundTronTransaction"
  arguments = {
    "cc"      = "outboundTronTransaction"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_poolingTron" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.poolingTron"
  arguments = {
    "cc"      = "poolingTron"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "events_payments_outboundTronConfirmation" {
  source = rabbitmq_exchange.events.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_exchange.payments.name
  destination_type = "exchange"
  routing_key      = "payments.outboundTronConfirmation"
  arguments = {
    "cc"      = "outboundTronConfirmation"
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "scheduledEvents_messagingEmitScheduledMessage" {
  source = rabbitmq_exchange.scheduledEvents.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.messagingEmitScheduledMessage.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.scheduledEvents.name}"
  arguments = {
    "cc"      = rabbitmq_queue.messagingEmitScheduledMessage.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "scheduledEvents_slotPotatoEventStart" {
  source = rabbitmq_exchange.scheduledEvents.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.slotPotatoEventStart.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.scheduledEvents.name}"
  arguments = {
    "cc"      = rabbitmq_queue.slotPotatoEventStart.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_deposit" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.deposit.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.deposit.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_inboundRippleTransaction" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.inboundRippleTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.inboundRippleTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_outboundRippleTransaction" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.outboundRippleTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.outboundRippleTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_outboundRippleConfirmation" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.outboundRippleConfirmation.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.outboundRippleConfirmation.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_inboundTronTransaction" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.inboundTronTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.inboundTronTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_outboundTronTransaction" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.outboundTronTransaction.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.outboundTronTransaction.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_poolingTron" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.poolingTron.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.poolingTron.name
    "x-match" = "any"
  }
}

resource "rabbitmq_binding" "payments_outboundTronConfirmation" {
  source = rabbitmq_exchange.payments.name
  vhost  = rabbitmq_vhost.default.name


  destination      = rabbitmq_queue.outboundTronConfirmation.name
  destination_type = "queue"
  routing_key      = "events.${rabbitmq_exchange.payments.name}"
  arguments = {
    "cc"      = rabbitmq_queue.outboundTronConfirmation.name
    "x-match" = "any"
  }
}
