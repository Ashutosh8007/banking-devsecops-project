# Architecture

## Overview

This project deploys a MERN-stack banking application through a fully automated,
security-gated CI/CD pipeline, ending in a GitOps-managed Kubernetes deployment
with full observability.

## Components

### Application
- **Frontend:** React (Vite, Redux Toolkit, Tailwind CSS)
- **Backend:** Node.js / Express REST API
- **Database:** MongoDB
- **Auth:** JWT-based, role hierarchy (user / admin / owner)

### CI/CD (GitHub Actions)
1. Checkout code
2. Install dependencies, run build/tests
3. Trivy scan — container image vulnerabilities
4. OWASP Dependency-Check — dependency vulnerabilities
5. SonarCloud — static code analysis, code quality/security gate
6. Build Docker images, push to Docker Hub (on gate pass only)
7. Update Kubernetes manifests (image tag) in Git — triggers ArgoCD sync

### Infrastructure (AWS EC2, 4 instances)
1. **k3s + Helm** — hosts the application cluster (frontend, backend, MongoDB pods)
2. **ArgoCD** — separate lightweight cluster, registered against the app cluster
   as a remote target; watches the Git manifests repo and syncs changes
3. **Prometheus + Grafana** — metrics collection and dashboards
4. **ELK Stack** — centralized logging (Elasticsearch, Logstash, Kibana)

### AI Agent Layer
LangChain + Ollama-based agents supporting the pipeline:
- **Security Triage Agent** — classifies Trivy/OWASP findings by severity
- **Deployment Gatekeeper Agent** — blocks deployment on failed security gate
- **Transaction Anomaly Agent** — flags suspicious transaction patterns in logs
- **Incident/Monitoring Agent** — summarizes Prometheus/Grafana alerts
- **ChatOps Agent** — answers pipeline/deployment status queries

## Data Flow

Developer push → GitHub Actions (build, test, scan, gate) → Docker Hub →
Git manifest update → ArgoCD detects change → syncs to k3s → app running →
Prometheus/Grafana + ELK observe app and infra → AI agents monitor pipeline
and runtime signals

## Security Model

- No secrets committed to Git — managed via GitHub Actions secrets / k8s secrets
- All images scanned before deployment; failed scans block the pipeline
- RBAC enforced at both the application layer (user/admin/owner roles) and
  Kubernetes layer (namespaces, service accounts)
- Known vulnerabilities in the base application tracked and remediated —
  see [security-findings.md](security-findings.md)

## Incident Log

### Incident 1: Unpinned AMI Caused Full Infrastructure Replacement

**Date:** 2026-09-12
**Severity:** Medium (no data loss on app layer due to GitOps recovery; caused unplanned downtime and rework)

**What happened:**
The `data "aws_ami" "ubuntu"` block in `infra/terraform/data.tf` used `most_recent = true`
to dynamically fetch the latest Ubuntu 22.04 AMI on every `terraform plan`/`apply`.
After a period of inactivity, Canonical published a new AMI build. On the next
`terraform apply` (intended only to update a security group rule for a changed
local IP), Terraform detected the AMI ID had changed and treated this as a
forced replacement for all four EC2 instances, since `ami` cannot be updated
in-place on an existing instance.

All 4 instances (k3s app cluster, ArgoCD, monitoring, ELK) were destroyed and
recreated with new IDs, new IPs, and empty disks. This took down the running
k3s cluster, the deployed application, and the ArgoCD installation.

**Why it wasn't worse:**
Because the project follows Infrastructure as Code and GitOps practices,
nothing critical was actually lost:
- Terraform config, Kubernetes manifests, and the ArgoCD Application
  definition were all already committed to Git.
- Rebuilding meant re-running documented install steps (k3s install,
  manifest apply, ArgoCD install, cluster registration) rather than manual
  reconstruction from memory.
- Full recovery (new infra provisioned, app redeployed, ArgoCD reinstalled
  and re-synced) took under an hour.

**Root cause:**
Using `most_recent = true` for a long-lived AMI data source makes
infrastructure non-deterministic across time. Any `terraform apply` — even
one unrelated to compute resources — can trigger unplanned instance
replacement whenever the upstream AMI publisher releases a new build.

**Fix:**
Pinned the AMI to a specific, known-good image ID in `data.tf`, with an
explicit comment explaining why `most_recent` is intentionally not used.
Future AMI upgrades must now be done deliberately (updating the pinned ID),
not implicitly on every apply.

**Lesson learned:**
For any long-lived infrastructure, avoid "always latest" data sources for
resources that cannot be updated in-place (AMIs, some AMI-like base images).
Pin versions explicitly and upgrade on a deliberate schedule, treating the
upgrade itself as a planned, reviewed change — not a side effect of an
unrelated apply.
