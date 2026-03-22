---
title: Token Prices and Market Data
impact: HIGH
impactDescription: "Price verification before bridge/swap operations"
tags: prices, market-data, coingecko, alchemy, ohlcv, trending
---

# Token Prices and Market Data

Real-time and historical token pricing. Use before deBridge operations to verify token value, check price impact, or compare across chains.

## CoinGecko MCP (Primary — No API Key)

CoinGecko covers 15,000+ coins across 200+ networks including on-chain DEX data via GeckoTerminal.

### Installation

Hosted endpoint (no install, no key):

```bash
# Claude Code
claude mcp add --transport http coingecko https://mcp.api.coingecko.com/mcp
```

```json
// Claude Desktop
{
  "mcpServers": {
    "coingecko": {
      "type": "streamable-http",
      "url": "https://mcp.api.coingecko.com/mcp"
    }
  }
}
```

Local (one-shot):

```bash
npx -y @coingecko/coingecko-mcp
```

Local with Pro key (higher rate limits):

```bash
# Claude Code
claude mcp add coingecko -- npx -y @coingecko/coingecko-mcp \
  --env COINGECKO_PRO_API_KEY=<your-key>
```

### Key Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `coingecko_price` | `ids` (coin IDs), `vs_currencies` (e.g., "usd"), `include_market_cap`, `include_24hr_vol`, `include_24hr_change` | Current prices with optional market cap and volume |
| `coingecko_coin_data` | `id` (coin ID) | Full coin data: description, links, market data |
| `coingecko_list` | `include_platform` (boolean) | All coins with IDs and platform contract addresses |
| `get_trending_md_doc` | — | Trending coins and NFTs |
| `get_coins_contract` | `id` (platform), `contract_address` | Coin data by contract address |
| `get_range_coins_market_chart` | `id`, `vs_currency`, `from`, `to` | Historical OHLCV in a date range |
| `get_tokens_networks_onchain_info` | `network`, `address` | On-chain token info via GeckoTerminal |

### CoinGecko Coin IDs

CoinGecko uses slug-style IDs (not ticker symbols):
- ETH → `ethereum`
- USDC → `usd-coin`
- SOL → `solana`

Call `coingecko_list` or `coingecko_coin_data` to resolve a symbol to its CoinGecko ID.

### Example: Check Price Before Bridging

```
1. Call mcp__coingecko__coingecko_price:
     ids: "usd-coin"
     vs_currencies: "usd"
     include_24hr_change: true

2. Verify USDC is at expected peg ($1.00 ± 0.01).

3. If stable → proceed to ../swap/SKILL.md.
   If depegged → warn the user before proceeding.
```

---

## Alchemy MCP (Alternative — API Key Required)

Alchemy provides token pricing by symbol and by contract address, plus historical price data. Useful when CoinGecko rate limits are hit or when querying by contract address directly.

### Installation

```bash
# One-shot
npx -y @alchemy/mcp-server

# Persistent
npm install -g @alchemy/mcp-server

# Claude Code
claude mcp add alchemy -- npx -y @alchemy/mcp-server \
  --env ALCHEMY_API_KEY=<your-key>
```

```json
// Claude Desktop
{
  "mcpServers": {
    "alchemy": {
      "command": "npx",
      "args": ["-y", "@alchemy/mcp-server"],
      "env": {
        "ALCHEMY_API_KEY": "<your-key>"
      }
    }
  }
}
```

Get a free API key at [alchemy.com](https://www.alchemy.com).

### Key Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `fetchTokenPriceBySymbol` | `symbols` (e.g., "ETH", "USDC") | Current price by ticker symbol |
| `fetchTokenPriceByAddress` | `address`, `network` | Price by contract address and network |
| `fetchTokenPriceHistoryBySymbol` | `symbol`, `startDate`, `endDate`, `interval` | Historical price chart |
| `fetchTokenPriceHistoryByTimeFrame` | `symbol`, `timeFrame` | Historical by timeframe shorthand |

### Example: Compare Token Prices Across Chains

```
1. Call mcp__alchemy__fetchTokenPriceByAddress:
     address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  // USDC on Ethereum
     network: "eth-mainnet"

2. Call mcp__alchemy__fetchTokenPriceByAddress:
     address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"  // USDC on Arbitrum
     network: "arb-mainnet"

3. Compare prices — any discrepancy may indicate an arbitrage opportunity
   or a bridging price impact to communicate to the user.
```

---

## When to Use Which

| Scenario | Use |
|----------|-----|
| Quick price check by coin name | CoinGecko (hosted, no key) |
| Price by contract address | Alchemy or CoinGecko `get_coins_contract` |
| Historical OHLCV chart | CoinGecko `get_range_coins_market_chart` |
| On-chain DEX token data | CoinGecko (GeckoTerminal tools) |
| Trending coins and markets | CoinGecko `get_trending_md_doc` |
| Combined price + balance query | Alchemy (has both pricing and balance tools) |
