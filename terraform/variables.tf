variable "cloudflare_api_token" {
  description = "Cloudflare API token with Pages:Edit, DNS:Edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID (found in the Cloudflare dashboard URL)"
  type        = string
}

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

variable "github_owner" {
  description = "GitHub username or organisation that owns the repository"
  type        = string
}

variable "github_repo_name" {
  description = "GitHub repository name (without owner prefix)"
  type        = string
}

variable "node_version" {
  description = "Node.js version used during the Pages build"
  type        = string
  default     = "20"
}

variable "custom_domain" {
  description = "Full custom domain to attach to the Pages project (e.g. docs.example.com). Leave empty to skip."
  type        = string
  default     = ""
}

variable "custom_domain_record_name" {
  description = "DNS record name — the subdomain label only (e.g. \"docs\" for docs.example.com). Use \"@\" for the apex/root domain."
  type        = string
  default     = "@"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the custom domain. Required when custom_domain is set."
  type        = string
  default     = ""
}
