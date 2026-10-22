# LOFTION Server Agent — Claude Code plugin

[LOFTION Server Agent](https://agent.loftion.com) watches Linux servers through a read-only agent and finds what needs a human: security updates, end-of-life frameworks, exploited CVEs, failed units, thresholds, website problems. This plugin puts that into Claude Code.

Brings your monitored servers and their security findings into Claude Code, with a separate API key per project.

```
/plugin marketplace add brando-pro/loftion-server-agent-plugin
/plugin install loftion-server-agent@loftion
/loftion-server-agent:authorize lsak_…        # key from the panel: Settings → API keys & MCP
/loftion-server-agent:triage
```

What you get:
- **MCP tools** (`list_orgs`, `summarize_findings`, `list_findings`, `get_host`, `update_finding`, `restart_service`, …) through a tiny stdio proxy that uses *this project's* key: `.claude/loftion-server-agent.key` (gitignored), or `LOFTION_API_KEY`, or `~/.config/loftion-server-agent/key` as a personal fallback.
- **A skill** that teaches Claude how the product works: start with the summary, page the findings, close them honestly, what the API cannot do (logs and files: ssh).
- **Commands**: `/loftion-server-agent:authorize <key>`, `/loftion-server-agent:triage [org|host]`, `/loftion-server-agent:host <name>`.

Self-hosted panel: put its base URL in `.claude/loftion-server-agent.url` or `LOFTION_SERVER_URL`.

Requires Node 18+ (Claude Code ships with it). No other dependencies.

## How the key is found

In this order: `LOFTION_API_KEY` in the environment; `.claude/loftion-server-agent.key` in the project (what `/loftion-server-agent:authorize` writes); `~/.config/loftion-server-agent/key`. Without a key the server still connects and exposes one tool that explains how to authorize, so nothing fails silently.

The key goes to the panel in the `Authorization` header and nowhere else. The proxy keeps no cache and writes no logs.

## Privacy and safety

The agent on your servers reads and reports; it cannot run commands. The only remote action, a service restart, is off by default and must be enabled per server in the panel. Logs and config files are never reachable through the API: the skill tells Claude to use ssh for those, in your own environment.

## License

MIT. © LOFTION SIA. Issues and pull requests are welcome in this repository; the panel and the agent live elsewhere.
