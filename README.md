# deBridge Agent Skills

[Agent Skills](https://agentskills.io/specification) for the [deBridge](https://debridge.finance) cross-chain DeFi ecosystem. Skills teach AI agents how to bridge tokens, swap, sign transactions, query balances, and monitor orders across 20+ EVM chains and Solana — using the [deBridge MCP server](https://agents.debridge.com/mcp), SDK, or CLI.

Skills are the guidance layer; MCP and/or SDK is the execution layer.

## Skills

| Skill | Description |
|-------|-------------|
| [common](skills/common/SKILL.md) | Shared prerequisite — environment detection, MCP setup, chain config, RPC discovery |
| [bridge](skills/bridge/SKILL.md) | Cross-chain bridge via DLN: quote, preflight, sign, execute, monitor |
| [swap](skills/swap/SKILL.md) | Same-chain and cross-chain token swaps |
| [signing](skills/signing/SKILL.md) | Transaction signing — routes to ethers/viem, cast, MetaMask, web3.py, or Privy |
| [wallets](skills/wallets/SKILL.md) | Wallet setup: EOA, Foundry keystore, Privy embedded |
| [analytics](skills/analytics/SKILL.md) | Token prices, balances, TVL, DEX pools, on-chain data via third-party MCPs |

## Quick Start

### For Agents (MCP)

Connect the deBridge MCP server and point your agent at the skill catalog:

```
https://agents.debridge.com/llms.txt
```

Or fetch the structured index:

```
https://agents.debridge.com/skills/index.json
```

Skills use progressive disclosure — agents read `llms.txt` or `index.json` to discover skills, then fetch individual `SKILL.md` files on demand.

### For Claude Code

```bash
# Add the deBridge MCP server
claude mcp add debridge -- npx -y @debridge-finance/debridge-mcp@latest
```

### For Claude Desktop / Cursor / Windsurf

Add to your MCP config file:

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

## How Skills Work

Each skill directory contains a `SKILL.md` entry point and sibling reference `.md` files. Skills follow four patterns:

1. **Shared Prerequisite** — `common` runs first, detecting environment, MCP connectivity, and available signers.
2. **Router** — `signing` and `analytics` detect the available tool (ethers, cast, web3.py, etc.) and route to the matching reference file.
3. **Sequential Pipeline** — `bridge` follows a strict order: quote → preflight → sign → execute → monitor.
4. **MCP Probe with Fallback** — every skill that calls MCP tools provides an alternative path when MCP is unavailable.

```
bridge/SKILL.md → preflight.md → ../signing/SKILL.md → execute → monitoring.md
                                        ↓
                              sdk-signer.md | foundry-cast.md | metamask.md | web3py.md | privy-mcp.md
```

## Repository Structure

```
debridge-skills/
├── skills/
│   ├── common/               # Shared prereq: env detection, MCP setup, chain config, RPC discovery
│   ├── bridge/               # Sequenced: quote → preflight → sign → execute → monitor
│   ├── swap/                 # Same-chain and cross-chain swap flows
│   ├── signing/              # Router: wallet/signer strategy selection
│   ├── wallets/              # Wallet setup: EOA, Foundry keystore, embedded
│   ├── analytics/            # Balances, prices, TVL, DEX pools, on-chain data
│   └── index.json            # Generated: skill discovery catalog
├── scripts/
│   ├── validate.ts           # Schema + structural validation
│   ├── build-index.ts        # Generate skills/index.json
│   └── generate-llmstxt.ts   # Generate llms.txt
├── evals/                    # LLM evaluation harness
├── tests/                    # Unit + integration tests
├── plugin.json               # Plugin descriptor
└── llms.txt                  # Generated: llmstxt.org skill catalog
```

Reference files live as siblings of `SKILL.md` — no subdirectories inside skill directories. Directory names are short (`bridge/`, not `debridge-bridge/`); the `debridge-` prefix appears only in the SKILL.md frontmatter `name` field.

## Development

### Prerequisites

```bash
npm install
```

### Commands

```bash
npm run validate              # Schema + structural checks (284 rules)
npm run validate:verbose      # Validate with passing rules shown
npm run build                 # Full pipeline: validate → index.json → llms.txt
npm run build:index           # Generate skills/index.json
npm run build:llmstxt         # Generate llms.txt
npm run check                 # CI: verify generated files are up to date
```

### Creating a New Skill

1. Create a directory under `skills/`:
   ```bash
   mkdir -p skills/{skill-name}
   ```

2. Write `SKILL.md` with YAML frontmatter (`name`, `description`, `license`, `metadata`) and a markdown body. The `description` field is the trigger mechanism — include action verbs, token/chain names, and explicit trigger phrases.

3. Add sibling reference `.md` files for environment-specific instructions. One concern per file, under 300 lines each. Every reference must be linked from SKILL.md.

4. Validate and build:
   ```bash
   npm run build
   ```

### SKILL.md Anatomy

```yaml
---
name: debridge-bridge                    # External ID: debridge- prefix required
description: >
  Execute cross-chain bridge transactions via deBridge DLN...
  Triggers: "bridge", "cross-chain transfer", "move tokens".
license: MIT
metadata:
  author: deBridge
  version: "1.0.0"
---
```

The body starts with a `PREREQUISITE` line referencing `../common/SKILL.md`, followed by a Quick Reference table, MCP availability check, numbered workflow steps, common errors, and a references list.

### Validation Rules

The validator enforces structural, content, and cross-referencing rules:

- **Structural**: frontmatter fields present, `name` has `debridge-` prefix, body under 500 lines, references under 300 lines, no orphan references, no subdirectories.
- **Content**: no hardcoded addresses/keys/paths, string-canonical amounts only, MCP fallback sections present, signing delegated to `signing/SKILL.md`, preflight referenced before execute.
- **Cross-refs**: all references resolve, no circular dependencies, `common` is prerequisite for every skill.

### Writing Guidelines

- Only include knowledge agents don't already have: MCP tool names, SDK signatures, parameter formats, sequencing constraints, chain-specific quirks.
- Use string-canonical amounts everywhere (`"100.5"`, never wei or BigNumber).
- Reference MCP tools as `mcp__debridge__<tool_name>` alongside SDK equivalents.
- Put "when to use" context in the `description` frontmatter, not in the body.
- Mark dangerous operations: `⚠️ CAUTION: This executes a real transaction.`

### Commit and PR Rules

- One skill per PR.
- Run `npm run build` before committing — both validate and generate must succeed.
- Conventional commits: `feat(bridge): add Solana destination support`.
- Bump `metadata.version` in SKILL.md frontmatter on every skill change.
- Never edit `llms.txt` or `skills/index.json` directly — regenerate with `npm run build`.

## Evals

Skills are tested with an LLM eval harness in `evals/`. Each eval case is a prompt + assertions verifying that an agent using the skill produces correct behavior.

```bash
npm run eval -- --skill debridge-bridge   # Run evals for a skill
npm run eval -- --all                     # Run all evals
```

Every skill should have eval cases covering: happy path, MCP-unavailable fallback, error recovery, environment routing, and cross-skill sequencing.

## Related

- [deBridge MCP Server](https://agents.debridge.com/mcp) — live cross-chain infrastructure tools
- [Agent Skills Open Standard](https://agentskills.io/specification) — the specification these skills follow
- [llms.txt Standard](https://llmstxt.org/) — the format used for `llms.txt`

## License

MIT
