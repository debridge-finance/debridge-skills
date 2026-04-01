---
name: audit-consistency
description: >
  Audit consistency across all AI-facing surfaces in the deBridge ecosystem:
  MCP server tools, MCP server skill resources, this repo's skills, the upstream
  debridge-mcp repo SKILL.md, llms.txt, and skills/index.json. Detects tool name
  mismatches, ghost tool references, missing parameters, stale descriptions, and
  workflow divergence. Use when: "audit consistency", "check for inconsistencies",
  "are skills in sync with MCP", "validate tool names", "drift check", or after
  any change to skills, MCP server, or upstream repo.
---

# deBridge Ecosystem Consistency Audit

Systematically compare every AI-facing surface in the deBridge ecosystem and report mismatches.

## Sources of Truth (ranked)

1. **MCP server tools** — the live tool schemas are the ultimate authority on tool names, parameters, and types. Probe via `mcp__debridge__*` native tools.
2. **MCP server skill resources** — the skill://\* resources served by the MCP server. These must match the tools exactly.
3. **This repo (`debridge-skills`)** — skills under `skills/`, `evals/evals.json`, `skills/index.json`, `llms.txt`.
4. **Upstream repo (`debridge-finance/debridge-mcp`)** — the `SKILL.md` at the root of the MCP server repo.
5. **Public endpoints** — `https://agents.debridge.com/llms.txt` and the remote `skills/index.json`.

When sources conflict, trust the lower-numbered source and flag the higher-numbered one as stale.

---

## Phase 1: Collect Inventory

Gather the canonical state from each source. Run all collections in parallel where possible.

### 1A. MCP Server Tools (ground truth)

Probe the MCP server for the live tool inventory. Use native MCP tools (requires deBridge MCP to be connected — see `skills/common/mcpc-usage.md` for setup).

**Native MCP probe:**
Call each `mcp__debridge__*` tool that takes no arguments:
- `mcp__debridge__get_supported_chains` — if this returns data, native MCP is connected
- `mcp__debridge__get_instructions` — captures the server's canonical workflow

If native MCP is not connected, add it first:
- Streamable HTTP: `claude mcp add --transport http debridge https://agents.debridge.com/mcp`
- Stdio proxy: `claude mcp add debridge npx -- -y @debridge-finance/debridge-mcp@latest`

Record for each tool:
- `name` — exact tool name
- `required` — required parameter names
- `optional` — optional parameter names
- `description` — tool description text

### 1B. MCP Server Skill Resources

Use MCP resource tools to list and read skill resources:
- `ListMcpResourcesTool` — list all available resources
- `ReadMcpResourceTool` — read each `skill://*` resource

Record: skill name, tool names mentioned, parameter names mentioned, workflow steps.

### 1C. This Repo's Skills

Grep all skill files for MCP tool references:
```bash
grep -rn 'mcp__debridge__\|create_tx\|transaction_same_chain_swap\|estimate_same_chain_swap\|get_supported_chains\|search_tokens\|get_instructions\|get_trade_dapp_url' skills/ evals/
```

Also read:
- `skills/common/SKILL.md` — MCP Tool Reference table
- `skills/swap/SKILL.md` — tool call examples
- `skills/signing/SKILL.md` — tool references in signing flow
- `skills/swap/preflight.md` — tool references
- `evals/evals.json` — tool references in eval expectations

### 1D. Upstream MCP Repo

Fetch the upstream SKILL.md:
```bash
curl -sL https://raw.githubusercontent.com/debridge-finance/debridge-mcp/main/SKILL.md
```

Record: tool names listed, workflow steps, parameter mentions.

### 1E. Public Endpoints

Fetch and parse:
```bash
curl -sL https://raw.githubusercontent.com/debridge-finance/debridge-skills/main/skills/index.json
curl -sL https://agents.debridge.com/llms.txt
```

---

## Phase 2: Diff and Detect

Run each check against the inventory collected in Phase 1. Report every mismatch.

### Check 1: Tool Name Consistency

For every tool name found in ANY source, verify it exists in the MCP server tool list.

| What to detect | Example |
|---|---|
| Renamed tools still referenced by old name | `estimate_same_chain_swap` vs `transaction_same_chain_swap` |
| Ghost tools (referenced but don't exist on server) | `get_trade_dapp_url` |
| Tools on server not documented anywhere | A new tool added to MCP but not in skills |

**How:** Build a set of all tool names from the MCP server. Scan every other source for tool name references. Any name not in the server set is a mismatch.

### Check 2: Parameter Coverage

For each tool on the MCP server, verify that skills document:
- All **required** parameters (MUST be mentioned in workflow steps)
- All **optional** parameters (SHOULD be mentioned in an "Optional parameters" section)

**How:** For each tool, extract required/optional param names from the schema. Search skills for each param name in the context of that tool.

### Check 3: Parameter Types and Descriptions

Verify that skills describe parameters consistently with the MCP schema:
- String params described as strings (not numbers)
- Amounts described as "smallest units" / "wei" / "lamports"
- Chain IDs described as strings

### Check 4: Workflow Step Alignment

Compare the workflow described in:
- MCP `get_instructions` response
- MCP `debridge-workflow` skill resource
- This repo's `skills/swap/SKILL.md`
- Upstream `debridge-mcp` repo `SKILL.md`

They should all describe the same sequence. Detect:
- Missing steps (e.g., `get_instructions` not mentioned)
- Extra steps (e.g., `get_trade_dapp_url` step that references a ghost tool)
- Reordered steps

### Check 5: Tool Description Consistency

Compare the one-line description of each tool across:
- MCP server tool schema `description` field
- This repo's `skills/common/SKILL.md` MCP Tool Reference table
- Upstream repo `SKILL.md` Tools section

Detect semantic mismatches (e.g., "Estimate" vs "Create" for the same tool).

### Check 6: Eval Alignment

Verify that `evals/evals.json` uses correct tool names in:
- `expected_output` fields
- `expectations` array entries

### Check 7: Generated File Freshness

Run `npm run check` to verify `skills/index.json` and `llms.txt` are up to date with source skills. If they're stale, run `npm run build`.

### Check 8: Cross-Repo Skill Coverage

Compare skills listed in:
- MCP server `skill://index` resource
- This repo's `skills/index.json`
- Upstream repo documentation

Detect skills that exist in one place but not another.

---

## Phase 3: Report

Print a structured report:

```
## Consistency Audit Report

Date: <ISO date>
MCP server: <URL>
Upstream repo: debridge-finance/debridge-mcp @ <commit or "latest">
This repo: debridge-finance/debridge-skills @ <current HEAD>

### Tool Inventory

| Tool | MCP Server | MCP Skills | This Repo | Upstream SKILL.md |
|------|:---:|:---:|:---:|:---:|
| get_instructions       | Y | Y | ? | ? |
| get_supported_chains   | Y | Y | ? | ? |
| search_tokens          | Y | Y | ? | ? |
| create_tx              | Y | Y | ? | ? |
| transaction_same_chain_swap | Y | Y | ? | ? |
| estimate_same_chain_swap    | - | - | ? | ? |
| get_trade_dapp_url          | - | - | ? | ? |

### Inconsistencies Found

| # | Severity | Source | Issue | Fix Location |
|---|----------|--------|-------|--------------|
| 1 | HIGH     | ...    | ...   | ...          |

### Parameter Coverage

| Tool | Param | Required | In MCP Skill | In Repo Skill | In Upstream |
|------|-------|:---:|:---:|:---:|:---:|

### Workflow Comparison

| Step | MCP get_instructions | MCP workflow skill | This repo swap/SKILL.md | Upstream SKILL.md |
|------|---|---|---|---|

### Summary

- Total checks: <N>
- Pass: <N>
- Fail: <N>
- Fixable in this repo: <N>
- Fixable upstream: <N>
```

---

## Phase 4: Auto-Fix (this repo only)

For inconsistencies fixable in this repo:

1. Apply the fix (edit skills, evals, or scripts).
2. Run `npm run build` — must pass with 0 failures.
3. Present the diff to the user.

For inconsistencies in upstream repos:

1. Describe the exact fix needed (diff format).
2. Identify the file and repo (`debridge-finance/debridge-mcp`, `SKILL.md`).
3. Offer to draft a PR description.

**Do NOT auto-fix upstream repos without user confirmation.**

---

## Phase 5: Regression Guard

After fixing, re-run Phase 2 to confirm zero inconsistencies remain in this repo.

If the user requests it, generate test case JSON files for programmatic re-testing:
```bash
node tests/mcp-calls/run.mjs
```

---

## Known Patterns to Watch For

These are recurring inconsistency patterns discovered in past audits:

| Pattern | Description | Where to Check |
|---------|-------------|----------------|
| **Tool rename lag** | MCP server renames a tool but docs/skills still use the old name | All skill files, evals, upstream SKILL.md |
| **Ghost tool** | A tool is documented but doesn't exist on the server (removed or never shipped) | Upstream SKILL.md, this repo's skills |
| **Param drift** | New optional params added to MCP server but not documented in skills | MCP tool schema vs skill "Optional parameters" sections |
| **Workflow fork** | Different sources describe different step counts or ordering | `get_instructions` vs skill resources vs repo skills |
| **Description semantic shift** | Tool renamed from "estimate" to "create/transaction" but description still says "estimate" | Tool descriptions across all sources |
| **Stale generated files** | `skills/index.json` or `llms.txt` out of sync with source skill files | `npm run check` |
| **Eval drift** | Eval expectations reference old tool names after a rename | `evals/evals.json` |
