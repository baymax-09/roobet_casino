resource "rabbitmq_exchange" "payments" {
  name  = "payments"
  vhost = rabbitmq_vhost.default.name

  settings {
    type        = "headers"
    durable     = true
    auto_delete = false
  }
}

resource "rabbitmq_exchange" "scheduledEvents" {
  name  = "scheduledEvents"
  vhost = rabbitmq_vhost.default.name

  settings {
    type        = "headers"
    durable     = true
    auto_delete = false
  }
}

resource "rabbitmq_exchange" "events" {
  name  = "events"
  vhost = rabbitmq_vhost.default.name

  settings {
    type        = "headers"
    durable     = true
    auto_delete = false
  }
}
