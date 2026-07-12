###############################################################################
# variables.tf — Input variables for md-to-docs Cloudflare Pages deployment
###############################################################################

###############################################################################
# Cloudflare Auth
###############################################################################

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Pages:Edit, DNS:Edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID (found in the Cloudflare dashboard URL)"
  type        = string
}

###############################################################################
# Cloudflare Pages Project
###############################################################################

variable "project_name" {
  description = "Name of the Cloudflare Pages project (must be unique per account)"
  type        = string
  default     = "md-to-docs"
}

variable "production_branch" {
  description = "Git branch that triggers production deployments"
  type        = string
  default     = "main"
}

###############################################################################
# GitHub Source
###############################################################################

variable "github_owner" {
  description = "GitHub username or organisation that owns the repository"
  type        = string
}

variable "github_repo_name" {
  description = "GitHub repository name (without owner prefix)"
  type        = string
}

###############################################################################
# Build
###############################################################################

variable "node_version" {
  description = "Node.js version used during the Pages build"
  type        = string
  default     = "20"
}

###############################################################################
# Custom Domain (optional)
###############################################################################

variable "custom_domain" {
  description = "Custom domain to attach to the Pages project (e.g. docs.example.com). Leave empty to skip."
  type        = string
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the custom domain. Required when custom_domain is set."
  type        = string
  default     = ""
}

###############################################################################
# Cloudflare R2 Remote State (used by backend block in main.tf)
###############################################################################

variable "r2_account_id" {
  description = "Cloudflare Account ID used to build the R2 endpoint URL"
  type        = string
  default     = ""
}

variable "r2_access_key_id" {
  description = "R2 Access Key ID (created under Cloudflare > R2 > Manage R2 API Tokens)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "r2_secret_access_key" {
  description = "R2 Secret Access Key"
  type        = string
  sensitive   = true
  default     = ""
}
