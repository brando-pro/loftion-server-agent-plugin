---
name: loftion-server-agent
description: Working with LOFTION Server Agent (server monitoring + security findings) through its MCP tools. Use whenever the user asks about their servers, findings, CVEs, security updates, service state, backups, sites, alerts, or wants something fixed on a monitored host; also when an mcp__loftion-server-agent__* tool is about to be called.
---

# LOFTION Server Agent

The panel watches Linux servers through a read-only agent and finds what needs a human: security updates, end-of-life frameworks, exploited CVEs, failed units, thresholds, website problems. The MCP server gives you the same view as the panel, scoped to the API key of **this project** (one organization, several, or everything the key's owner can see).

## Start with the summary, not the list

1. `list_orgs` once: which organizations this key sees and how many hosts each has.
2. `summarize_findings`: counts per host × severity × kind. This is the fleet in one screen.
3. `list_findings` only narrowed: `host`, `kind`, `severity: ["critical","high"]`. It is paged (50 by default) and compact: no raw detail. Follow `next_offset` or narrow further; never ask for everything across a fleet, the output does not fit.
4. `get_finding {id}` for the raw scanner detail of one finding; `get_host` for everything about one server (services, containers, disks, health, its findings with ids). The long lists come only on request: `include: ["units","ports","top"]`.

Severities: critical pages the owner immediately; high and medium go into the daily digest; info is noise filtered on purpose (for example fixes that exist only in a paid OS tier). Scan findings never page except actively exploited CVEs (`kev-*`); a security update seen today is `info` until unattended-upgrades had 24 h to apply it.

## Closing findings honestly

- Metric findings (CPU, disk, services down, failed units, checks) resolve **by themselves** about a minute after the cause is gone. Scan findings (packages, CVEs, EOL) resolve after the next nightly scan, or sooner with `run_scan {host}` (read-only, takes a few minutes).
- `update_finding` actions: `ack` = seen, keep open, stop alerting; `snooze {days}` = hide for a while; `false-positive` = tell the team it is wrong; `resolve` = you fixed it, close now (if the next scan still sees the problem a new finding opens); `reopen`. Several at once: `update_findings {ids, action, note}`.
- Always pass a `note` saying what you did or why. Notes show up in the panel and in Telegram for the whole team.
- Do not mark `resolve` on something you did not fix or verify. "I ran apt upgrade on the host" is a reason; "looks old" is not.

## Fixing things: what the API can and cannot do

- The agent **reads**. It does not execute commands, read logs or config files, or change anything. Through the API you get state and findings with a suggested `fix` line.
- The only remote action is `restart_service {host, unit}`, and only on hosts where remediation is on (`set_remediation {host, on: true, units: ["fail2ban","php8.3-fpm"]}`, logged). Prefer an allowlist of safe units (cron workers, fail2ban, php-fpm) over blanket access; ask the user before switching it on.
- Everything else (apt upgrade, editing configs, reading journals) is **ssh work** in the user's own environment. Use the finding's `fix` text as the plan, do it over ssh if the project gives you access, verify, then `update_finding` with `resolve` or `ack` and a note.
- `set_monitored_services` changes which units raise an alert when down; `update_host` renames, tags or adds operator notes; `create_rule` / `update_rule` change thresholds. These are configuration changes: confirm with the user when the intent is not explicit.

## Keys and scope

- Each project authorizes separately: `/loftion-server-agent:authorize <lsak_…>` writes the key to `.claude/loftion-server-agent.key` (gitignored). The key can be an org key (one organization), a personal key limited to chosen organizations, or a full personal key.
- Multi-organization keys: list results carry an `org` field; pass `org` to host tools when a hostname exists in two organizations.
- A key with `read` scope cannot call the write tools; the error says so. Do not retry, tell the user to create a read+write key.
- If every tool answers "No LOFTION Server Agent API key for this project", the project is not authorized yet: point the user to `/loftion-server-agent:authorize`.

## Reporting back

Lead with what needs a decision: critical and high findings with the host and the fix. Group by host. Give counts in a short table, not in prose. Say plainly what you changed (acked, resolved, restarted) and what you only looked at.
