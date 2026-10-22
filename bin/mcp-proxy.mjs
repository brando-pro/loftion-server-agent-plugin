#!/usr/bin/env node
/**
 * LOFTION Server Agent — stdio ↔ remote MCP proxy for the Claude Code plugin.
 *
 * Claude Code starts this over stdio. Every JSON-RPC message is forwarded to the remote Streamable-HTTP MCP
 * endpoint with the API key of the *current project*, so each project talks to the panel with its own key:
 *   1. $LOFTION_API_KEY in the environment (CI, one-off shells)
 *   2. <project>/.claude/loftion-server-agent.key   (written by /loftion-server-agent:authorize, gitignored)
 *   3. ~/.config/loftion-server-agent/key           (a personal fallback for every project)
 * The endpoint comes from $LOFTION_SERVER_URL, <project>/.claude/loftion-server-agent.url, or the default.
 * No dependencies: Node 18+ (fetch, stdio). Nothing is cached or logged; the key never leaves this machine except in the Authorization header.
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_URL = "https://agent.loftion.com/mcp";
const project = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function readTrimmed(p) { try { return existsSync(p) ? readFileSync(p, "utf8").trim() : ""; } catch { return ""; } }
function resolveKey() {
  const env = (process.env.LOFTION_API_KEY || "").trim();
  if (/^lsak_[A-Za-z0-9_-]{43}$/.test(env)) return env;
  for (const p of [join(project, ".claude", "loftion-server-agent.key"), join(homedir(), ".config", "loftion-server-agent", "key")]) {
    const k = readTrimmed(p).split("\n").map((l) => l.replace(/^export\s+LOFTION_API_KEY=/, "").replace(/^["']|["']$/g, "").trim()).find((l) => /^lsak_[A-Za-z0-9_-]{43}$/.test(l));
    if (k) return k;
  }
  return "";
}
function resolveUrl() {
  return (process.env.LOFTION_SERVER_URL || readTrimmed(join(project, ".claude", "loftion-server-agent.url")) || readTrimmed(join(homedir(), ".config", "loftion-server-agent", "url")) || DEFAULT_URL).replace(/\/$/, "");
}

const url = resolveUrl().endsWith("/mcp") ? resolveUrl() : resolveUrl() + "/mcp";
const key = resolveKey();
const NO_KEY = `No LOFTION Server Agent API key for this project. Run /loftion-server-agent:authorize <lsak_…> (create a key in the panel under Settings → API keys & MCP), or set LOFTION_API_KEY.`;

const out = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

/** Minimal local answers so Claude Code shows a connected server with one helpful tool when no key exists yet. */
function answerLocally(msg) {
  if (msg.method === "initialize") return out({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "loftion-server-agent (not authorized)", version: "0" }, instructions: NO_KEY } });
  if (msg.method === "tools/list") return out({ jsonrpc: "2.0", id: msg.id, result: { tools: [{ name: "authorize_hint", description: NO_KEY, inputSchema: { type: "object", properties: {} } }] } });
  if (msg.method === "tools/call") return out({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: NO_KEY }], isError: true } });
  if (msg.id !== undefined) return out({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: NO_KEY } });
}

async function forward(msg) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${key}` }, body: JSON.stringify(msg) });
  if (msg.id === undefined) return;                       // notification: the server answers 202, nothing to relay
  if (r.status === 401 || r.status === 403) return out({ jsonrpc: "2.0", id: msg.id, error: { code: -32001, message: `The panel rejected this project's API key (HTTP ${r.status}). Revoked or expired? Create a new one and run /loftion-server-agent:authorize again.` } });
  if (!r.ok) return out({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `MCP endpoint ${url} answered HTTP ${r.status}` } });
  const ct = r.headers.get("content-type") || "";
  const body = await r.text();
  if (ct.includes("text/event-stream")) {
    for (const block of body.split(/\n\n+/)) {
      const data = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
      if (data) { try { out(JSON.parse(data)); } catch { /* keep-alive or partial */ } }
    }
  } else if (body.trim()) {
    try { out(JSON.parse(body)); } catch { out({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: "unparseable reply from the MCP endpoint" } }); }
  }
}

let buf = "", pending = 0, ended = false;
const maybeExit = () => { if (ended && pending === 0) process.exit(0); };
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (!key) { answerLocally(msg); continue; }
    pending++;
    forward(msg).catch((e) => { if (msg.id !== undefined) out({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: `cannot reach ${url}: ${e.message}` } }); }).finally(() => { pending--; maybeExit(); });
  }
});
process.stdin.on("end", () => { ended = true; maybeExit(); });
