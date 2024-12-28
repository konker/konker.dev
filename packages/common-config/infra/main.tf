# ---------------------------------------------------------------------------
variable "region" {
  type     = string
  nullable = false
}

# ---------------------------------------------------------------------------
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

# ---------------------------------------------------------------------------
module "base-infra-resources" {
  source = "./base-infra-resources"
  region = "eu-west-1"
}

# ---------------------------------------------------------------------------
module "turbo-repo-cache" {
  source                     = "./turbo-repo-cache-resources"
  region                     = "eu-west-1"
  deployment_infra_user_name = module.base-infra-resources.deployment_infra_user_name
}
