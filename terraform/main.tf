terraform {
  required_version = ">= 1.6" # 

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.22.0"
    }
  }

  backend "s3" {
    bucket  = "cybertechmind"
    key     = "md-to-docs/terraform.tfstate"
    region  = "auto"

    endpoints = {
      s3 = "https://542c501fde6fbebe250b276846db8be8.r2.cloudflarestorage.com"
    }

    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true # R2 doesn't support AWS's extra checksum headers — without this, uploads can fail with XAmzContentSHA256Mismatch
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_pages_project" "md_to_docs" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  # source is read-only in Cloudflare provider v5.
  # Connect GitHub via: Dashboard → Pages → Settings → Builds & deployments → Connect to Git

  build_config = {
    build_command   = "npm run build"
    destination_dir = "dist"
    root_dir        = ""
  }

  deployment_configs = {
    production = {
      environment_variables = {
        NODE_VERSION = var.node_version
      }
    }
    preview = {
      environment_variables = {
        NODE_VERSION = var.node_version
      }
    }
  }
}

resource "cloudflare_pages_domain" "custom" {
  count        = var.custom_domain != "" ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.md_to_docs.name
  name         = var.custom_domain
}

resource "cloudflare_dns_record" "pages_cname" {
  count   = var.custom_domain != "" && var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.custom_domain_record_name
  content = "${cloudflare_pages_project.md_to_docs.name}.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1
}
