resource "rabbitmq_queue" "resolveGame" {
  name  = "resolveGame"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "messagingEmitScheduledMessage" {
  name  = "messagingEmitScheduledMessage"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "confirmEthereumTransaction" {
  name  = "confirmEthereumTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "reports" {
  name  = "reports"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "cryptoWithdrawal" {
  name  = "cryptoWithdrawal"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments = {
      "x-queue-type" = "classic"
    }
  }
}

resource "rabbitmq_queue" "outboundEthereumTransaction" {
  name  = "outboundEthereumTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-max-priority" : 2,
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "seonHooks" {
  name  = "seonHooks"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "slotPotatoEventStart" {
  name  = "slotPotatoEventStart"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "fasttrack" {
  name  = "fasttrack"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments = {
      "x-queue-type" = "classic"
    }
  }
}

resource "rabbitmq_queue" "fasttrackDataPipeline" {
  for_each = var.environment == "staging" ? toset([var.environment]) : toset([])
  
  name  = "fasttrack-data-pipeline"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments = {
      "x-queue-type" = "classic"
    }
  }
}

resource "rabbitmq_queue" "deposit" {
  name  = "deposit"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "inboundRippleTransaction" {
  name  = "inboundRippleTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "outboundRippleTransaction" {
  name  = "outboundRippleTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-max-priority" : 2,
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "outboundRippleConfirmation" {
  name  = "outboundRippleConfirmation"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "inboundTronTransaction" {
  name  = "inboundTronTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "outboundTronTransaction" {
  name  = "outboundTronTransaction"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-max-priority" : 2,
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "poolingTron" {
  name  = "poolingTron"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-max-priority" : 2,
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}

resource "rabbitmq_queue" "outboundTronConfirmation" {
  name  = "outboundTronConfirmation"
  vhost = rabbitmq_vhost.default.name

  settings {
    durable     = true
    auto_delete = false
    arguments_json = jsonencode({
      "x-message-ttl" : 86400000,
      "x-queue-type" : "classic"
    })
  }
}
