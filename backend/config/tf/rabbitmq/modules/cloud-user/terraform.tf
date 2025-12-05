terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.53.0"
    }
    rabbitmq = {
      source  = "cyrilgdn/rabbitmq"
      version = "1.8.0"
    }
  }
}
