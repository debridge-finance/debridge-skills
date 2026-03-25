# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A collection of [Agent Skills](https://agentskills.io/specification) for the deBridge cross-chain DeFi ecosystem. Skills are markdown-based guidance documents that teach AI agents how to bridge tokens, swap, sign transactions, query balances, and monitor orders. Skills are the guidance layer; the [deBridge MCP server](https://agents.debridge.com/mcp) and SDK are the execution layer.

## Commands

```bash
npm run validate              # Schema + structural checks (~284 rules)
npm run validate:verbose      # Same, but shows passing rules too
npm run build                 # Full pipeline: validate → index.json → llms.txt
npm run build:index           # Regenerate skills/index.json only
npm run build:llmstxt         # Regenerate llms.txt only
npm run check                 # CI: verify generated files match source (no writes)
```

Always run `npm run build` before committing — it validates and regenerates `skills/index.json` and `llms.txt`. Never edit those two files by hand.

## Architecture

### Skill Structure

Each skill is a directory under `skills/` containing a `SKILL.md` entry point and sibling `.md` reference files. No subdirectories inside skill dirs. Directory names are short (`bridge/`, not `debridge-bridge/`); the `debridge-` prefix appears only in SKILL.md frontmatter `name` field.

Skills follow four patterns:
1. **Shared Prerequisite** — `common` runs first (environment detection, MCP setup, signers).
2. **Router** — `signing` and `analytics` detect the available tool and route to the right reference.
3. **Sequential Pipeline** — `swap`/`bridge` follow strict ordering (quote → preflight → sign → execute → monitor).
4. **MCP Probe with Fallback** — every MCP-calling skill provides a non-MCP alternative path.

### Discovery

`skills/index.json` is the machine-readable catalog. `llms.txt` is the llmstxt.org format catalog. Both are generated from SKILL.md files by scripts in `scripts/`.

### Build Scripts (TypeScript, run via `npx tsx`)

- `scripts/validate.ts` — Validates all skills against structural, content, and cross-reference rules.
- `scripts/build-index.ts` — Generates `skills/index.json` from SKILL.md frontmatter.
- `scripts/generate-llmstxt.ts` — Generates `llms.txt` from skill metadata.

### Evals

`evals/evals.json` contains LLM evaluation cases (prompt + assertions) for testing skill behavior.

## Validation Rules to Know

- SKILL.md `name` must have `debridge-` prefix
- SKILL.md body must be under 500 lines; references under 300 lines
- No hardcoded addresses, keys, or filesystem paths
- Token amounts must be string-canonical (`"100.5"`, never wei/BigNumber)
- MCP fallback sections required for any skill calling MCP tools
- Signing must be delegated to `signing/SKILL.md`, not inlined
- All references must resolve; no orphan .md files; no circular deps
- `common` must be prerequisite for every other skill

## Skill Creator

`/skill-creator` is available as a project skill (`.claude/skills/skill-creator/`). It lazy-loads Anthropic's [skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) from GitHub at invocation time. Use it when creating new skills, running evals, or optimizing skill descriptions. After generating or modifying a skill, always run `npm run build` — the skill-creator doesn't know about this repo's validation rules.

## Adding a New Signing Method or Wallet Type

When adding support for a new signing method (e.g., OWS, a new MCP wallet), update **all** of these locations — missing any one creates inconsistencies:

1. **`common/SKILL.md` Phase 3** — Add a detection step (check for CLI tool, SDK import, env var). Add the new Signer value to the Detection Output template.
2. **`signing/SKILL.md`** — Add to Quick Reference table, Signer Routing table, RPC Endpoints list, and References section.
3. **`wallets/SKILL.md`** — Add to Quick Reference table, create an Option section, update After Setup section.
4. **Reference file** — Create the `.md` reference in `signing/` (not `wallets/` — signing concerns go in `signing/`). Wallets skill just links to `../signing/`.
5. **Scripts** — If the method needs format adaptation, add scripts to `signing/scripts/`. Prefer SDK bindings over CLI subprocess calls.

### Accuracy Checklist for External Tool References

When documenting an external tool (OWS, Privy, Foundry, etc.):

- **Fetch the actual docs** — Do not assume CLI flags or SDK function signatures. Verify against the source repo or official docs.
- **Check SDK parameter ordering** — Many SDKs have optional params between required ones (e.g., `passphrase` before `encoding`). Pass `undefined` for skipped positional args in JS.
- **Verify command existence** — A spec feature (e.g., `signAndSend`) may not be implemented in the CLI or SDK. Check whether it's documented as available or optional.
- **No hardcoded RPC URLs** — Use env vars with public fallbacks (e.g., `process.env.SOLANA_RPC_URL || "https://..."`)
- **Custody terminology matters** — Use precise terms: "local self-custody" (keys on user's machine, e.g., OWS), "server-side" (keys in TEE, e.g., Privy), "plaintext" (raw env var). Never call local signing "server-side."
- **Avoid "manual"** for scripted automation — If a script handles the process, it's a "pipeline" or "scripted flow," not "manual."

## Scripting Conventions

- **JS/Node.js is the only supported scripting language.** Do not add Python scripts or recommend Python approaches.
- **NEVER call MCP from inside JS scripts.** The agent is the MCP client — it calls MCP tools directly (or via mcpc CLI), then passes parsed results to scripts. Scripts handle only signing, broadcasting, and on-chain queries. This is a hard rule with no exceptions.
- **Scripts prefer CLI arguments over piped JSON.** The agent parses MCP responses and passes clean values as CLI args. JSON via stdin is acceptable only for deeply nested reusable structures (e.g., EIP-712 typed data). The agent is responsible for extracting fields from MCP responses — scripts should not parse MCP envelopes.
- **Use bundled scripts** for signing, broadcasting, and approvals. The agent calls MCP to get the quote, parses the response, and invokes the appropriate script with the extracted parameters.
- **EVM and Solana have separate scripts** — do not combine them into a single multi-chain tool.
- **Available scripts:**
  - `signing/scripts/debridge-evm-bridge.mjs` — EVM: reads create_tx JSON from stdin → OWS sign → assemble → broadcast
  - `signing/scripts/debridge-solana-bridge.mjs` — Solana: reads create_tx JSON from stdin → OWS sign → broadcast
  - `signing/scripts/erc20-approve.mjs` — EVM: check allowance and approve ERC-20 token for a spender (CLI args, no stdin)
  - `analytics/scripts/balance-evm.mjs` — EVM multi-chain balance check
  - `analytics/scripts/balance-solana.mjs` — Solana balance check (SOL + SPL tokens)
- **Never pass large hex data through shell variables** — they truncate or produce odd-length strings. Pipe JSON via stdin instead.
- **No hardcoded RPC URLs.** All scripts import `common/scripts/rpc.mjs` for dynamic RPC discovery via Chainlist. Solana RPCs are resolved via `$SOLANA_RPC_URL` or a public fallback. Never embed RPC URLs in scripts or docs — use `getRpc(chainId)`.
- **No hardcoded chain lists in skills/docs.** Agent flows should call `mcp__debridge__get_supported_chains` to get the current list of chains, then pass the relevant chain ID(s) to scripts. Small, internal default chain sets are permitted inside helper/analytics scripts (e.g., `analytics/scripts/balance-evm.mjs`) as long as they are clearly non-authoritative and not used to infer "supported chains" in skills. Scripts never call MCP directly.
- **No curl snippets for deBridge/RPC flows.** Use the bundled `.mjs` scripts instead — they're more reliable and handle RPC discovery automatically. Curl may be used only for installing tooling or dependencies (e.g., an SDK/CLI installer), not for on-chain queries or API calls.
- **OWS EVM signing returns raw signatures**, not broadcast-ready transactions. The EVM bridge script handles assembly; see `ows-signing.md` for the format details.
- **mcpc output format:** Always use `mcpc --json` for machine-readable output. The response is a JSON envelope `{content:[{text:"<inner JSON>"}]}`. The agent MUST parse the envelope and extract the inner JSON before passing to scripts — scripts expect plain JSON, not MCP envelopes.

## Conventions

- One skill per PR. Conventional commits: `feat(bridge): add Solana destination support`
- Bump `metadata.version` in SKILL.md frontmatter on every skill change
- Reference MCP tools as `mcp__debridge__<tool_name>` alongside SDK equivalents
- Mark dangerous operations with `⚠️ CAUTION: This executes a real transaction.`
- Reference files: one concern per file, linked from SKILL.md
