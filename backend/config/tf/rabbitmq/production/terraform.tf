terraform {
  required_version = "1.5.3"

  backend "gcs" {
    bucket = "roobet-tfstate-backend"
    prefix = "rabbitmq"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.53.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.53.0"
    }
    rabbitmq = {
      source  = "cyrilgdn/rabbitmq"
      version = "1.8.0"
    }
  }
}

provider "google" {
  alias   = "roobet-ops"
  project = "roobet-ops"
  region  = var.region
}

provider "google" {
  project = var.project
  region  = var.region
}

provider "google-beta" {
  project = var.project
  region  = var.region
}

data "google_secret_manager_secret_version" "admin" {
  secret = var.secret
}

provider "rabbitmq" {
  endpoint = var.endpoint
  username = var.username
  password = data.google_secret_manager_secret_version.admin.secret_data
}
