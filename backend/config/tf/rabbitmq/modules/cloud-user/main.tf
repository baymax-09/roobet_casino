data "google_secret_manager_secret_version" "read" {
  secret = var.secret
}

resource "rabbitmq_user" "create" {
  name     = var.username
  password = data.google_secret_manager_secret_version.read.secret_data
  tags     = var.tags
}

resource "rabbitmq_permissions" "create" {
  user  = rabbitmq_user.create.name
  vhost = var.vhost

  permissions {
    configure = var.configure
    write     = var.write
    read      = var.read
  }
}
