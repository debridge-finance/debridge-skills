---
name: test-debridge
description: >
  End-to-end functional test of deBridge skills, MCP tools, and bundled scripts.
  Exercises wallet discovery, balance checks, token search, quoting, approvals,
  cross-chain swaps (EVM↔EVM, EVM↔Solana), and order monitoring. Use when:
  "test deBridge", "run integration tests", "smoke test skills", "verify
  everything works", or after making changes to skills/scripts.
---

# deBridge Functional Test

Cover as many features and code paths as possible while minimizing on-chain spend.

## Execution Order

1. **Read-only operations** — exhaustive, no confirmation needed
2. **Write operations plan** — present to user for approval before executing
3. **Diagnosis** — run `/skill-diagnosis` to analyze any failures

---

## Phase 1: Environment Setup

Follow `skills/common/SKILL.md` (all three phases). Record all discovered wallets, addresses, signer type, MCP method, and supported chains.

If NO wallet is discovered, search git history and script examples for publicly mentioned addresses. Use those for read-only tests only.

---

## Phase 2: Read-Only Tests

Report each as PASS/FAIL. Exercise every MCP tool, every bundled script flag variant, and every read-only code path:

- **Token search** — multiple chains, token types (native, stablecoin, obscure), verify addresses and decimals
- **Balance checks** — per `skills/analytics/SKILL.md`, plus exercise all flag variants of each script
- **RPC discovery** — verify resolution for several EVM chains and Solana
- **Cross-chain quotes** — call `create_tx` for each route combination (EVM→EVM, EVM→Solana, Solana→EVM, native→native, ERC-20→ERC-20, stablecoin→native) — parse but do NOT sign
- **Same-chain swap estimate** — verify response format
- **ERC-20 allowance reads** — check allowance status for tokens with balances
- **Order status API** — per `skills/swap/monitoring.md`, verify reachability
- **Analytics MCPs** — if available, test price lookups and token enumeration
- **Repo validation** — `npm run validate`, all rules must pass

---

## Phase 3: Write Operations Plan

Analyze Phase 2 results and propose a plan that:

1. **Maximizes coverage** — EVM→EVM, EVM→Solana, Solana→EVM, approval flow, same-chain swap, native token bridge
2. **Minimizes cost** — smallest viable amounts, prefer low-gas chains
3. **Prioritizes recent changes** — focus on recently changed scripts/skills from git history
4. **Verifies full pipeline** — per `skills/signing/SKILL.md` and `skills/swap/monitoring.md`

Print plan as a table. **STOP and wait for user confirmation.**

---

## Phase 4: Execute Write Operations

For each approved test, follow `skills/signing/SKILL.md` and `skills/swap/monitoring.md`. Verify destination balance per `skills/analytics/SKILL.md`.

---

## Phase 5: Results & Diagnosis

Print summary table of all results. Invoke `/skill-diagnosis` with every failure and deviation.
