---
title: MCP Tool Calls via CLI (mcpc)
impact: LOW
impactDescription: "Edge-case CLI client for environments without native MCP support"
tags: mcpc, apify, cli, mcp-client, one-shot
---

# Calling MCP Tools Without Native MCP Support

Some environments have Node.js and shell access but cannot add MCP servers natively (no `claude mcp add`, no config file, or adding an MCP requires a restart). For one-shot MCP tool calls from the command line, use `@apify/mcpc` — a universal CLI client for MCP:

```bash
# 1. Connect to an MCP server (creates a named session)
npx -y @apify/mcpc https://agents.debridge.com/mcp connect @debridge

# 2. List available tools
npx -y @apify/mcpc @debridge tools-list

# 3. Call a tool with arguments
npx -y @apify/mcpc @debridge tools-call get_supported_chains

npx -y @apify/mcpc @debridge tools-call search_tokens \
  chainId:=1 search:=USDC

npx -y @apify/mcpc --json @debridge tools-call create_tx \
  srcChainId:=1 dstChainId:=42161 \
  srcChainTokenIn:=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \
  dstChainTokenOut:=0xaf88d065e77c8cC2239327C5EDb3A432268e5831 \
  srcChainTokenInAmount:='"100000000"' \
  dstChainTokenOutRecipient:=0xYourAddress

# 4. Close session when done
npx -y @apify/mcpc @debridge close
```

**CLI syntax:** `mcpc [options] <target> [command]` — the target (URL or `@session`) always comes **before** the command.

- **Connect:** target is the URL, command is `connect @name` → `mcpc <url> connect @name`
- **Call/list/close:** target is the session → `mcpc @name tools-call ...`, `mcpc @name close`

Key details:
- Arguments use `:=` syntax. Types are auto-detected: `count:=10` → number, `name:=hello` → string.
- Force string type with extra quotes: `amount:='"100000000"'` (important for raw unit amounts).
- Add `--json` before the session name for machine-readable JSON output.
- Pipe JSON arguments from stdin: `echo '{"chainId":1}' | npx -y @apify/mcpc @debridge tools-call search_tokens`
- Works with any MCP server, not just deBridge. Connect to Blockscout, CoinGecko, etc. the same way.
