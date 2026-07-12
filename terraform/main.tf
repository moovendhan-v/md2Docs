###############################################################################
# main.tf — Cloudflare Pages deployment for md-to-docs (React + Vite)
###############################################################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  # Cloudflare R2
  backend "s3" {
    bucket                      = "cybertechmind"
    key                         = "md-to-docs/terraform.tfstate"
    region                      = "auto"
    endpoint                    = "https://542c501fde6fbebe250b276846db8be8.r2.cloudflarestorage.com"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

###############################################################################
# Provider
###############################################################################

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

###############################################################################
# Cloudflare Pages Project
###############################################################################

resource "cloudflare_pages_project" "md_to_docs" {
  account_id        = var.cloudflare_account_id
  name              = var.project_name
  production_branch = var.production_branch

  # NOTE: build_config was removed in Cloudflare provider v4.
  # Set build settings via Cloudflare Dashboard → Pages → your project → Settings → Build & deployments:
  #   Build command : npm run build
  #   Output dir    : dist
  #   Root dir      : / (leave blank)


  source {
    type = "github"

    config {
      owner                         = var.github_owner
      repo_name                     = var.github_repo_name
      production_branch             = var.production_branch
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "custom"
      preview_branch_includes       = ["dev", "staging", "feature/*"]
      preview_branch_excludes       = ["main", "production"]
    }
  }

  # NOTE: deployment_configs was removed in Cloudflare provider v4.
  # Set environment variables (NODE_VERSION, VITE_APP_ENV, etc.) via:
  #   Cloudflare Dashboard → Pages → your project → Settings → Environment Variables
}


###############################################################################
# Custom Domain (optional — only created when var.custom_domain is set)
###############################################################################

resource "cloudflare_pages_domain" "custom" {
  count        = var.custom_domain != "" ? 1 : 0
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.md_to_docs.name
  name         = var.custom_domain # v4 provider uses "name", not "domain"
}

###############################################################################
# DNS record for custom domain (only when zone_id + custom_domain are set)
###############################################################################

resource "cloudflare_record" "pages_cname" {
  count   = var.custom_domain != "" && var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.custom_domain
  content = "${cloudflare_pages_project.md_to_docs.name}.pages.dev"
  type    = "CNAME"
  proxied = true
  ttl     = 1 # Auto TTL when proxied
}
