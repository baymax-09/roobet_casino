module "app_user" {
  source = "../modules/local-user"

  username = "app"
  password = var.password

  tags = ["administrator"]

  configure = ".*"
  read      = ".*"
  write     = ".*"
}