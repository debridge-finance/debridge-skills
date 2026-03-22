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

19 typed tools with fuzzy matching on protocol and chain names. Includes token pricing endpoints not available in @nic0xflamel.

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

Tool names differ between the two packages. Both are verified — see sections below.

No API key required for either package.

---

## Key Tools (@nic0xflamel/defillama-mcp-server)

### TVL and Protocols

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_v2_chains` | (none) | Current TVL of all chains |
| `get_protocols` | (none) | List all protocols with TVL |
| `get_tvl__by_protocol` | `protocol`\* | Current TVL of a specific protocol |
| `get_v2_historicalChainTvl` | (none) | Historical TVL of DeFi on all chains |
| `get_v2_historicalChainTvl__by_chain` | `chain`\* | Historical TVL of a specific chain |

### DEX Volumes

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_overview_dexs` | `excludeTotalDataChart`, `excludeTotalDataChartBreakdown` | DEX volume summaries across all chains |
| `get_overview_dexs__by_chain` | `chain`\*, `excludeTotalDataChart`, `excludeTotalDataChartBreakdown` | DEX volumes for a specific chain |
| `get_summary_dexs__by_protocol` | `protocol`\*, `excludeTotalDataChart`, `excludeTotalDataChartBreakdown` | DEX volume for a specific protocol |

### Fees and Revenue

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_overview_fees` | `excludeTotalDataChart`, `excludeTotalDataChartBreakdown`, `dataType` (dailyFees/dailyRevenue) | Fee and revenue summaries |
| `get_overview_fees__by_chain` | `chain`\*, `excludeTotalDataChart`, `excludeTotalDataChartBreakdown`, `dataType` | Fees and revenue for a specific chain |
| `get_summary_fees__by_protocol` | `protocol`\*, `dataType` (dailyFees/dailyRevenue) | Fees and revenue for a specific protocol |

### Yields

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_pools` | (none) | Latest data for all yield pools with predictions |
| `get_chart__by_pool` | `pool`\* (UUID from pool data) | Historical APY and TVL for a specific pool |

### Stablecoins

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_stablecoincharts_all` | `stablecoin` (integer — optional filter) | Historical market cap sum of all stablecoins |

> **Note:** @nic0xflamel does not include token pricing tools. Use @iqai (below) or CoinGecko MCP for pricing.

---

## Key Tools (@iqai/defillama-mcp)

All @iqai tools support AI entity resolution — pass protocol/chain names as-is (e.g., "Uniswap", "Ethereum") and they auto-resolve to slugs.

### TVL and Protocols

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_chains` | `order` (asc/desc) | Chains ranked by TVL (top 20) |
| `defillama_get_protocol_data` | `protocol`, `sortCondition` (change_1h/1d/7d/tvl), `order` | Protocol TVL; omit protocol for top 10 |
| `defillama_get_historical_chain_tvl` | `chain` | Historical TVL over time (last 10 points) |

### DEX Volumes

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_dexs_data` | `protocol`, `chain`, `sortCondition` (total24h/total7d/total30d/change_1d/change_7d/change_1m), `order` | DEX trading volume metrics |

### Fees and Revenue

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_fees_and_revenue` | `protocol`, `chain`, `dataType` (dailyFees/dailyRevenue/dailyHoldersRevenue), `sortCondition`, `order` | Protocol fee and revenue metrics |

### Yields

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_latest_pool_data` | `sortCondition` (tvlUsd/apy/apyBase/apyReward/apyMean30d), `order`, `limit` (1-100) | Current yield farming pools with APY |
| `defillama_get_historical_pool_data` | `pool`\* (UUID from latest pool data) | Historical APY/TVL for a specific pool |

### Stablecoins

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_stablecoin` | `includePrices` (boolean) | Top 20 stablecoins with circulation |
| `defillama_get_stablecoin_chains` | (none) | Chains ranked by stablecoin market cap |
| `defillama_get_stablecoin_charts` | `stablecoin` (ID or name), `chain` | Historical stablecoin market cap |
| `defillama_get_stablecoin_prices` | (none) | Historical stablecoin price data |

### Token Prices (only in @iqai)

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_prices_current_coins` | `coins`\* ("chain:address"), `searchWidth` | Current token prices by contract |
| `defillama_get_chart_coins` | `coins`\*, `start`, `end`, `span`, `period`, `searchWidth` | Historical price time-series |
| `defillama_get_percentage_coins` | `coins`\*, `timestamp`, `period` (1h/1d/7d), `lookForward` | Price change percentage |
| `defillama_get_historical_prices_by_contract` | `coins`\*, `timestamp`\*, `searchWidth` | Historical prices at a specific time |
| `defillama_get_batch_historical` | `coins`\*, `searchWidth` | Historical prices at multiple timestamps |
| `defillama_get_prices_first_coins` | `coins`\* | First recorded price for tokens |

### Other (only in @iqai)

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `defillama_get_options_data` | `dataType`, `protocol`, `chain`, `sortCondition`, `order` | Options protocol volume and premiums |
| `defillama_get_blockchain_timestamp` | `chain`\*, `timestamp`\* | Block number at a specific time |

---

## Tool Name Mapping

Both packages cover the same data. Quick mapping:

| Category | @nic0xflamel | @iqai |
|----------|-------------|-------|
| All chains TVL | `get_v2_chains` | `defillama_get_chains` |
| Protocol TVL | `get_tvl__by_protocol` | `defillama_get_protocol_data` |
| Historical chain TVL | `get_v2_historicalChainTvl__by_chain` | `defillama_get_historical_chain_tvl` |
| DEX volumes | `get_overview_dexs` | `defillama_get_dexs_data` |
| Fees/revenue | `get_overview_fees` | `defillama_get_fees_and_revenue` |
| Yield pools | `get_pools` | `defillama_get_latest_pool_data` |
| Pool history | `get_chart__by_pool` | `defillama_get_historical_pool_data` |
| Token prices | — | `defillama_get_prices_current_coins` |

---

## Example: Research Before a Large Bridge

Using @nic0xflamel tool names (prefix with `mcp__defillama__` when calling via MCP):

```
1. Check deBridge TVL:
   Call mcp__defillama__get_tvl__by_protocol:
     protocol: "debridge"

2. Check yield opportunities on destination chain:
   Call mcp__defillama__get_pools
   (filter results client-side by chain and sort by APY)

3. Check stablecoin market cap trends:
   Call mcp__defillama__get_stablecoincharts_all

4. Use findings to advise the user on which chain and token
   to bridge to for the best yield or liquidity.
```

Using @iqai tool names:

```
1. Call mcp__defillama__defillama_get_protocol_data:
     protocol: "debridge"

2. Call mcp__defillama__defillama_get_latest_pool_data:
     sortCondition: "apy"
     order: "desc"
     limit: 10

3. Call mcp__defillama__defillama_get_stablecoin_chains
```

## Example: Verify Token Price via Contract Address (@iqai only)

```
Call mcp__defillama__defillama_get_prices_current_coins:
  coins: "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

Returns: { price: 1.0001, symbol: "USDC", ... }
```

Supported chain slugs: `ethereum`, `bsc`, `polygon`, `arbitrum`, `optimism`, `base`, `avalanche`, `solana`.

For token pricing without @iqai, use CoinGecko MCP (see [token-prices.md](token-prices.md)).

---

## Data Coverage

DefiLlama tracks 5,000+ protocols across 250+ chains. Data categories:

| Category | Coverage |
|----------|----------|
| TVL | All tracked protocols and chains |
| DEX volume | Major DEXes (Uniswap, Curve, PancakeSwap, etc.) |
| Fees/Revenue | Protocols that report fee data |
| Yields | 10,000+ yield pools across DeFi |
| Stablecoins | 100+ stablecoins with historical market cap data |
