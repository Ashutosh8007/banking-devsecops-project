# Security Findings & Remediation

This document tracks security issues identified in the application and how
they were addressed as part of this project's DevSecOps process.

## Finding 1: Unauthenticated Privilege Escalation Endpoint

**Severity:** Critical
**Component:** Backend — `api/admins/owner/create`
**Status:** Resolved — endpoint now gated behind `ALLOW_OWNER_BOOTSTRAP` environment flag (default `false`). See `Backend/controllers/adminsControllers.js` and `Backend/.env.example`.

### Description
The base application ships with a publicly accessible, unauthenticated API
endpoint intended only for bootstrapping the first admin ("owner") account.
The original project documentation acknowledges this and instructs
developers to manually remove or comment out the route after initial setup —
but this relies on a manual step being remembered, which is not a reliable
security control.

If left enabled in production, any unauthenticated user could call this
endpoint to create an owner-level admin account, granting full administrative
access to the banking system.

### Risk
- Complete compromise of admin/owner privileges
- Unauthorized access to user account management, approvals, and financial
  data controls

### Planned Remediation
- Gate the endpoint behind an environment flag (e.g. `ALLOW_OWNER_BOOTSTRAP`),
  disabled by default in production
- Alternatively, replace with a one-time setup script run outside the HTTP
  API (e.g. a seed script executed manually during deployment)
- Add an automated check in CI to fail the build if the endpoint is reachable
  without the bootstrap flag set

## Ongoing Scanning

- **Trivy** scans all container images for known CVEs before deployment
- **OWASP Dependency-Check** scans backend/frontend dependencies for known
  vulnerable packages
- **SonarCloud** performs static analysis for code-level security issues
  (e.g. injection risks, hardcoded secrets)

Findings from automated scans will be appended to this document as they are
triaged.

## Finding 2: Dependency Vulnerabilities (Trivy Scan)

**Severity:** Critical/High (multiple)
**Component:** Backend — npm dependencies
**Status:** Resolved via `package.json` `overrides`

### Description
Trivy scanning of the backend Docker image surfaced multiple CVEs in both
direct and transitive dependencies, including:
- `mongoose@6.13.8` — NoSQL injection via `$nor` sanitization bypass, fixed in `6.13.10`
- `fast-xml-parser` (transitive via AWS SDK/mongodb) — multiple CVEs including
  critical XSS (CVE-2026-25896) and DoS via entity expansion, fixed in `5.11.1`
- `qs` (transitive via express/body-parser) — DoS via array limit bypass, fixed in `6.15.3`
- `body-parser` — DoS via silently disabled size limits, fixed in `1.20.6`
- `ip-address` (transitive via mongodb/socks) — SSRF and XSS, fixed in `10.3.1`
- `lodash` — arbitrary code execution via `_.template`, fixed in `4.18.1`
  (note: `4.18.0` was an incomplete/deprecated fix attempt)

### Remediation
Used npm `overrides` in `package.json` to force patched versions across
transitive dependency chains that could not be fixed via direct `npm install`
alone (dependencies nested several levels deep inside `@aws-sdk/*` and
`express` sub-dependencies).

### Accepted Risk — Development Dependencies
The following remain flagged by `npm audit` but are confirmed to exist only
in `devDependencies` (jest, nodemon, concurrently) and are excluded from the
production Docker image via `npm ci --omit=dev`:
- `brace-expansion`, `minimatch`, `picomatch` — via jest/nodemon glob chains
- `shell-quote` — via concurrently (local dev script runner only)

These pose no production risk since they never enter the runtime container.

## Finding 3: Non-Deterministic Infrastructure via Unpinned AMI

**Severity:** Medium
**Component:** Terraform — `infra/terraform/data.tf`
**Status:** Resolved — AMI pinned to a fixed image ID

### Description
The Terraform configuration used `most_recent = true` when looking up the
base Ubuntu AMI for all EC2 instances. This meant the actual machine image
underlying the infrastructure could silently change between `terraform apply`
runs, entirely outside of version control and without an explicit, reviewed
change to the repository.

This is a configuration-drift and availability risk: a routine, unrelated
`apply` (e.g. updating a security group rule) triggered forced replacement
of all EC2 instances when a new AMI build became available upstream,
causing full infrastructure teardown and rebuild.

### Risk
- Unplanned downtime triggered by an upstream third-party AMI release,
  not by any intentional change in this project
- Loss of instance-level state not otherwise captured in Git or Kubernetes
  (e.g. any manual OS-level configuration outside of IaC)
- Reduced auditability: "what image is actually running" was implicit and
  time-dependent rather than an explicit, reviewable value

### Remediation
Pinned `data.aws_ami.ubuntu` to a specific AMI ID via an `image-id` filter,
with `most_recent = false`. AMI upgrades are now a deliberate, explicit
change to `data.tf`, reviewed like any other infrastructure change, rather
than an implicit side effect of unrelated applies.

### Mitigating Factor
Because application state and configuration were fully defined in Git
(Terraform, Kubernetes manifests, ArgoCD Application) rather than manually
configured on the instances, the unplanned rebuild was fully recoverable
within about an hour, with no loss of application code, configuration, or
deployment history. This incident is a practical demonstration of why
Infrastructure as Code and GitOps matter for resilience.
