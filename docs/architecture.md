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
