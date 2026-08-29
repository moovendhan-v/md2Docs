# Terraform + Terragrunt Engineering Standards

> This handbook is organization-agnostic and intended as a reusable production-grade engineering standard for Terraform or OpenTofu + Terragrunt. Organization-specific values (repository URLs, account names, tags, bucket names, regions, environments, etc.) should be supplied through configuration rather than hardcoded in the standards.


---

## Supported Platforms

| Component | Supported Version |
|-----------|------------------|
| OpenTofu | `1.10.x` (primary) |
| Terraform | `1.10.x` (compatibility) |
| AWS Provider | `~> 6.2` |
| Terragrunt | `~> 0.80` |
| Go (Terratest) | `1.24` |
| Terratest | latest compatible with Go 1.24 |

| CI/CD Platform | Supported | Recommended For |
|----------------|-----------|-----------------|
| GitHub Actions | ✅ | Any supported environment |
| AWS CodePipeline + CodeBuild | ✅ | Any supported environment |

| Backend | Supported |
|---------|-----------|
| Amazon S3 + S3 native locking | ✅ Primary |
| Terraform Cloud | ❌ Not supported |
| DynamoDB locking | ❌ Replaced by S3 native locking |

---

## 0. Non-Negotiable Rules (Check These First)

Before writing a single line of HCL:

- [ ] Is this a **module** (pure Terraform, reusable blueprint) or **live** (Terragrunt, environment wiring)?
- [ ] Does a module already exist that can be parameterised instead of creating a new one?
- [ ] Is each module doing **exactly one thing**? (Single Responsibility)
- [ ] Are modules wired through **outputs**, never through internal cross-references? (Dependency Inversion)
- [ ] Is the folder path following `account → region → environment → category → resource`?
- [ ] Is state stored per resource unit with **S3 native locking** — never Terraform Cloud, never DynamoDB?
- [ ] Are there **zero** hardcoded account IDs, region strings, secrets, or ARNs in module code?
- [ ] Is the module source in live pinned to an explicit version tag `?ref=vX.Y.Z`?

Fail any of the above → stop and fix before proceeding.

---

## 1. Repository Separation

Two repos, always. Never mix these concerns.

### Repo 1: `terraform-aws-modules`

| CI/CD | Supported |
|-------|-----------|
| GitHub Actions | ✅ Primary |
| AWS CodePipeline | Optional |

- Pure Terraform only — no Terragrunt files, no `terragrunt.hcl`
- Reusable, versioned, parameterised modules
- Released with Git tags (`v1.0.0`, `v2.1.0`)
- Every module has `examples/`, `tests/`, and `CHANGELOG.md`
- Consumed by `infrastructure-live` via `?ref=vX.Y.Z`

### Repo 2: `infrastructure-live`

| CI/CD | Supported |
|-------|-----------|
| GitHub Actions | ✅ |
| AWS CodePipeline | ✅ |

- Pure Terragrunt only — no resource definitions, no `resource {}` blocks
- Environment compositions that wire modules together
- Every `terragrunt.hcl` pins a module version from Repo 1
- This is what gets applied to real AWS accounts

**Rule:** If you find a `resource {}` block in `infrastructure-live`, reject the PR — it belongs in a module.

---

## 2. Supported AWS Services (Module Roadmap)

Every module is built generically. This is the full catalogue.

```
terraform-aws-modules/
│
├── networking/
│   ├── vpc/
│   ├── subnet/
│   ├── security-group/
│   ├── alb/
│   ├── nat-gateway/
│   ├── cloudfront/
│   ├── route53/
│   └── waf/
│
├── compute/
│   ├── ecs-cluster/
│   ├── ecs-service/          ← Generic. NEVER ecs-payment or ecs-user.
│   ├── task-definition/
│   ├── autoscaling/
│   ├── eks-cluster/
│   ├── lambda/
│   └── batch/
│
├── data/
│   ├── rds/
│   ├── aurora/
│   ├── dynamodb/
│   ├── elasticache/
│   ├── opensearch/
│   └── s3/
│
├── security/
│   ├── iam-role/
│   ├── iam-policy/
│   ├── kms/
│   └── secrets-manager/
│
├── integration/
│   ├── sqs/
│   ├── sns/
│   └── eventbridge/
│
├── observability/
│   ├── cloudwatch-alarms/
│   ├── cloudwatch-dashboard/
│   ├── cloudwatch-log-group/
│   └── xray/
│
├── analytics/
│   ├── glue/
│   └── athena/
│
├── api/
│   ├── api-gateway/
│   └── lambda/
│
└── management/
    ├── config/
    ├── organizations/
    └── controltower/
```

### Every Module Must Contain

```
main.tf           # Primary resources only
variables.tf      # All input variables — typed, described, defaulted
outputs.tf        # ARN, ID, DNS name — never internal details
locals.tf         # Naming, tag merging, computed values only
versions.tf       # Pinned terraform + provider version constraints
CHANGELOG.md      # Semantic version history
README.md         # Purpose, inputs, outputs, dependencies, examples, version history, upgrade notes
examples/
  minimal/        # Smallest working config
  complete/       # All features enabled
tests/
  unit_test.go          # Terratest — no real AWS
  integration_test.go   # Terratest — real AWS, runs in CI
```

**Never collapse into one file. Never skip README, CHANGELOG, examples/, or tests/.**

---

## 3. Live Infrastructure Folder Structure (Repo 2)

Gruntwork-standard hierarchy: `account → region → environment → category → resource`

```
infrastructure-live/
├── root.hcl                        # Remote state backend + provider + default tags
├── common.hcl                      # Truly global: org name, cost center, billing tags
├── accounts.json                   # account_name → account_id map
├── Makefile                        # Orchestration entry point
├── scripts/
│   ├── plan-all.sh
│   ├── apply-all.sh
│   ├── destroy-env.sh
│   ├── validate-all.sh
│   └── drift-detect.sh
│
├── prod/                           # ACCOUNT (separate AWS account)
│   ├── account.hcl                 # account_id, account_name
│   ├── _global/                    # Account-level, region-agnostic (IAM, ECR, Route53)
│   │   ├── iam/
│   │   │   └── terragrunt.hcl
│   │   └── ecr/
│   │       └── terragrunt.hcl
│   │
│   ├── ap-south-1/                 # REGION (primary)
│   │   ├── region.hcl              # aws_region, azs
│   │   ├── _global/                # Region-level, env-agnostic (ACM, SNS)
│   │   │   └── acm/
│   │   │       └── terragrunt.hcl
│   │   └── prod/                   # ENVIRONMENT
│   │       ├── env.hcl             # environment, vpc_cidr
│   │       ├── networking/
│   │       │   ├── vpc/
│   │       │   │   └── terragrunt.hcl
│   │       │   ├── alb/
│   │       │   │   └── terragrunt.hcl
│   │       │   └── security-groups/
│   │       │       └── terragrunt.hcl
│   │       ├── shared/
│   │       │   ├── ecs-cluster/
│   │       │   │   └── terragrunt.hcl
│   │       │   └── rds/
│   │       │       └── terragrunt.hcl
│   │       └── services/
│   │           ├── user-service/
│   │           │   └── terragrunt.hcl
│   │           └── payment-service/
│   │               └── terragrunt.hcl
│   │
│   └── us-east-1/                  # SECOND REGION (DR / expansion)
│       ├── region.hcl
│       └── prod/
│           ├── networking/
│           └── services/
│
├── qa/
│   ├── account.hcl
│   └── ap-south-1/
│       ├── region.hcl
│       └── qa/
│           ├── env.hcl
│           ├── networking/
│           ├── shared/
│           └── services/
│
├── dev/
│   ├── account.hcl
│   └── ap-south-1/
│       ├── region.hcl
│       └── dev/
│           ├── env.hcl
│           ├── networking/
│           ├── shared/
│           └── services/
│
└── mgmt/                           # ACCOUNT: CI runners, bastion, monitoring
    ├── account.hcl
    └── ap-south-1/
        ├── region.hcl
        └── mgmt/
            ├── ci-runners/
            └── bastion/
```

### Why Each Layer Exists

| Layer | File | Purpose |
|-------|------|---------|
| Account | `account.hcl` | account_id, account_name — drives role assumption + state bucket naming |
| Region | `region.hcl` | aws_region, AZs — drives provider region + subnet distribution |
| Environment | `env.hcl` | environment name, CIDR — drives resource sizing and naming |
| _global (account) | folder | IAM, ECR, Route53 — exist once per account |
| _global (region) | folder | ACM, SNS — exist once per region regardless of env |
| category | folder | networking / shared / services — logical blast radius grouping |

### State Path Convention

The folder path IS the state key.

```
prod/ap-south-1/prod/networking/vpc/
→ S3 key: prod/ap-south-1/prod/networking/vpc/terraform.tfstate
```

---

## 4. Multi-Account Structure

```
Management Account
    ├── AWS Organizations
    ├── Control Tower
    └── SCPs
         ↓
Security Account
    ├── GuardDuty
    ├── SecurityHub
    └── IAM Identity Center
         ↓
Logging Account
    ├── CloudTrail (org-wide)
    └── S3 log archive
         ↓
Shared Account
    ├── ECR
    ├── Route53 (private)
    └── Transit Gateway
         ↓
Dev Account → Staging Account → Prod Account
```

### IAM Role Assumption Chain

```
CI/CD Identity (OIDC or CodeBuild role)
    → AssumeRole → terraform-plan-role (read-only) in target account  [plan]
    → AssumeRole → terraform-apply-role (write) in target account      [apply, after approval]
```

Never use static IAM user credentials in CI/CD. All authentication is federated.

---

## 5. SOLID Applied to IaC

### S — Single Responsibility
One module solves one problem. Can you name it in three words?

```
✅ ecs-service     — runs one ECS service
✅ alb             — creates one ALB
✅ rds             — creates one RDS instance
❌ application     — creates VPC + ALB + ECS + RDS + IAM (6 responsibilities)
❌ ecs-payment     — service-specific module (parameterise instead)
```

### O — Open/Closed
New AWS features → new variable with safe default. Existing callers untouched.

```hcl
variable "enable_waf" {
  description = "Attach a WAF WebACL to this ALB"
  type        = bool
  default     = false   # ← safe default — existing callers unaffected
}

dynamic "web_acl_arn" {
  for_each = var.enable_waf ? [var.waf_acl_arn] : []
  content { ... }
}
```

### L — Liskov Substitution
Every module that outputs `arn`, `id`, `dns_name` satisfies the same contract.
Callers work regardless of which module provides them.

### I — Interface Segregation
Thin inputs. `ecs-service` takes `target_group_arn` — it doesn't care whether
the ALB is internal, external, or application.

```hcl
# ✅ Thin interface
target_group_arn = dependency.alb.outputs.target_group_arn
```

### D — Dependency Inversion
Modules depend on output abstractions, never on each other's internals.
Wiring happens in `infrastructure-live` only.

```hcl
# ✅ In live — wired through outputs (Dependency Inversion)
dependency "vpc" { config_path = "../../networking/vpc" }
inputs = { vpc_id = dependency.vpc.outputs.vpc_id }

# ❌ Never — ecs-service creating its own VPC
resource "aws_vpc" "this" { ... }   # Must never appear in a service module
```

---

## 6. Versioning Policy

All modules follow semantic versioning strictly.

| Bump | When | Examples |
|------|------|---------|
| **Major** `v2.0.0` | Breaking changes | Variable removal/rename, output removal, resource recreation |
| **Minor** `v2.1.0` | Backwards-compatible additions | New optional variables, new outputs, new resources behind feature flags |
| **Patch** `v2.1.1` | Non-breaking fixes | Bug fixes, docs, tag updates |

**Rule:** Never merge breaking changes without a major version bump.

### Safe Upgrade Path

```
Read CHANGELOG for vX.Y.Z
  ↓
Update ?ref= in dev terragrunt.hcl
  ↓
Run plan — review all changes
  ↓
Zero unexpected destroys? → Apply dev
  ↓
Promote to qa → prod with same review
  ↓
Tag release in infrastructure-live
```

---

## 7. Deprecation Policy

When a module reaches end-of-life:

```
New module (v2) released
  ↓
Old module (v1) marked Deprecated in README + lifecycle badge
  ↓
6-month migration window announced
  ↓
Migration guide published in docs/
  ↓
Old module archived (read-only, no updates)
  ↓
Removed from catalogue after 12 months
```

During the deprecation window: security patches only, no new features.

---

## 8. CHANGELOG Policy

Every module release must update `CHANGELOG.md` following Keep a Changelog format:

```markdown
# Changelog

## [2.3.0] - 2026-08-07

### Added
- `enable_deletion_protection` variable for RDS (default: true in prod)

### Changed
- `instance_class` default changed from `db.t3.micro` to `db.t3.small`

### Deprecated
- `backup_window` — use `preferred_backup_window` instead

### Removed
- `apply_immediately` — removed; always deferred to maintenance window

### Fixed
- Tag propagation on read replicas was missing Environment tag
```

No release tag without a CHANGELOG entry. CI enforces this check.

---

## 9. Provider Version Management

Every module's `versions.tf`:

```hcl
terraform {
  required_version = "~> 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.2"
    }
  }
}
```

- `~>` (pessimistic constraint) — allows patch/minor, blocks major
- Never use `>=` without an upper bound
- `.terraform.lock.hcl` must be committed — it records the exact provider hash used
- Provider upgrades go in a dedicated PR, never bundled with feature work

---

## 10. State Management

### Backend: S3 Native Locking

Terraform 1.10+ supports S3 state locking natively via `use_lockfile`. No DynamoDB required.

```hcl
# root.hcl
remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket       = "tfstate-${local.account_name}"
    key          = "${path_relative_to_include()}/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true   # S3 native locking — no DynamoDB
  }
}
```

Lock file stored as `terraform.tfstate.tflock` alongside the state file in S3.

### State Ownership Rule

```
One AWS resource
    ↓
One Terraform module owns it
    ↓
One state file (.tfstate)
```

Example — ALB module owns all its related resources:
```
ALB module owns:
  ├── aws_lb
  ├── aws_lb_listener
  ├── aws_lb_target_group
  └── aws_security_group (ALB-facing only)
```

No other module may manage a resource owned by the ALB module.

### State Operation Rules

| Operation | Rule |
|-----------|------|
| Backend | S3 + S3 native locking. Never Terraform Cloud. |
| Isolation | One `.tfstate` per `terragrunt.hcl` — never shared state |
| Key | Mirror the folder path exactly |
| Encryption | `encrypt = true` always |
| Backup | `terraform state pull > backup-$(date +%Y%m%d).tfstate` before any surgery |
| Rename | Use `moved {}` blocks — never `terraform state mv` in CI |
| Refactor | `moved {}` + plan must show **0 destroys** before merge |

---

## 11. Root `root.hcl` Template

```hcl
locals {
  account = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  region  = read_terragrunt_config(find_in_parent_folders("region.hcl"))
  env     = read_terragrunt_config(find_in_parent_folders("env.hcl"))

  account_name = local.account.locals.account_name
  account_id   = local.account.locals.account_id
  aws_region   = local.region.locals.aws_region
  environment  = local.env.locals.environment
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket       = "tfstate-${local.account_name}"
    key          = "${path_relative_to_include()}/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  region              = "${local.aws_region}"
  allowed_account_ids = ["${local.account_id}"]

  default_tags {
    tags = {
      ManagedBy   = "terragrunt"
      Environment = "${local.environment}"
      Account     = "${local.account_name}"
      Region      = "${local.aws_region}"
      Project     = local.account_name
    }
  }
}
EOF
}
```

---

## 12. Provider Alias Standards (Multi-Region / Multi-Account)

```hcl
# provider.tf (generated by root.hcl for multi-region stacks)

# Primary region
provider "aws" {
  region = var.aws_region
}

# DR region
provider "aws" {
  alias  = "dr"
  region = var.dr_region
}

# Shared services account (assume role)
provider "aws" {
  alias  = "shared"
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${var.shared_account_id}:role/terraform-apply-role"
  }
}

# Network account (Transit Gateway, VPC peering)
provider "aws" {
  alias  = "network"
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${var.network_account_id}:role/terraform-apply-role"
  }
}
```

Use provider aliases only in `infrastructure-live`. Modules receive provider via `providers = {}` argument — they never define their own provider blocks.

---

## 13. Service `terragrunt.hcl` Template

```hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

dependency "vpc" {
  config_path = "../../networking/vpc"
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    vpc_id             = "vpc-00000000"
    private_subnet_ids = ["subnet-00000001", "subnet-00000002"]
  }
}

dependency "alb" {
  config_path = "../../networking/alb"
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    target_group_arn = "arn:aws:elasticloadbalancing:ap-south-1:123456789012:targetgroup/mock/abc123"
  }
}

dependency "cluster" {
  config_path = "../../shared/ecs-cluster"
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    cluster_arn = "arn:aws:ecs:ap-south-1:123456789012:cluster/mock"
  }
}

# Always pin to a specific version tag — never main or HEAD
terraform {
  source = "git::https://github.com/<your-org>/terraform-modules.git//compute/ecs-service?ref=v2.1.0"
}

inputs = {
  service_name       = "payment-service"
  environment        = local.env.locals.environment
  cluster_arn        = dependency.cluster.outputs.cluster_arn
  vpc_id             = dependency.vpc.outputs.vpc_id
  private_subnet_ids = dependency.vpc.outputs.private_subnet_ids
  target_group_arn   = dependency.alb.outputs.target_group_arn
  container_image    = "123456789012.dkr.ecr.ap-south-1.amazonaws.com/payment:latest"
  desired_count      = 3
  cpu                = 512
  memory             = 1024
}
```

---

## 14. Module API Guidelines

Treat every module as a software library with a public API.

### Input Contract

```hcl
# REQUIRED inputs — no default, callers must provide
variable "service_name" {
  description = "Name of the ECS service. Used in resource naming and tagging."
  type        = string
  nullable    = false

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,32}$", var.service_name))
    error_message = "Must be lowercase alphanumeric + hyphens, 3-33 chars, start with letter."
  }
}

# OPTIONAL inputs — safe defaults, backwards compatible
variable "desired_count" {
  description = "Number of ECS task replicas to run."
  type        = number
  default     = 1
}
```

### Output Contract

```hcl
# Every output documents who consumes it
output "service_arn" {
  description = "ARN of the ECS service. Consumed by: autoscaling, alarms."
  value       = aws_ecs_service.this.id
}

output "task_role_arn" {
  description = "ARN of the ECS task IAM role. Consumed by: s3-access, secrets-access."
  value       = aws_iam_role.task.arn
}
```

### Breaking Change Detection

Document breaking changes explicitly in CHANGELOG before bumping major version:

```markdown
## [3.0.0] - BREAKING CHANGE

### Removed
- `subnet_ids` input — replaced by `private_subnet_ids` and `public_subnet_ids`

### Migration
Replace: `subnet_ids = [...]`
With:    `private_subnet_ids = [...]`
```

---

## 15. Variable Standards

```hcl
variable "environment" {
  description = "Deployment environment — used in resource naming and tagging."
  type        = string
  default     = null
  nullable    = false

  validation {
    condition     = contains(["dev", "qa", "prod"], var.environment)
    error_message = "Must be: dev, qa, or prod."
  }
}
```

**Order:** `description` → `type` → `default` → `nullable` → `validation`

Never leave a variable without `description` and `type`. Reviewer must reject.

---

## 16. count vs for_each

```hcl
# ✅ count — correct for optional singleton (0 or 1)
resource "aws_s3_bucket" "logs" {
  count = var.enable_logs ? 1 : 0
}

# ✅ for_each — correct for named collections with stable identifiers
resource "aws_security_group_rule" "this" {
  for_each = var.ingress_rules
  ...
}

# ❌ count for named collections — index shifting breaks state on item removal
resource "aws_iam_user" "this" {
  count = length(var.users)           # removing index 0 destroys everything above it
  name  = var.users[count.index]
}

# ✅ for_each for named collections
resource "aws_iam_user" "this" {
  for_each = toset(var.users)
  name     = each.key
}
```

---

## 17. Resource Block Ordering

```hcl
resource "aws_ecs_service" "this" {
  # 1. count or for_each FIRST
  count = var.enabled ? 1 : 0

  # 2. All other arguments — alphabetical
  cluster         = var.cluster_arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  name            = local.service_name
  task_definition = aws_ecs_task_definition.this.arn

  network_configuration {
    assign_public_ip = false
    security_groups  = [aws_security_group.this.id]
    subnets          = var.private_subnet_ids
  }

  # 3. tags — last real argument
  tags = local.common_tags

  # 4. depends_on — only when Terraform can't infer the dependency
  depends_on = [aws_iam_role_policy_attachment.this]

  # 5. lifecycle — very end, with justification comment
  lifecycle {
    # Ignore task definition updates pushed by external deployments (CodePipeline)
    ignore_changes = [task_definition]
  }
}
```

---

## 18. Data Sources Policy

```hcl
# ✅ Always acceptable — account/partition metadata
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

# ✅ Acceptable — resource exists outside Terraform (pre-existing)
data "aws_secretsmanager_secret" "db_password" {
  name = "/prod/payment/db-password"
}

# ❌ Avoid — resource is managed by another Terragrunt unit
data "aws_vpc" "main" {
  tags = { Name = "main" }    # hidden dependency, not visible in the DAG
}

# ✅ Use dependency {} instead
dependency "vpc" { config_path = "../../networking/vpc" }
inputs = { vpc_id = dependency.vpc.outputs.vpc_id }
```

---

## 19. locals Policy

```hcl
locals {
  # ✅ Naming conventions
  service_name = "${var.project}-${var.environment}-${var.component}"

  # ✅ Tag merging
  common_tags = merge(var.tags, {
    Component       = var.component
    TerraformModule = "compute/ecs-service"
    Repository      = "terraform-aws-modules"
  })

  # ✅ Simple computed values
  is_prod = var.environment == "prod"
}
```

Avoid complex business logic in `locals`. If a block needs a comment to explain itself, extract to a variable with a description instead.

---

## 20. Naming Convention

All resource names follow: `{project}-{environment}-{component}`

| Resource | Name |
|----------|------|
| VPC | `platform-prod-vpc` |
| ALB | `platform-prod-alb` |
| ECS Cluster | `platform-prod-cluster` |
| RDS | `platform-qa-rds` |
| State Bucket | `tfstate-prod` |

Enforce via module locals:

```hcl
locals {
  name_prefix  = "${var.project}-${var.environment}"
  service_name = "${local.name_prefix}-${var.component}"
}
```

---

## 21. Tag Policy

Every AWS resource must carry all of the following:

| Tag | Example | Source |
|-----|---------|--------|
| `Project` | `platform` | `common.hcl` / root provider |
| `Environment` | `prod` | root provider `default_tags` |
| `Owner` | `platform-team` | module input |
| `CostCenter` | `engineering` | `common.hcl` |
| `ManagedBy` | `terragrunt` | root provider `default_tags` |
| `TerraformModule` | `compute/ecs-service` | module `locals` |
| `Repository` | `terraform-aws-modules` | module `locals` |

Note: Do **not** tag the Terraform version constraint string — it is not the actual running version. If you need build metadata in tags, inject it from CI (`TF_VAR_build_id`).

---

## 22. Outputs Policy

```hcl
# ✅ Consumed by dependent modules
output "vpc_id"             { value = aws_vpc.this.id }
output "private_subnet_ids" { value = aws_subnet.private[*].id }
output "cluster_arn"        { value = aws_ecs_cluster.this.arn }
output "kms_key_arn"        { value = aws_kms_key.this.arn }
output "alb_dns_name"       { value = aws_lb.this.dns_name }

# ✅ Sensitive outputs — always marked
output "db_password" {
  value     = random_password.this.result
  sensitive = true
}

# ❌ Avoid — exposes internal implementation detail
output "security_group_rule_id" { value = aws_security_group_rule.this.id }
```

Ask before every output: *"Will another module or human realistically need this?"*

---

## 23. Module Lifecycle Policy

Document the lifecycle stage in every module `README.md`.

```
Experimental → Internal → Stable → Deprecated → Archived
```

| Stage | Can be used in prod? | SLA |
|-------|---------------------|-----|
| Experimental | No | None |
| Internal | With caution | Best effort |
| Stable | Yes | Security patches + bugfixes |
| Deprecated | Only if already in prod | Security patches only (6 months) |
| Archived | No — migrate off | None |

### Module Quality Levels

| Level | Requirements |
|-------|-------------|
| 🥉 Bronze | README, variables typed, outputs documented |
| 🥈 Silver | + examples/, tests/, CHANGELOG, lifecycle documented |
| 🥇 Gold | + alarms, dashboards, cost reviewed, security scanned, idempotency verified, production-tested |

Modules must reach **Gold** before being deployed to production.

---

## 24. Dependency Graph (Deploy Order)

Terragrunt resolves this automatically via `dependency {}` blocks. Never apply out of order.

```
networking (VPC, subnets, security groups)
    ↓
security (KMS, IAM roles)
    ↓
shared (ECS cluster, RDS, ElastiCache)
    ↓
database (schema migrations, seed data)
    ↓
compute (ECS services, Lambda)
    ↓
services (application-level units)
    ↓
dns (Route53 records, ACM validation)
```

This order also defines destroy order in reverse — DNS first, networking last.

---

## 25. CI/CD Strategy

Both platforms are first-class. Changing CI platform must never require changing module code.

### GitHub Actions

Recommended for: `terraform-aws-modules` repo, dev/qa `infrastructure-live`

Authentication: GitHub OIDC → AWS IAM Role (no static credentials)

```
Pull Request opened
  ↓ fmt → validate → lint → security scan → tests → plan (comment on PR)
Merge to main
  ↓ apply (dev/qa auto, prod requires manual approval job)
```

### AWS CodePipeline + CodeBuild

Recommended for: `infrastructure-live` production deployments

Authentication: CodeBuild Service Role → AssumeRole into target account

```
Git push / tag
  ↓ CodePipeline triggered
  ↓ CodeBuild: fmt → validate → lint → security scan → plan
  ↓ Manual Approval Stage (AWS Console / SNS notification)
  ↓ CodeBuild: terragrunt apply
  ↓ CloudTrail logs every action
```

### Repository Matrix

| Repository | GitHub Actions | CodePipeline |
|------------|----------------|--------------|
| terraform-aws-modules | ✅ Primary | Optional |
| infrastructure-live (dev/qa) | ✅ | ✅ |
| infrastructure-live (prod) | ✅ (with approval) | ✅ Preferred |

### Deployment Policy by Environment

| Environment | GitHub Actions | CodePipeline |
|-------------|----------------|--------------|
| Dev | ✅ Auto-apply on merge | ✅ |
| Staging | ✅ Manual approval | ✅ |
| Prod | ✅ Manual approval | ✅ Preferred |

---

## 26. CI/CD Pipeline Stages

Both CI platforms must implement identical stages in this order:

```
fmt → validate → lint → security scan → unit tests → plan → [approval] → apply
```

| Stage | Tool | Blocks merge? |
|-------|------|--------------|
| fmt | `terraform fmt -check -recursive` + `terragrunt hclfmt` | Yes |
| validate | `terragrunt run-all validate` | Yes |
| lint | `tflint --recursive` | Yes |
| security scan | `checkov -d . --framework terraform` + `trivy config .` | Yes |
| unit tests | `go test ./tests/unit/...` | Yes |
| plan | `terragrunt run-all plan` | Yes (no destroys on prod) |
| approval | Manual gate | Yes (qa + prod) |
| apply | `terragrunt run-all apply` | — |

CI always runs with `--terragrunt-non-interactive`. Parallelism capped at 4.

### Pre-commit Hooks (Local)

Developers must not wait for CI to catch formatting issues. Install pre-commit:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks:
      - id: terraform_fmt
      - id: terragrunt_fmt
      - id: terraform_validate
      - id: tflint
      - id: checkov
  - repo: https://github.com/igorshubovych/markdownlint-cli
    hooks:
      - id: markdownlint
  - repo: https://github.com/adrienverge/yamllint
    hooks:
      - id: yamllint
```

---

## 27. Security Rules

```
❌ Never — access_key or secret_key in provider blocks
❌ Never — secrets in .tfvars committed to git
❌ Never — hardcoded account IDs or ARNs inside module code
❌ Never — output sensitive values without sensitive = true
❌ Never — long-lived IAM user credentials in CI/CD (GitHub Actions or CodePipeline)
❌ Never — module source pinned to main or HEAD
❌ Never — DynamoDB locking (use S3 native locking)

✅ Always — Federated authentication:
           GitHub Actions → OIDC → IAM Role
           CodePipeline/CodeBuild → IAM Service Role → AssumeRole
✅ Always — sensitive = true on secret output variables
✅ Always — secrets sourced from SSM Parameter Store or Secrets Manager
✅ Always — .gitignore covers *.tfvars, .terraform/, *.tfstate, *.tfstate.backup
✅ Always — .terraform.lock.hcl committed to git
✅ Always — MFA for prod account human access
```

---

## 28. Observability Standards

Every module that creates a long-running resource must include:

```hcl
# ✅ Log group with explicit retention
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/ecs/${local.service_name}"
  retention_in_days = var.log_retention_days   # default: 30
  kms_key_id        = var.kms_key_arn
  tags              = local.common_tags
}

# ✅ CPU alarm
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.service_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [var.sns_alert_arn]
  tags                = local.common_tags
}
```

Beyond alarms — Gold-tier modules also include:

- CloudWatch Dashboard (key metrics in one view)
- Metric Filters on log groups (error rate, exception count)
- X-Ray tracing enabled where applicable
- Structured JSON logging enforced via task definition log config

Infrastructure without monitoring is not production-ready. PRs adding services without log groups and at least one alarm are rejected.

---

## 29. Cost Guidelines

Every Stable/Gold module README must document:

| Section | Content |
|---------|---------|
| Estimated monthly cost | Rough range for minimal + production configs |
| Major cost drivers | Which resources dominate the bill |
| Scaling impact | How cost scales with load (linear, step, fixed) |
| Cost optimisation | Spot instances, reserved capacity, right-sizing tips |

Example for `ecs-service`:

```markdown
## Cost

| Config | Estimate |
|--------|---------|
| Minimal (0.25 vCPU, 0.5 GB, 1 task) | ~$5–10/month |
| Production (1 vCPU, 2 GB, 3 tasks) | ~$60–90/month |

Cost drivers: Fargate task hours (dominant), ALB if shared across services.
Optimisation: Use FARGATE_SPOT for non-prod environments (variable: `capacity_provider = "FARGATE_SPOT"`).
```

---

## 30. AWS Service Limits to Know

Document common quotas that affect IaC design:

| Service | Limit | Notes |
|---------|-------|-------|
| VPCs per region | 5 (default) | Request increase before multi-env setup |
| Security group rules (inbound) | 60 | Split large SGs early |
| IAM roles per account | 1,000 | Plan role naming carefully |
| Lambda concurrent executions | 1,000 (default) | Reserve capacity for critical functions |
| ECS services per cluster | 500 | One cluster per env is usually fine |
| ALB target groups | 100 per ALB | Limit services per shared ALB |
| CloudWatch alarms | 10 free, then paid | Budget for alarm costs at scale |

Always check current limits in AWS Service Quotas console before architecture decisions.

---

## 31. Architecture Decision Records (ADR)

Every significant infrastructure decision is recorded in the repo.

```
docs/
└── adr/
    ├── 0001-use-opentofu-over-terraform.md
    ├── 0002-use-terragrunt-for-orchestration.md
    ├── 0003-s3-native-locking-over-dynamodb.md
    ├── 0004-no-terraform-workspaces.md
    ├── 0005-two-repo-separation.md
    ├── 0006-github-actions-and-codepipeline.md
    └── 0007-gruntwork-folder-hierarchy.md
```

ADR format:

```markdown
# ADR-0003: S3 Native Locking over DynamoDB

## Status
Accepted

## Context
State locking previously required a DynamoDB table alongside the S3 bucket,
adding operational overhead, cost, and a second resource to manage.

## Decision
Use S3 native locking (`use_lockfile = true`) available from Terraform 1.10+.
Lock file stored as `terraform.tfstate.tflock` in the same bucket.

## Consequences
- Eliminates DynamoDB table from every account's bootstrap
- Requires Terraform or OpenTofu >= 1.10
- Lock file is visible in S3 Console
```

Future engineers understand *why* immediately, not just *what*.

---

## 32. Reference Architectures

Documented in `docs/reference-architectures/`:

```
docs/reference-architectures/
├── ecs-fargate.md        # VPC → ALB → ECS → Aurora → CloudWatch
├── lambda.md             # API Gateway → Lambda → DynamoDB → CloudWatch
├── three-tier.md         # VPC → ALB → ECS → RDS → ElastiCache
├── multi-account.md      # Management → Security → Logging → Shared → Workloads
└── microservices.md      # Shared cluster, per-service ALB listener rules
```

Each reference architecture shows:
- Full module dependency graph
- Which Terragrunt units compose it
- Estimated cost range
- Scaling characteristics
- Known limitations

---

## 33. Makefile Orchestration

```makefile
ACCOUNT  ?= dev
REGION   ?= ap-south-1
ENV      ?= dev
SERVICE  ?=
PATH_ENV  = $(ACCOUNT)/$(REGION)/$(ENV)

.PHONY: help plan apply svc-plan svc-apply destroy validate fmt lint drift new-module

help:
	@echo ""
	@echo "  make plan          ACCOUNT=prod REGION=ap-south-1 ENV=prod"
	@echo "  make apply         ACCOUNT=prod REGION=ap-south-1 ENV=prod"
	@echo "  make svc-plan      ACCOUNT=prod ENV=prod SERVICE=payment-service"
	@echo "  make svc-apply     ACCOUNT=prod ENV=prod SERVICE=payment-service"
	@echo "  make destroy       ACCOUNT=dev  ENV=dev   (prod is blocked)"
	@echo "  make validate"
	@echo "  make fmt"
	@echo "  make lint"
	@echo "  make drift         ACCOUNT=prod REGION=ap-south-1 ENV=prod"
	@echo "  make new-module    CATEGORY=networking NAME=cloudfront"
	@echo ""

plan:
	bash scripts/plan-all.sh $(PATH_ENV)

apply:
	bash scripts/apply-all.sh $(PATH_ENV)

svc-plan:
	terragrunt plan --terragrunt-working-dir $(PATH_ENV)/services/$(SERVICE)

svc-apply:
	terragrunt apply --terragrunt-working-dir $(PATH_ENV)/services/$(SERVICE)

destroy:
	bash scripts/destroy-env.sh $(ACCOUNT) $(PATH_ENV)

validate:
	terragrunt run-all validate --terragrunt-working-dir $(PATH_ENV)

fmt:
	terraform fmt -recursive .
	terragrunt hclfmt

lint:
	tflint --recursive
	checkov -d . --framework terraform --quiet
	trivy config . --quiet

drift:
	bash scripts/drift-detect.sh $(PATH_ENV)

new-module:
	bash scripts/new-module.sh $(CATEGORY) $(NAME)
```

---

## 34. Shell Script Standards

- `set -euo pipefail` on line 2 — no exceptions
- `"${VAR}"` quoting everywhere
- Hard guard on prod destruction
- `--terragrunt-non-interactive` on all CI runs
- `--terragrunt-parallelism 4` — never unbounded

```bash
#!/usr/bin/env bash
set -euo pipefail
# plan-all.sh
LIVE_PATH="${1:?Usage: $0 <live-path>}"
echo "=== plan-all: ${LIVE_PATH} ==="
terragrunt run-all plan \
  --terragrunt-working-dir "${LIVE_PATH}" \
  --terragrunt-non-interactive \
  --terragrunt-parallelism 4
```

```bash
#!/usr/bin/env bash
set -euo pipefail
# destroy-env.sh
ACCOUNT="${1:?Usage: $0 <account> <live-path>}"
LIVE_PATH="${2:?}"
if [[ "${ACCOUNT}" == "prod" ]]; then
  echo "ERROR: prod destruction is blocked. Use break-glass procedure."
  exit 1
fi
read -rp "Type '${ACCOUNT}' to confirm: " confirm
[[ "${confirm}" == "${ACCOUNT}" ]] || { echo "Aborted."; exit 1; }
terragrunt run-all destroy \
  --terragrunt-working-dir "${LIVE_PATH}" \
  --terragrunt-non-interactive \
  --terragrunt-parallelism 2
```

```bash
#!/usr/bin/env bash
set -euo pipefail
# drift-detect.sh — run scheduled (daily prod, weekly dev/qa)
LIVE_PATH="${1:?Usage: $0 <live-path>}"
echo "=== Drift detection: ${LIVE_PATH} $(date -u) ==="
terragrunt run-all plan \
  --terragrunt-working-dir "${LIVE_PATH}" \
  --terragrunt-non-interactive \
  --terragrunt-parallelism 4 \
  -detailed-exitcode || true   # exit 2 = drift detected; alert, don't fail CI
```

```bash
#!/usr/bin/env bash
set -euo pipefail
# new-module.sh — scaffold a new module from template
CATEGORY="${1:?Usage: $0 <category> <name>}"
NAME="${2:?}"
DEST="terraform-aws-modules/${CATEGORY}/${NAME}"
if [[ -d "${DEST}" ]]; then
  echo "ERROR: ${DEST} already exists."
  exit 1
fi
cp -r .module-template "${DEST}"
sed -i "s/MODULE_NAME/${NAME}/g" "${DEST}/README.md"
sed -i "s/MODULE_CATEGORY/${CATEGORY}/g" "${DEST}/README.md"
echo "✅ Scaffolded: ${DEST}"
echo "   Next: implement main.tf, update variables.tf, outputs.tf, CHANGELOG.md"
```

---

## 35. Drift Detection

Run `make drift` on a schedule:

| Environment | Frequency |
|-------------|-----------|
| prod | Daily |
| qa | Weekly |
| dev | Weekly or on-demand |

Exit code 2 from plan = drift detected. Alert via SNS → Slack/email. Never auto-apply drift — it must go through a PR.

**When drift is detected:**
1. Identify which resource changed
2. Decide: revert (re-apply Terraform) or codify (update module)
3. Never accept drift silently

---

## 36. Recovery Procedures

### Deleted State File
```bash
# If versioning is enabled on S3 (it must be):
aws s3api list-object-versions \
  --bucket tfstate-prod \
  --prefix prod/ap-south-1/prod/networking/vpc/terraform.tfstate

# Restore previous version
aws s3api restore-object --bucket tfstate-prod \
  --key prod/ap-south-1/prod/networking/vpc/terraform.tfstate \
  --version-id <version-id>
```

### Broken S3 Lock
```bash
# S3 native lock file:
aws s3 rm s3://tfstate-prod/prod/ap-south-1/prod/networking/vpc/terraform.tfstate.tflock
# Only do this if you are certain no apply is in progress
```

### Failed Apply (Partial State)
```bash
terraform state pull > backup-$(date +%Y%m%d-%H%M%S).tfstate
terraform state list                      # identify what was created
# Fix the root cause in code
terragrunt apply                          # re-apply is safe — Terraform is idempotent
```

### Failed Import
```bash
# The import created state but code doesn't match:
terraform plan -detailed-exitcode
# If exit code 2: update code to match the real resource
# Never modify the real resource to match the code
```

### Provider Crash Mid-Apply
```bash
# Pull current state
terraform state pull > pre-recovery.tfstate
# Check what terraform thinks exists
terraform state list
# Re-run apply — idempotency handles the rest
terragrunt apply
```

---

## 37. Import Policy

```
terraform import aws_vpc.this vpc-0abc12345
  ↓
terraform plan -detailed-exitcode
  ↓
Exit code 0 (zero changes)?
  ↓
Merge PR — resource is now managed
```

Never merge an import without a zero-change plan. If the plan shows changes, reconcile the code to match the real resource — not the other way around.

---

## 38. Destroy Policy

| Situation | Procedure |
|-----------|-----------|
| Dev environment | `make destroy ACCOUNT=dev` (interactive confirmation) |
| Staging environment | `make destroy ACCOUNT=qa` + peer review |
| Prod environment | **Blocked in scripts** — break-glass: manual AWS Console + MFA + documented approval |
| Before any destroy | Pull and backup state file |
| After destroy | Verify no orphaned resources in AWS Console |

---

## 39. Git Standards

| Practice | Rule |
|----------|------|
| Commits | Conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:` |
| Pull requests | PRs only — no direct push to `main` |
| CODEOWNERS | Platform team owns `root.hcl`, `account.hcl`, `region.hcl`, CI workflows |
| Branch protection | `main` requires: all CI checks pass + 1 approval + no force push |
| Module releases | Git tag `vX.Y.Z` on `main` after merge — never tag a branch |
| CHANGELOG | Updated in same PR as the code change — never retroactively |

---

## 40. Production Readiness Checklist

A module is not production-ready until every box is checked:

```
Documentation
  [ ] README with purpose, inputs, outputs, dependencies
  [ ] CHANGELOG maintained from v0.1.0
  [ ] Architecture diagram or module dependency diagram
  [ ] Upgrade notes for every major version
  [ ] Lifecycle stage documented (must be Stable)

Code Quality
  [ ] terraform fmt clean
  [ ] tflint clean (no warnings)
  [ ] checkov clean (no HIGH/CRITICAL)
  [ ] trivy config clean

Testing
  [ ] examples/minimal works end-to-end
  [ ] examples/complete works end-to-end
  [ ] Terratest unit tests pass
  [ ] Terratest integration tests pass
  [ ] Idempotency verified (plan after apply = zero changes)

Operational
  [ ] CloudWatch log group with retention
  [ ] At minimum one CloudWatch alarm with SNS action
  [ ] Structured logging enforced
  [ ] Tags: all 7 required tags present
  [ ] Cost documented in README
  [ ] AWS service limits noted

Security
  [ ] No hardcoded credentials or account IDs
  [ ] Sensitive outputs marked sensitive = true
  [ ] IAM least privilege — no * actions without justification
  [ ] KMS encryption for data at rest
  [ ] Security group rules scoped (no 0.0.0.0/0 ingress without explicit justification)

Versioning
  [ ] SemVer tag applied
  [ ] .terraform.lock.hcl committed
  [ ] Source pinned to version tag in all live configs
  [ ] Rollback procedure documented
```

---

## 41. PR Review Checklist

Reject any PR that violates:

- [ ] Module does more than one thing → reject
- [ ] `resource {}` block in `infrastructure-live` → reject
- [ ] Module source not pinned to version tag → reject
- [ ] Variable missing `description` or `type` → reject
- [ ] Hardcoded secret, account ID, or static credential → reject immediately
- [ ] `count` used for named collections (use `for_each`) → fix
- [ ] `lifecycle` block without explanation comment → fix
- [ ] Output exposes internal implementation detail → fix
- [ ] `dependency {}` blocks missing `mock_outputs` → fix
- [ ] DynamoDB lock used instead of S3 native locking → reject
- [ ] README missing, `examples/` missing, or `tests/` missing → fix before merge
- [ ] CHANGELOG not updated → fix before merge
- [ ] Module lifecycle stage not documented → fix
- [ ] CloudWatch log group or alarm missing for a new service → fix
- [ ] `terraform fmt` not run → CI blocks it, flag in review
- [ ] `TerraformVersion` tag hardcoded as constraint string → fix (inject from CI or omit)

---

## 42. What NOT to Use

| Thing | Why Not |
|-------|---------|
| Terraform Cloud | S3 + S3 native locking + Terragrunt covers all the same needs with full control and no vendor cost |
| DynamoDB for state locking | Replaced by S3 native `use_lockfile = true` (Terraform or OpenTofu 1.10+) |
| `terraform workspace` | Doesn't isolate state cleanly at scale — use folder-per-environment |
| Service-specific modules (`ecs-payment`) | Creates coupling — parameterise `ecs-service` instead |
| `main` or `HEAD` as module source ref | Non-deterministic builds — always `?ref=vX.Y.Z` |
| Nested modules inside modules | Creates hidden dependencies — compose in live, not in modules |
| Manual `terraform apply` in prod | All applies via CI/CD pipeline on merge to main |
| Data sources for Terragrunt-managed resources | Hidden DAG dependencies — use `dependency {}` outputs |
| Complex business logic in `locals` | Extract to typed variables with descriptions |
| `TerraformVersion` tag with constraint string | Not the actual version — inject from CI metadata if needed |
| Static IAM user credentials in CI | Use OIDC (GitHub Actions) or IAM Service Roles (CodePipeline) |

---


---

# Dependency Management & Architecture

## Gruntwork Philosophy

This handbook follows the native **Terragrunt + Gruntwork** approach.

**Single Source of Truth**

- The directory structure defines ownership and architectural boundaries.
- Each `terragrunt.hcl` defines its own dependencies using native `dependency {}` blocks.
- Dependency information must **not** be duplicated in YAML, JSON, spreadsheets, or other manifests.
- Infrastructure dependencies must have exactly one source of truth.

---

## Architectural Layers

The recommended logical order is:

```text
Bootstrap
    ↓
Organization
    ↓
Networking
    ↓
Security
    ↓
Governance
    ↓
Shared Infrastructure
    ↓
Data
    ↓
Compute
    ↓
Services
    ↓
Observability
```

Projects may omit layers (for example Governance or Data) if they are not required, but the dependency direction must always remain from foundational layers toward higher-level layers.

---

## Dependency Rules

Modules may depend only on:

- Modules within the same layer (where appropriate)
- Modules in lower (foundational) layers

Modules must never depend on higher-level layers.

Allowed:

```text
Networking
      ↓
Security
      ↓
Shared
      ↓
Compute
      ↓
Services
      ↓
Observability
```

Forbidden:

```text
Services
     ↓
Networking

Networking
     ↓
Services
```

Circular dependencies are never permitted.

---

## Terragrunt Dependencies

Use native dependency blocks.

```hcl
dependency "vpc" {
  config_path = "../../networking/vpc"
}

dependency "cluster" {
  config_path = "../../shared/ecs-cluster"
}
```

Do not introduce a second dependency definition in YAML or JSON.

---

## CI Dependency Validation

CI/CD should automatically validate the dependency graph by:

1. Discovering every `terragrunt.hcl`
2. Reading every native `dependency {}` block
3. Building a directed graph
4. Detecting:
   - Circular dependencies
   - Missing dependency targets
   - Layer violations
5. Failing the pipeline if any rule is violated

Terragrunt remains the authoritative dependency source.

---

## Extending the Architecture

New layers may be introduced without redesigning the platform.

Example:

```text
Bootstrap
    ↓
Organization
    ↓
Networking
    ↓
Security
    ↓
AWS Config
    ↓
Shared Infrastructure
    ↓
Data
    ↓
Compute
    ↓
Services
    ↓
Observability
```

Only modules that legitimately depend on the new layer should be updated.

---

## Testing

Terratest, unit tests, and integration tests validate infrastructure behaviour.

They do **not** prevent dependency cycles.

Dependency cycles are prevented through:

- Good architectural layering
- Native Terragrunt dependency design
- Automated graph validation in CI/CD
- Engineering review
