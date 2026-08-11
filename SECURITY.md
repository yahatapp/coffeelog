# Security policy

## Reporting a vulnerability

Do not open a public issue for suspected vulnerabilities or exposed credentials.
Use GitHub's private vulnerability reporting for this repository. If that feature is
not available, contact the repository owner privately.

Include the affected component, reproduction steps, impact, and any suggested
mitigation. Never include a live secret; revoke or rotate exposed credentials first.

## Repository controls

Repository administrators should protect `main`, require the `Verify` status check
and pull-request review, prevent force pushes and branch deletion, enable secret
scanning with push protection, and require approval for the `production` environment.

GitHub Actions use read-only default permissions and immutable commit SHAs. Runtime
credentials must be stored in GitHub environment secrets or Cloudflare secrets, never
in source files or workflow YAML.
