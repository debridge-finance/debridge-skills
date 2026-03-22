---
title: Multi-Chain Wallet and Token Data
impact: MEDIUM
impactDescription: "Cross-chain wallet balances and token metadata for bridge source selection"
tags: moralis, alchemy, wallet, balances, tokens, nft, multi-chain, transactions
---

# Multi-Chain Wallet and Token Data

Query wallet balances, token metadata, transaction history, and NFT holdings across many chains in a single call. Use before deBridge operations to find which chain holds the most of a token, or after to verify delivery.

## Moralis MCP (Primary — 100+ Chains)

Moralis wraps 100+ blockchain API endpoints covering token pricing, wallet analytics, transaction history, and NFT data. Tools are dynamically generated from the Moralis REST API.

### Installation

```bash
# One-shot
npx @moralisweb3/api-mcp-server

# Persistent
npm install -g @moralisweb3/api-mcp-server

# Claude Code
claude mcp add moralis -- npx @moralisweb3/api-mcp-server \
  --env MORALIS_API_KEY=<your-key>
```

```json
// Claude Desktop
{
  "mcpServers": {
    "moralis": {
      "command": "npx",
      "args": ["@moralisweb3/api-mcp-server"],
      "env": {
        "MORALIS_API_KEY": "<your-key>"
      }
    }
  }
}
```

Get a free API key at [moralis.io](https://moralis.io).

### Key Capabilities

Moralis tools are dynamically named based on API endpoints. Common operations:

| Operation | Description |
|-----------|-------------|
| Get wallet token balances | ERC-20 balances with USD values per chain |
| Get wallet native balance | Native token (ETH, MATIC, etc.) per chain |
| Get wallet transaction history | All transactions for an address |
| Get token metadata | Name, symbol, decimals, logo, price |
| Get token price | Current price with exchange data |
| Get token transfers | ERC-20 transfer history by address |
| Get NFTs by wallet | NFT holdings with metadata |
| Get wallet net worth | Aggregated portfolio value |

### Supported Chains

Moralis supports Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Fantom, Cronos, Gnosis, Linea, and 90+ more. Pass chains as identifiers like `eth`, `polygon`, `arbitrum`, `base`, `bsc`, `optimism`, `avalanche`.

### Example: Find Best Chain to Bridge From

```
1. Query token balances across chains for the user's wallet:

   Call Moralis wallet balance endpoint for each chain:
     address: "0xYourWallet"
     chain: "eth"       → returns USDC: 500
     chain: "arbitrum"  → returns USDC: 2000
     chain: "base"      → returns USDC: 150

2. Arbitrum has the most USDC → recommend bridging from Arbitrum.

3. Proceed to ../swap/SKILL.md with source chain = Arbitrum.
```

### Example: Verify Bridge Delivery

```
1. After bridge completes:

   Call Moralis token balance endpoint:
     address: "0xDestinationWallet"
     chain: "base"

2. Confirm USDC balance increased by the expected amount.
```

---

## Alchemy MCP (Alternative — Multichain Queries)

Alchemy provides multichain address queries in a single call. Useful for aggregated views without iterating over chains.

### Installation

```bash
# One-shot
npx -y @alchemy/mcp-server

# Claude Code
claude mcp add alchemy -- npx -y @alchemy/mcp-server \
  --env ALCHEMY_API_KEY=<your-key>
```

Get a free API key at [alchemy.com](https://www.alchemy.com).

### Key Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `fetchTokensOwnedByMultichainAddresses` | `addresses` (array), `chains` (array) | Token balances across multiple chains in one call |
| `fetchAddressTransactionHistory` | `address`, `networks` (array) | Transaction history across chains |
| `fetchTransfers` | `address`, filters | Detailed asset movement data |
| `fetchNftsOwnedByMultichainAddresses` | `addresses`, spam filter | NFT holdings across chains |
| `fetchNftContractDataByMultichainAddress` | `address` | NFT collection metadata |

### Alchemy Network Identifiers

| Chain | Network ID |
|-------|-----------|
| Ethereum | `eth-mainnet` |
| Arbitrum | `arb-mainnet` |
| Base | `base-mainnet` |
| Polygon | `polygon-mainnet` |
| Optimism | `opt-mainnet` |

### Example: Cross-Chain Portfolio View

```
Call mcp__alchemy__fetchTokensOwnedByMultichainAddresses:
  addresses: ["0xYourWallet"]
  chains: ["eth-mainnet", "arb-mainnet", "base-mainnet", "opt-mainnet"]

Returns all ERC-20 balances per chain — a single call for the full picture.
```

---

## When to Use Which

| Scenario | Use |
|----------|-----|
| Broad chain coverage (100+ chains) | Moralis |
| Single multichain query (one API call) | Alchemy `fetchTokensOwnedByMultichainAddresses` |
| Token price alongside balance | Moralis (returns USD values with balances) |
| NFT holdings | Both (Moralis or Alchemy) |
| No API key available | Use Blockscout (see [onchain-explorer.md](onchain-explorer.md)) per-chain instead |
