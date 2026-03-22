---
title: DeFi Protocol Analytics — TVL, Fees, Yields
impact: HIGH
impactDescription: "Protocol health and yield data for informed bridging decisions"
tags: defillama, tvl, fees, revenue, yields, stablecoins, dex-volume
---

# DeFi Protocol Analytics

DefiLlama provides protocol TVL, fee revenue, yield farming data, DEX volumes, stablecoin metrics, and token prices — all without an API key.

## Installation

Two npm packages are available. Both wrap the DefiLlama public API.

### @nic0xflamel/defillama-mcp-server (OpenAPI proxy)

Dynamically generates tools from the full DefiLlama OpenAPI surface.

```bash
# One-shot
npx -y @nic0xflamel/defillama-mcp-server

# Persistent
npm install -g @nic0xflamel/defillama-mcp-server

# Claude Code
claude mcp add defillama -- npx -y @nic0xflamel/defillama-mcp-server
```

```json
// Claude Desktop
{
  "mcpServers": {
    "defillama": {
      "command": "npx",
      "args": ["-y", "@nic0xflamel/defillama-mcp-server"]
    }
  }
}
```

### @iqai/defillama-mcp (curated tools with AI entity resolution)

16 typed tools with fuzzy matching on protocol and chain names.

```bash
# One-shot
pnpm dlx @iqai/defillama-mcp

# Claude Code
claude mcp add defillama -- pnpm dlx @iqai/defillama-mcp
```

```json
// Claude Desktop
{
  "mcpServers": {
    "defillama": {
      "command": "pnpm",
      "args": ["dlx", "@iqai/defillama-mcp"]
    }
  }
}
```

No API key required for either package.

---

## Key Tools (@iqai/defillama-mcp)

### TVL and Protocols

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_chains` | `order` (asc/desc) | Blockchains ranked by TVL (top 20) |
| `defillama_get_protocol_data` | `protocol` (auto-resolved), `sortCondition` (change_1h/1d/7d/tvl) | Protocol TVL data; omit protocol for top 10 |
| `defillama_get_historical_chain_tvl` | `chain` (auto-resolved) | Historical TVL over time (last 10 points) |

### DEX Volumes

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_dexs_data` | `protocol`, `chain`, `sortCondition` (total24h), `order` | DEX trading volume metrics |

### Fees and Revenue

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_fees_and_revenue` | `protocol`, `chain`, `dataType` (dailyFees/dailyRevenue/dailyHoldersRevenue), `sortCondition`, `order` | Protocol fee and revenue metrics |

### Yields

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_latest_pool_data` | `sortCondition` (tvlUsd/apy/apyBase/apyReward), `order`, `limit` (1-100) | Current yield farming pools with APY |
| `defillama_get_historical_pool_data` | `pool` (UUID from latest pool data) | Historical APY/TVL for a specific pool |

### Stablecoins

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_stablecoin` | `includePrices` (boolean) | Top 20 stablecoins with circulation |
| `defillama_get_stablecoin_chains` | — | Chains ranked by stablecoin market cap |
| `defillama_get_stablecoin_charts` | `stablecoin`, `chain` | Historical stablecoin market cap |

### Token Prices

| Tool | Parameters | Description |
|------|-----------|-------------|
| `defillama_get_prices_current_coins` | `coins` ("chain:address"), `searchWidth` | Current token prices by contract |
| `defillama_get_chart_coins` | `coins`, `start`, `end`, `period` | Historical price time-series |
| `defillama_get_percentage_coins` | `coins`, `period` (1d/7d/30d) | Price change percentage |

---

## Example: Research Before a Large Bridge

```
1. Check deBridge TVL across chains:
   Call defillama_get_protocol_data:
     protocol: "debridge"

2. Check yield opportunities on destination chain:
   Call defillama_get_latest_pool_data:
     sortCondition: "apy"
     order: "desc"
     limit: 10

3. Check stablecoin liquidity on destination chain:
   Call defillama_get_stablecoin_chains

4. Use findings to advise the user on which chain and token
   to bridge to for the best yield or liquidity.
```

## Example: Verify Token Price via Contract Address

DefiLlama prices use `chain:address` format:

```
Call defillama_get_prices_current_coins:
  coins: "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

Returns: { price: 1.0001, symbol: "USDC", ... }
```

Supported chain slugs: `ethereum`, `bsc`, `polygon`, `arbitrum`, `optimism`, `base`, `avalanche`, `solana`, and more.

---

## Data Coverage

DefiLlama tracks 5,000+ protocols across 250+ chains. Data categories:

| Category | Coverage |
|----------|----------|
| TVL | All tracked protocols and chains |
| DEX volume | Major DEXes (Uniswap, Curve, PancakeSwap, etc.) |
| Fees/Revenue | Protocols that report fee data |
| Yields | 10,000+ yield pools across DeFi |
| Stablecoins | 100+ stablecoins with chain-level data |
| Token prices | Any token with a chain:address identifier |
