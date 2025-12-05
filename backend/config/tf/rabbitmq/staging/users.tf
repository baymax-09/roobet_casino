module "datadog_user" {
  source = "../modules/cloud-user"
  providers = {
    google = google.roobet-ops
  }

  username = "datadog"
  secret   = "DATADOG_RABBITMQ_PASSWORD"

  configure = ".*"
  read      = ".*"
  write     = ".*"
}

module "fasttrack_user" {
  source = "../modules/cloud-user"

  username = "fasttrack"
  secret   = "rabbitmq-fasttrack"

  read  = "^fasttrack$"
  write = "^fasttrack$"
}

module "app_user" {
  source = "../modules/cloud-user"

  username = "app"
  secret   = "rabbitmq-app"

  configure = ".*"
  read      = ".*"
  write     = ".*"
}
