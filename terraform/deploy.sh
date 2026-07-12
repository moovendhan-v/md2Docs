#!/usr/bin/env bash
# deploy.sh — Bootstrap and deploy md-to-docs to Cloudflare Pages via Terraform
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [plan|apply|destroy]
#
# Prerequisites:
#   - terraform >= 1.5  (brew install terraform)
#   - terraform.tfvars copied from terraform.tfvars.example with real values

set -euo pipefail

###############################################################################
# Config
###############################################################################

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-apply}"

###############################################################################
# Colour helpers
###############################################################################

info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

###############################################################################
# Preflight checks
###############################################################################

info "Working directory : $TERRAFORM_DIR"
info "Action            : $ACTION"

command -v terraform &>/dev/null || err "terraform not found. Install with: brew install terraform"

[[ -f "$TERRAFORM_DIR/terraform.tfvars" ]] || \
  err "terraform.tfvars not found.\n       → Copy terraform.tfvars.example → terraform.tfvars and fill in your values."

###############################################################################
# Read R2 credentials from tfvars (used for -backend-config flags)
###############################################################################

_read_var() {
  grep -E "^${1}\s*=" "$TERRAFORM_DIR/terraform.tfvars" \
    | sed 's/[^=]*=\s*"\(.*\)"/\1/' \
    | tr -d '[:space:]'
}

R2_ACCESS_KEY="$(_read_var r2_access_key_id)"
R2_SECRET_KEY="$(_read_var r2_secret_access_key)"

if [[ -z "$R2_ACCESS_KEY" || "$R2_ACCESS_KEY" == "your-r2-access-key-id" ]]; then
  warn "R2 credentials not set — using local state (remove backend block from main.tf if intentional)."
  BACKEND_FLAGS=()
else
  BACKEND_FLAGS=(
    "-backend-config=access_key=${R2_ACCESS_KEY}"
    "-backend-config=secret_key=${R2_SECRET_KEY}"
  )
fi

###############################################################################
# terraform init
###############################################################################

info "Initialising Terraform (providers + backend)..."
terraform -chdir="$TERRAFORM_DIR" init \
  "${BACKEND_FLAGS[@]}" \
  -upgrade

###############################################################################
# Execute requested action
###############################################################################

case "$ACTION" in
  plan)
    info "Running: terraform plan"
    terraform -chdir="$TERRAFORM_DIR" plan \
      -var-file="terraform.tfvars"
    ;;

  apply)
    info "Running: terraform apply"
    terraform -chdir="$TERRAFORM_DIR" apply \
      -var-file="terraform.tfvars" \
      -auto-approve
    echo ""
    ok "═══════════════════════════════════════════"
    ok " Deployment complete!"
    ok "═══════════════════════════════════════════"
    terraform -chdir="$TERRAFORM_DIR" output
    ;;

  destroy)
    warn "This will REMOVE all managed resources."
    read -r -p "Type 'yes' to confirm: " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { info "Aborted."; exit 0; }
    terraform -chdir="$TERRAFORM_DIR" destroy \
      -var-file="terraform.tfvars" \
      -auto-approve
    ok "All resources destroyed."
    ;;

  *)
    err "Unknown action: '$ACTION'\nUsage: ./deploy.sh [plan|apply|destroy]"
    ;;
esac
