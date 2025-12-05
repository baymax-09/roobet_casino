resource "rabbitmq_user" "create" {
  name     = var.username
  password = var.password
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
