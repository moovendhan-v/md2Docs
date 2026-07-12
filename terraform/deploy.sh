#!/usr/bin/env bash
# deploy.sh — deploy md-to-docs to Cloudflare Pages via Terraform
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh [plan|apply|destroy]
#
# Before running:
#   1. cp terraform.tfvars.example terraform.tfvars   (fill in real values)
#   2. export R2_ACCESS_KEY_ID="..."
#      export R2_SECRET_ACCESS_KEY="..."

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-apply}"

command -v terraform &>/dev/null || { echo "terraform not found. Install it first."; exit 1; }
[[ -f "$DIR/terraform.tfvars" ]] || { echo "terraform.tfvars not found. Copy terraform.tfvars.example first."; exit 1; }
[[ -n "${R2_ACCESS_KEY_ID:-}" && -n "${R2_SECRET_ACCESS_KEY:-}" ]] || { echo "Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars first."; exit 1; }

# Terraform's S3 backend only reads AWS_* env var names, even for R2.
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_REGION="auto"

terraform -chdir="$DIR" init -upgrade

case "$ACTION" in
  plan)
    terraform -chdir="$DIR" plan -var-file="terraform.tfvars"
    ;;
  apply)
    terraform -chdir="$DIR" apply -var-file="terraform.tfvars" -auto-approve
    terraform -chdir="$DIR" output
    ;;
  destroy)
    read -r -p "Type 'yes' to destroy all resources: " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }
    terraform -chdir="$DIR" destroy -var-file="terraform.tfvars" -auto-approve
    ;;
  *)
    echo "Usage: ./deploy.sh [plan|apply|destroy]"
    exit 1
    ;;
esac