# ---------------------------------------------------------------------------
variable "region" {
  type     = string
  nullable = false
}

# ---------------------------------------------------------------------------
provider "aws" {
  region = var.region
}

# ---------------------------------------------------------------------------
# Infra User
resource "aws_iam_user" "deployment_infra_user" {
  name = "deployment-infra-user"
  path = "/infra/"

  tags = {
    "user:BillingId" = "konkerdotdev"
    "user:Service"   = "infra"
  }
}


# ---------------------------------------------------------------------------
# Infra User AccessKey
resource "aws_iam_access_key" "deployment_infra_user_access_key" {
  user = aws_iam_user.deployment_infra_user.name
}

# ---------------------------------------------------------------------------
# SSM Params for AccessKey details
resource "aws_ssm_parameter" "deployment_infra_user_access_key_id_ssm_param" {
  name  = "/infra/deployment-infra-user/access-key-id"
  type  = "SecureString"
  value = aws_iam_access_key.deployment_infra_user_access_key.id
}
resource "aws_ssm_parameter" "deployment_infra_user_access_key_secret_ssm_param" {
  name  = "/infra/deployment-infra-user/access-key-secret"
  type  = "SecureString"
  value = aws_iam_access_key.deployment_infra_user_access_key.secret
}

# ---------------------------------------------------------------------------
output "deployment_infra_user_name" {
  value = aws_iam_user.deployment_infra_user.name
}
output "deployment_infra_user_access_key_id_ssm_param" {
  value = "/infra/deployment-infra-user/access-key-id"
}
output "deployment_infra_user_access_key_secret_ssm_param" {
  value = "/infra/deployment-infra-user/access-key-secret"
}
