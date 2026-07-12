output "pages_project_name" {
  description = "Name of the deployed Cloudflare Pages project"
  value       = cloudflare_pages_project.md_to_docs.name
}

output "pages_subdomain" {
  description = "Auto-generated production Pages URL"
  value       = "${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "dev_pages_subdomain" {
  description = "Auto-generated dev branch Pages URL (branch preview)"
  value       = "dev.${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "production_url" {
  description = "Primary production URL (custom domain if set, otherwise Pages URL)"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "dev_url" {
  description = "Dev branch URL (custom domain if set, otherwise branch Pages URL)"
  value       = var.dev_domain != "" ? "https://${var.dev_domain}" : "https://dev.${cloudflare_pages_project.md_to_docs.name}.pages.dev"
}

output "custom_domain" {
  description = "Attached production custom domain"
  value       = var.custom_domain != "" ? one(cloudflare_pages_domain.custom[*].name) : "not configured"
}

output "project_id" {
  description = "Internal Cloudflare Pages project ID"
  value       = cloudflare_pages_project.md_to_docs.id
}
