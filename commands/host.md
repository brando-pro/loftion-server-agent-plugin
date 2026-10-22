---
description: One server in full: state, services, health, its findings with fixes, and what to do next
argument-hint: <host name or id> [org slug]
---
Show one server from LOFTION Server Agent. Arguments: `$ARGUMENTS` (first word = host name or id; second, optional = organization slug when the name exists in several).

1. `get_host` with the host (and `org` when given). If not found, `list_hosts` and suggest the closest names.
2. Summarize: OS, agent version, last heartbeat and status; CPU / RAM / disk now; services down, failed units, backups (last success age), checks failing, containers unhealthy, reboot required.
3. Findings: open critical and high first with the `fix` line each, then medium as one line per kind. Use ids so the user can act on them.
4. `list_actions` for this host when remediation is on, to show recent restarts.
5. End with a short "next" list: concrete fixes (ssh commands from the `fix` fields, or the restart via `restart_service` when remediation is on) and triage actions (`update_finding` with `ack`, `snooze`, `false-positive`, `resolve`). Change nothing without the user's explicit go-ahead.
