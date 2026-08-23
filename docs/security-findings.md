# Security Findings & Remediation

This document tracks security issues identified in the application and how
they were addressed as part of this project's DevSecOps process.

## Finding 1: Unauthenticated Privilege Escalation Endpoint

**Severity:** Critical
**Component:** Backend — `api/admins/owner/create`
**Status:** Open (remediation planned)

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
