---
title: DEX Pool Analytics — Liquidity, OHLCV, Trades
impact: MEDIUM
impactDescription: "Pool liquidity and price data for swap destination assessment"
tags: dexpaprika, dex, pools, ohlcv, liquidity, trades, coinpaprika
---

# DEX Pool Analytics

DexPaprika provides real-time DEX pool data: liquidity, OHLCV candles, recent trades, and token info across multiple networks. No API key required. Use before deBridge swaps to assess destination pool depth and recent trading activity.

## Installation

```bash
# One-shot
npx dexpaprika-mcp

# Persistent
npm install -g dexpaprika-mcp

# Claude Code
claude mcp add dexpaprika -- npx dexpaprika-mcp
```

```json
// Claude Desktop
{
  "mcpServers": {
    "dexpaprika": {
      "command": "npx",
      "args": ["dexpaprika-mcp"]
    }
  }
}
```

No API key needed.

## Key Tools

### Discovery

| Tool | Parameters | Description |
|------|-----------|-------------|
| `getNetworks` | — | All supported networks |
| `search` | `query` | Search tokens, pools, DEXes by name/symbol/address |
| `getStats` | — | Aggregate DEX statistics |

### Pool Data

| Tool | Parameters | Description |
|------|-----------|-------------|
| `getNetworkPools` | `network` | All pools on a network |
| `getDexPools` | `network`, `dex` | Pools for a specific DEX |
| `getNetworkPoolsFilter` | `network`, `volume_24h_min`, `created_after`, `sort_by`, `limit` | Filtered pool search |
| `getPoolDetails` | `network`, `pool_address` | Full pool info: TVL, volume, fees |
| `getPoolOHLCV` | `network`, `pool_address`, `start`, `interval`, `limit` | Candlestick price data |
| `getPoolTransactions` | `network`, `pool_address` | Recent swaps and trades |

### Token Data

| Tool | Parameters | Description |
|------|-----------|-------------|
| `getTokenDetails` | `network`, `token_address` | Token metadata and market data |
| `getTokenPools` | `network`, `token_address`, `order_by`, `limit` | Pools containing a token |
| `getTokenMultiPrices` | `network`, `tokens[]` (up to 10) | Batch token prices |

## Supported Networks

DexPaprika uses network slug identifiers:

| Network | Slug |
|---------|------|
| Ethereum | `ethereum` |
| Arbitrum | `arbitrum` |
| Base | `base` |
| Polygon | `polygon` |
| BSC | `bsc` |
| Optimism | `optimism` |
| Avalanche | `avalanche` |
| Solana | `solana` |

Call `getNetworks` for the full list.

## Example: Check Liquidity Before Cross-Chain Swap

```
1. Search for the destination token:
   Call mcp__dexpaprika__search:
     query: "USDC base"

2. Get pools containing the token:
   Call mcp__dexpaprika__getTokenPools:
     network: "base"
     token_address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
     order_by: "volume_24h"
     limit: 5

3. Check the top pool's details:
   Call mcp__dexpaprika__getPoolDetails:
     network: "base"
     pool_address: "<pool-address-from-step-2>"

4. If 24h volume > bridge amount and TVL is healthy →
   proceed with the swap.
   If low liquidity → warn the user about potential slippage.
```

## Example: Get Price Candles for a Pool

```
Call mcp__dexpaprika__getPoolOHLCV:
  network: "ethereum"
  pool_address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"  // USDC/ETH on Uniswap V3
  start: "2025-01-01"
  interval: "1d"
  limit: 30

Returns 30 daily candles with open, high, low, close, and volume.
```
