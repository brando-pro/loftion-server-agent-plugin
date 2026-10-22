---
description: Authorize this project with a LOFTION Server Agent API key (stored in .claude/, gitignored)
argument-hint: <lsak_… key>
allowed-tools: Bash(mkdir *), Bash(chmod *), Bash(grep *), Bash(printf *), Bash(test *), Edit, Read
---
The user wants this project to talk to LOFTION Server Agent with its own API key. Key given: `$ARGUMENTS`

Do exactly this, without printing the key back:
1. If the argument is empty or does not match `lsak_` followed by 43 characters of `A-Za-z0-9_-`, stop and tell the user to create a key in the panel (Settings → API keys & MCP; an org key, or a personal key limited to the organizations this project should see) and run `/loftion-server-agent:authorize <key>`.
2. Write the key as the only line of `.claude/loftion-server-agent.key` in the project root (`mkdir -p .claude`, then write the file, then `chmod 600`). Overwrite a previous key without asking.
3. Make sure `.gitignore` contains the line `.claude/loftion-server-agent.key` (append it when missing; create `.gitignore` when there is none).
4. Tell the user: the key is stored for this project only; run `/mcp` → reconnect `plugin:loftion-server-agent:loftion-server-agent`, or `/reload-plugins`, and the tools become available; then suggest `/loftion-server-agent:triage` as the first thing to run.
5. Optional, if the project uses a self-hosted panel: the same folder can hold `loftion-server-agent.url` with the base URL; mention it only when the user asked about a different server.
