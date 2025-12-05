terraform {
  required_version = "1.5.3"

  required_providers {
    rabbitmq = {
      source  = "cyrilgdn/rabbitmq"
      version = "1.8.0"
    }
  }
}

provider "rabbitmq" {
  endpoint = var.endpoint
  username = var.username
  password = var.password
}
