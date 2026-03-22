---
title: MCP Server Configuration by Environment
impact: HIGH
impactDescription: "Required for connecting agents to deBridge execution layer"
tags: mcp, setup, streaming, stdio, claude-desktop, cursor, claude-code
---

# deBridge MCP Setup

## Transport Modes

| Mode           | URL / Command                                    | Best For               |
|----------------|--------------------------------------------------|------------------------|
| Streaming HTTP | `https://agents.debridge.com/mcp`            | MCP Desktop, remote    |
| Stdio (local)  | `npx -y @debridge-finance/debridge-mcp@latest`  | CLI agents, local dev  |

Streaming requires no installation. Stdio requires Node.js 18+.

For guidance on when to use `npx` (one-shot) vs `npm install` (persistent harnesses), see SKILL.md → "Installing npm Packages".

---

## Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

### Streaming (recommended)

```json
{
  "mcpServers": {
    "debridge": {
      "type": "streamable-http",
      "url": "https://agents.debridge.com/mcp"
    }
  }
}
```

### Stdio

```json
{
  "mcpServers": {
    "debridge": {
      "command": "npx",
      "args": ["-y", "@debridge-finance/debridge-mcp@latest"]
    }
  }
}
```

---

## Cursor / Windsurf / VS Code

Add to `.cursor/mcp.json`, `.windsurf/mcp.json`, or equivalent IDE MCP config:

```json
{
  "mcpServers": {
    "debridge": {
      "type": "streamable-http",
      "url": "https://agents.debridge.com/mcp"
    }
  }
}
```

For stdio, replace with:

```json
{
  "mcpServers": {
    "debridge": {
      "command": "npx",
      "args": ["-y", "@debridge-finance/debridge-mcp@latest"]
    }
  }
}
```

---

## Claude Code (CLI)

Stdio:
```bash
claude mcp add debridge -- npx -y @debridge-finance/debridge-mcp@latest
```

Streaming:
```bash
claude mcp add --transport http debridge https://agents.debridge.com/mcp
```

---

## Headless / Programmatic (MCP SDK)

### Streaming Transport

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({ name: "my-agent", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(
  new URL("https://agents.debridge.com/mcp")
);
await client.connect(transport);

const chains = await client.callTool({
  name: "get_supported_chains",
  arguments: {}
});
```

### Stdio Transport

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "my-agent", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@debridge-finance/debridge-mcp@latest"]
});
await client.connect(transport);
```

---

## Verification

After configuration, verify the connection:

1. Call `mcp__debridge__get_supported_chains` (no parameters).
2. Expected: JSON array of chain objects with `chainId` and `chainName`.
3. If successful → MCP is ready. Return to SKILL.md Phase 3.
4. If failed → see troubleshooting below.

---

## Troubleshooting

| Symptom                    | Cause                     | Fix                                                      |
|----------------------------|---------------------------|----------------------------------------------------------|
| Tool `mcp__debridge__*` not found | Server not configured | Add config per sections above                            |
| Connection refused (stdio) | Node.js missing           | Install Node.js 18+                                     |
| Connection timeout         | Network/firewall          | Check HTTPS access to `agents.debridge.com`          |
| `npx` hangs on first run  | Package download slow     | `npm install -g @debridge-finance/debridge-mcp` then run `debridge-mcp` directly |
| JSON parse error           | Outdated MCP package      | `npx -y @debridge-finance/debridge-mcp@latest` (forces latest) |
| Auth error                 | None expected             | deBridge MCP is public, no API key needed                |
