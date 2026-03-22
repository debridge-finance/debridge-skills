---
title: Token Prices and Market Data
impact: HIGH
impactDescription: "Price verification before bridge/swap operations"
tags: prices, market-data, coingecko, ohlcv, trending
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

### Key Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_simple_price` | `vs_currencies`* (string), `ids` (string), `symbols` (string), `names` (string), `include_market_cap`, `include_24hr_vol`, `include_24hr_change`, `include_last_updated_at`, `precision` | Current prices with optional market cap and volume |
| `get_id_coins` | `id`* (coin ID), `market_data`, `localization`, `tickers`, `community_data`, `developer_data`, `sparkline` | Full coin data: description, links, market data |
| `get_coins_markets` | `vs_currency`* (e.g., "usd"), `ids`, `symbols`, `names`, `category`, `order`, `per_page`, `page`, `sparkline`, `price_change_percentage`, `precision` | Paginated market data for multiple coins |
| `get_search` | `query`* (string) | Search coins, categories, and exchanges by keyword |
| `get_search_trending` | `show_max` (string) | Trending coins and NFTs |
| `get_id_simple_token_price` | `id`* (platform), `contract_addresses`* (string), `vs_currencies`* (string), `include_market_cap`, `include_24hr_vol`, `include_24hr_change`, `include_last_updated_at`, `precision` | Token price by contract address on a platform |
| `get_coins_contract` | `id`* (platform), `contract_address`* | Coin data by contract address |
| `get_range_coins_market_chart` | `id`*, `vs_currency`*, `from`*, `to`*, `interval`, `precision` | Historical OHLCV in a date range |
| `get_range_coins_ohlc` | `id`*, `vs_currency`*, `from`*, `to`*, `interval`* | OHLC candlestick data in a date range |
| `get_tokens_networks_onchain_info` | `network`*, `address`* | On-chain token info via GeckoTerminal |

### CoinGecko Coin IDs

CoinGecko uses slug-style IDs (not ticker symbols):
- ETH → `ethereum`
- USDC → `usd-coin`
- SOL → `solana`

Call `get_search` or `get_id_coins` to resolve a symbol to its CoinGecko ID.

### Example: Check Price Before Bridging

```
1. Call mcp__coingecko__get_simple_price:
     ids: "usd-coin"
     vs_currencies: "usd"
     include_24hr_change: true

2. Verify USDC is at expected peg ($1.00 ± 0.01).

3. If stable → proceed to ../swap/SKILL.md.
   If depegged → warn the user before proceeding.
```

---

## Common Use Cases

| Scenario | Tool |
|----------|------|
| Quick price check by coin name | `get_simple_price` (hosted, no key) |
| Price by contract address | `get_coins_contract` or `get_id_simple_token_price` |
| Historical OHLCV chart | `get_range_coins_market_chart` or `get_range_coins_ohlc` |
| On-chain DEX token data | `get_tokens_networks_onchain_info` (GeckoTerminal) |
| Trending coins and markets | `get_search_trending` |
