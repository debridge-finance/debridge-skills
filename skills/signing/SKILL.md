---
name: debridge-signing
description: >
  Sign and broadcast deBridge transactions. Routes to the correct signing
  method based on the detected signer: private key with ethers/viem, Foundry
  cast, browser wallet (MetaMask), web3.py, or Privy embedded wallet. Use
  this skill whenever a deBridge transaction needs to be signed and sent
  on-chain — including bridge transactions, swap transactions, and token
  approvals. Also use when the user asks "how do I sign this transaction",
  "send the transaction", "approve the token", "broadcast to chain", or
  needs help with EIP-712 typed data signing. This skill is called
  automatically by the bridge and swap workflows, but can also be used
  standalone for signing guidance.
license: MIT
metadata:
  author: deBridge
  version: "0.1.0"
---

# Transaction Signing

PREREQUISITE: Read ../common/SKILL.md for environment detection, auth, and chain configuration.

## Quick Reference

| Want to...                        | Go to                              |
|-----------------------------------|------------------------------------|
| Sign with ethers.js or viem       | [sdk-signer.md](sdk-signer.md)    |
| Sign with Foundry cast            | [foundry-cast.md](foundry-cast.md)|
| Sign with MetaMask / browser      | [metamask.md](metamask.md)        |
| Sign with Python web3.py          | [web3py.md](web3py.md)            |
| Sign via Privy MCP                | [privy-mcp.md](privy-mcp.md)      |
| Set up a wallet from scratch      | ../wallets/SKILL.md               |

## What Needs Signing

deBridge transactions from `mcp__debridge__create_tx` require two signing operations:

1. **Token approval tx** (if allowance insufficient) — a standard EVM transaction calling `approve()` on the token contract.
2. **Bridge/swap tx** — an EVM transaction that may include EIP-712 typed data for DLN order creation.

Both are standard `{to, data, value, chainId}` objects. Sign and broadcast to the source chain RPC.

## Signer Routing

Use the `Signer` value from common Phase 3 to select the right reference:

| Signer value    | Environment    | Read this file                       |
|-----------------|----------------|--------------------------------------|
| env-privkey     | CLI + Node.js  | [sdk-signer.md](sdk-signer.md)      |
| env-privkey     | CLI + cast     | [foundry-cast.md](foundry-cast.md)  |
| env-privkey     | CLI + Python   | [web3py.md](web3py.md)              |
| foundry-cast    | CLI            | [foundry-cast.md](foundry-cast.md)  |
| browser-wallet  | Browser        | [metamask.md](metamask.md)          |
| ethers-viem     | CLI / Headless | [sdk-signer.md](sdk-signer.md)      |
| web3py          | CLI / Headless | [web3py.md](web3py.md)              |
| mcp-wallet      | Any            | [privy-mcp.md](privy-mcp.md)        |
| none            | Any            | ../wallets/SKILL.md — set up first  |

### Resolving env-privkey

When Signer = `env-privkey`, a private key exists but a signing library is still needed. Pick based on what is available:

1. Node.js + ethers or viem installed → [sdk-signer.md](sdk-signer.md)
2. `cast` available → [foundry-cast.md](foundry-cast.md)
3. Python + web3 installed → [web3py.md](web3py.md)
4. None of the above → install one: `npm install ethers` is the fastest path.

## Transaction Flow

After `mcp__debridge__create_tx` returns tx data:

### Step 1: Check for Approval

If the response includes an approval transaction (`approveTx`):
1. Sign and send the approval tx first.
2. Wait for confirmation (1 block).
3. Proceed to Step 2.

### Step 2: Sign and Send Bridge Transaction

1. Take the main tx object (`tx` field from `create_tx` response).
2. Sign with the detected signer.
3. Broadcast to the source chain RPC.
4. Record the transaction hash.

### Step 3: Hand Off to Monitoring

After broadcast, pass the tx hash to ../swap/SKILL.md monitoring section for order tracking.

## RPC Endpoints

Most signers need an RPC connection to the source chain:
- ethers/viem: pass RPC URL to provider constructor
- cast: use `--rpc-url` flag
- browser wallet: uses the wallet's connected RPC
- web3.py: pass RPC URL to `Web3(HTTPProvider(url))`
- Privy MCP: handles RPC internally — no RPC URL needed from the agent

Use public RPCs or the user's configured RPC. Do not hardcode RPC URLs in skill content — let the user provide them or detect from environment (`$ETH_RPC_URL`, `$RPC_URL`).

For programmatic RPC discovery from Chainlist, read ../common/rpc-discovery.md.

## Common Errors

| Error                       | Cause                          | Fix                                            |
|-----------------------------|--------------------------------|-------------------------------------------------|
| Insufficient funds for gas  | Wallet has no native token     | Fund wallet with ETH/native token on source chain |
| Nonce too low               | Pending tx or state mismatch   | Wait for pending tx or reset nonce              |
| Transaction reverted        | Approval not confirmed yet     | Wait for approval confirmation before bridge tx |
| Invalid signature           | Wrong chain ID in signer       | Ensure signer chain ID matches source chain     |

## References

- [sdk-signer.md](sdk-signer.md) — ethers.js and viem signing
- [foundry-cast.md](foundry-cast.md) — Foundry cast CLI signing
- [metamask.md](metamask.md) — Browser wallet signing
- [web3py.md](web3py.md) — Python web3.py signing
- [privy-mcp.md](privy-mcp.md) — Privy embedded wallet signing via MCP
