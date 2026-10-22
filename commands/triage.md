---
description: What needs attention first across the servers this project's key can see
argument-hint: [org slug or host name, optional]
---
Triage the fleet visible to this project's LOFTION Server Agent key. Scope hint from the user (may be empty): `$ARGUMENTS`

1. `list_orgs`, then `summarize_findings` (pass `org` when the hint names an organization). If every tool answers that the project has no key, stop and point to `/loftion-server-agent:authorize`.
2. For hosts with critical or high findings, `list_findings` with `host` (or `severity: ["critical","high"]` when the fleet is small), compact mode is enough. Use `get_finding` only when the suggested fix is unclear.
3. Also check `list_hosts` for silent hosts (status silent/pending) and reboot_required; a silent host is more urgent than any finding on it.
4. Report, in this order: silent hosts; critical findings with host and fix; high findings grouped by host; one line of totals (hosts, critical, high, medium). Keep it to what needs a decision, no info-level noise.
5. Do not change anything. Offer the next step per item: fix over ssh (if this project has access), acknowledge, snooze, or mark false positive via `/loftion-server-agent:host <name>` or `update_finding`. Ask before any `update_finding`, `set_remediation` or `restart_service`.
