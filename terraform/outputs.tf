###############################################################################
# outputs.tf — Useful deployment outputs
###############################################################################

output "pages_project_name" {
  description = "Name of the deployed Cloudflare Pages project"
  value       = cloudflare_pages_project.md_to_docs.name
}

output "pages_subdomain" {
  description = "Auto-generated Pages URL (always available)"
  value       = "${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "production_url" {
  description = "Primary production URL (custom domain if set, otherwise Pages URL)"
  value = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "custom_domain" {
  description = "Attached custom domain (empty if not configured)"
  value       = var.custom_domain != "" ? one(cloudflare_pages_domain.custom[*].domain) : "not configured"
}

output "project_id" {
  description = "Internal Cloudflare Pages project ID"
  value       = cloudflare_pages_project.md_to_docs.id
}
