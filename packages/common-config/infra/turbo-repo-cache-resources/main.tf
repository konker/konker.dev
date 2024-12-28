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
# The bucket and SSM associated SSM params
resource "aws_s3_bucket" "turborepo_cache_bucket" {
  bucket = "konkerdotdev-turborepo-cache"

  tags = {
    "user:BillingId" = "konkerdotdev"
    "user:Service"   = "infra"
  }
}

resource "aws_ssm_parameter" "turborepo_cache_bucket_name_ssm_param" {
  name  = "/infra/konkerdotdev/turborepoCacheBucketName"
  type  = "String"
  value = aws_s3_bucket.turborepo_cache_bucket.bucket
}
resource "aws_ssm_parameter" "turborepo_cache_bucket_arn_ssm_param" {
  name  = "/infra/konkerdotdev/turborepoCacheBucketArn"
  type  = "String"
  value = aws_s3_bucket.turborepo_cache_bucket.arn
}

# ---------------------------------------------------------------------------
# Permissions
data "aws_iam_policy_document" "turborepo_cache_bucket_policy_document" {
  statement {
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.turborepo_cache_bucket.arn, "${aws_s3_bucket.turborepo_cache_bucket.arn}/*"]
    effect = "Allow"
  }
}

resource "aws_iam_policy" "turborepo_cache_bucket_policy" {
  name   = "turborepo_cache_bucket_policy"
  policy = data.aws_iam_policy_document.turborepo_cache_bucket_policy_document.json
}

resource "aws_iam_user_policy_attachment" "attachment" {
  user       = var.deployment_infra_user_name
  policy_arn = aws_iam_policy.turborepo_cache_bucket_policy.arn
}
