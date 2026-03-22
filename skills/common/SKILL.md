---
name: debridge-common
description: >
  Shared prerequisite for all deBridge agent skills. Detects agent runtime
  environment (CLI, MCP Desktop, browser, headless, chat-only), selects
  deBridge access method (streaming MCP, stdio MCP, SDK, CLI), and identifies
  available transaction signers. Run this first before any deBridge operation.
  Use whenever the user mentions deBridge for the first time in a session,
  asks about supported chains, needs to connect to deBridge MCP, or wants to
  check what signing methods are available. Also use when troubleshooting
  deBridge connectivity, checking environment capabilities, or setting up
  RPC endpoints.
license: MIT
metadata:
  author: deBridge
  version: "0.1.0"
---

# Environment Discovery

## Quick Reference

| Want to...                    | Go to                                    |
|-------------------------------|------------------------------------------|
| Detect environment type       | Phase 1 below                            |
| Refresh skills to latest      | Skill Freshness Check below              |
| Connect to deBridge MCP       | Phase 2 below + [mcp-setup.md](mcp-setup.md) |
| Identify available signers    | Phase 3 below                            |
| Look up chain IDs and tokens  | [chain-config.md](chain-config.md)       |
| Discover RPC endpoints        | [rpc-discovery.md](rpc-discovery.md)     |
| Run bundled helper scripts    | `scripts/` directory (balance, allowance, convert, RPC) |
| Call MCP tools from CLI       | [mcpc-usage.md](mcpc-usage.md)           |
| Swap or bridge tokens         | ../swap/SKILL.md                         |
| Set up a wallet               | ../wallets/SKILL.md                      |

## Detection Output

After completing all three phases, record:

```
Environment: <CLI | MCP Desktop | Browser | Headless | Chat-only>
Access:      <streaming-mcp | stdio-mcp | mcpc | manual>
Signer:      <env-privkey | foundry-cast | browser-wallet | ethers-viem | web3py | mcp-wallet | none>
```

Downstream skills use these values to select the right code paths.

---

## Phase 1: Detect Environment Group

Run checks in order. Stop at the first match.

### 1.1 CLI Agent

The agent can execute shell commands and has a runtime available.

Detection:
```bash
which node && echo "node available"
which python3 && echo "python available"
```

If bash works AND `node` or `python3` is found → **Environment = CLI**.

Capabilities: full filesystem, package install (`npm`, `pip`), can run MCP stdio server locally, can read environment variables.

### 1.2 MCP Desktop

The agent has MCP tools but limited or no bash access.

Detection: tool list includes any `mcp__debridge__*` tool. The agent is running inside Claude Desktop, Cursor, Windsurf, or an IDE with MCP support.

If MCP tools visible AND bash is unavailable or restricted → **Environment = MCP Desktop**.

Capabilities: MCP tool calls, may have file read/write via IDE, cannot install packages.

### 1.3 Browser

The agent runs in a browser context.

Detection: `window.ethereum` or EIP-1193 provider is accessible.

If browser APIs available → **Environment = Browser**.

Capabilities: injected wallet, DOM access, HTTP fetch. Cannot run local commands.

### 1.4 Headless / Autonomous

The agent runs programmatically without direct user interaction.

Detection: running inside OpenHands, CrewAI, LangChain, AutoGPT, or a custom SDK application. Has network access. May or may not have bash.

If programmatic agent framework detected → **Environment = Headless**.

Capabilities: varies by framework. Check tool list and bash availability individually.

### 1.5 Chat-Only (Fallback)

None of the above matched. The agent has no tool access.

**Environment = Chat-only**. All instructions become guidance for the user to execute manually.

---

## Skill Freshness Check

Optional: if skills may be outdated, read [skill-freshness.md](skill-freshness.md) for update methods (GitHub fetch, MCP resources, llms.txt). Otherwise proceed with bundled skills.

---

## Installing npm Packages

When **Environment = CLI** or **Headless** with Node.js available, npm packages (MCP servers, SDKs, CLIs, utilities) can be installed in two ways:

**`npx -y <pkg>`** — downloads, runs once, discards. Use for:
- First-time exploration or trying a tool
- One-off queries during a conversation
- CI/CD pipelines and ephemeral environments
- Any situation where the package is not needed again

**`npm install -g <pkg>`** — installs permanently. Use for:
- Agent harnesses that start the package repeatedly
- Long-lived processes and recurring scripts
- Projects that need reproducible, version-pinned dependencies (add to `devDependencies` in `package.json` instead of `-g`)

| Scenario | Command | Why |
|----------|---------|-----|
| Try an MCP server | `npx -y @debridge-finance/debridge-mcp@latest` | Fetched on demand, nothing retained |
| Try a CLI tool | `npx -y ethers` | Quick one-shot use |
| Build a trading bot | `npm install ethers viem` | Pinned in `package.json`, no re-download |
| Persistent MCP in agent harness | `npm install -g @debridge-finance/debridge-mcp` | Always available, faster startup |
| CI/CD pipeline | `npx -y <pkg>` | Clean environment each run |

This applies to all npm packages referenced in downstream skills — MCP servers, signing libraries, SDKs, and utilities.

### Calling MCP Tools Without Native MCP Support

For environments with Node.js but no native MCP support, use `@apify/mcpc` as a CLI client. Read [mcpc-usage.md](mcpc-usage.md) for full usage.

Quick start: `npx -y @apify/mcpc https://agents.debridge.com/mcp connect @debridge && npx -y @apify/mcpc @debridge tools-call get_supported_chains`

---

## Phase 2: Select deBridge Access Method

### 2.1 Probe for Existing MCP Connection

Call `mcp__debridge__get_supported_chains` (no parameters).

- **Returns chain data** → MCP is already connected. Access = **streaming-mcp** or **stdio-mcp**. Skip to Phase 3.
- **Tool not found** → MCP not connected. Continue to 2.2.

### 2.2 Set Up MCP by Environment

| Environment  | Recommended Method | Action                                             |
|--------------|--------------------|----------------------------------------------------|
| CLI          | mcpc wrapper       | Use mcpc to call MCP tools from the shell — no restart needed |
| MCP Desktop  | streaming-mcp      | Read [mcp-setup.md](mcp-setup.md) for client config |
| Browser      | manual             | Guide user to set up an MCP-capable environment    |
| Headless     | stdio-mcp or mcpc  | Read [mcp-setup.md](mcp-setup.md) for SDK setup   |
| Chat-only    | manual             | Guide user to set up an MCP-capable environment    |

#### CLI: Use mcpc (preferred — no restart needed)

When running inside Claude Code or any CLI agent, use `@apify/mcpc` to call deBridge MCP tools directly from the shell. This works immediately without restarting the session:

```bash
# Connect (one-time per session)
npx -y @apify/mcpc https://agents.debridge.com/mcp connect @debridge

# Now call any deBridge tool
npx -y @apify/mcpc @debridge tools-call get_supported_chains
npx -y @apify/mcpc @debridge tools-call search_tokens chainId:=1 search:=USDC
npx -y @apify/mcpc --json @debridge tools-call create_tx \
  srcChainId:=1 dstChainId:=42161 \
  srcChainTokenIn:=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \
  dstChainTokenOut:=0xaf88d065e77c8cC2239327C5EDb3A432268e5831 \
  srcChainTokenInAmount:='"100000000"' \
  dstChainTokenOutRecipient:=0xYourAddress

# Close when done
npx -y @apify/mcpc @debridge close
```

Read [mcpc-usage.md](mcpc-usage.md) for full details (argument syntax, JSON output, piping).

#### CLI: Persistent MCP setup (alternative — requires restart)

To add deBridge MCP as a permanent server (available in all future sessions without mcpc):

```bash
claude mcp add --transport http debridge https://agents.debridge.com/mcp
```

This requires restarting the Claude Code session. For Claude Desktop, Cursor, or programmatic SDK setup, read [mcp-setup.md](mcp-setup.md).

### 2.3 Future Access Methods

These are **not available yet** but will be supported:

- **`@debridge/sdk`** — TypeScript/JavaScript SDK, installable via npm. COMING SOON.
- **`@debridge/cli`** — Command-line tool for bridge/swap. COMING SOON.

When available, this skill will add detection and routing for them.

### 2.4 Verify Connection

After setup, call `mcp__debridge__get_supported_chains` again.
- Returns chain data → MCP is working. Proceed to Phase 3.
- Fails → read [mcp-setup.md](mcp-setup.md) troubleshooting section.

---

## Phase 3: Detect Available Signer

A signer is needed for on-chain transactions (bridge, swap, token approval).
deBridge requires signing EIP-712 typed data messages and standard EVM transactions.

Check in order. Stop at the first available signer.

### 3.1 Private Key in Environment

```bash
test -n "$PRIVATE_KEY" && echo "available" || test -n "$DEBRIDGE_PRIVATE_KEY" && echo "available"
```

If set → **Signer = env-privkey**.

⚠️ CAUTION: Never log, print, or include the private key in any output.

### 3.2 Foundry Cast

```bash
which cast && echo "available"
```

If available → **Signer = foundry-cast**.

Cast supports EIP-712 signing (`cast wallet sign --data`) and raw transaction sending (`cast send`). Requires a keystore or `--private-key` flag.

### 3.3 Browser Wallet (EIP-1193)

If `window.ethereum` exists → **Signer = browser-wallet**.

Supports `eth_signTypedData_v4` for EIP-712 and `eth_sendTransaction` for raw transactions.

### 3.4 ethers.js or viem

```bash
node -e "require('ethers')" 2>/dev/null && echo "ethers"
node -e "require('viem')" 2>/dev/null && echo "viem"
```

If either available → **Signer = ethers-viem**.

Both support EIP-712 via `signer.signTypedData()` (ethers) or `walletClient.signTypedData()` (viem). Both can send raw transactions.

### 3.5 web3.py (Python)

```bash
python3 -c "import web3" 2>/dev/null && echo "web3py"
```

If available → **Signer = web3py**.

Supports EIP-712 via `w3.eth.account.sign_typed_data()` and raw transactions via `w3.eth.send_raw_transaction()`.

### 3.6 MCP-Managed Wallet

Check if MCP tools include a signing or wallet tool:
- `mcp__privy__eth_sendTransaction` → Privy embedded wallet is available.
- Any other MCP signing tool → compatible MCP wallet.

If available → **Signer = mcp-wallet**.

Privy MCP handles signing server-side (keys in TEE). The agent passes `create_tx` output directly to Privy's `eth_sendTransaction` — no local key or RPC needed. See ../wallets/privy-embedded.md for setup.

### 3.7 No Signer Available

If none matched → **Signer = none**.

Guide the user to set up a signer:
- Simplest: set `PRIVATE_KEY` environment variable
- For development: install Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- For agent workflows: set up Privy embedded wallet (see ../wallets/privy-embedded.md)
- For all options: read ../wallets/SKILL.md

---

## MCP Tool Reference

| MCP Tool                                  | Purpose                                    |
|-------------------------------------------|--------------------------------------------|
| `mcp__debridge__get_supported_chains`     | List supported chains with IDs and names   |
| `mcp__debridge__search_tokens`            | Find token by name, symbol, or address     |
| `mcp__debridge__create_tx`                | Build cross-chain bridge/swap transaction  |
| `mcp__debridge__estimate_same_chain_swap` | Estimate same-chain swap output and fees   |

All MCP tools expect token amounts in **raw units** (the smallest indivisible unit: wei for EVM, lamports for Solana) passed as strings. See [chain-config.md](chain-config.md) for decimals and conversion.

---

## Common Errors

| Error                      | Cause                    | Fix                                                  |
|----------------------------|--------------------------|------------------------------------------------------|
| MCP tool not found         | Server not connected     | Re-run Phase 2                                       |
| `npx` not found            | Node.js not installed    | Install Node.js 18+                                  |
| Permission denied on key   | Env var not exported      | `export PRIVATE_KEY=...` in shell config             |
| Chain ID not recognized    | Wrong ID format          | Use deBridge chain IDs from [chain-config.md](chain-config.md) |
| Amount format error        | Human-readable passed    | Convert to raw units first                           |

## References

- [chain-config.md](chain-config.md) — Chain IDs, tokens, decimals, amount conversion
- [mcp-setup.md](mcp-setup.md) — MCP configuration for all environments
- [rpc-discovery.md](rpc-discovery.md) — RPC endpoint discovery via Chainlist
