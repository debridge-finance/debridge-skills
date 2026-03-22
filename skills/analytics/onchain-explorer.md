---
title: On-Chain Explorer — Address, Transaction, Contract, Portfolio
impact: HIGH
impactDescription: "Verify transactions and inspect addresses after bridge/swap operations"
tags: blockscout, hive, explorer, transactions, address, contract, abi, ens, portfolio, security
---

# On-Chain Explorer

Look up addresses, transactions, contracts, and token transfers on-chain. Primary use after deBridge operations: verify the transaction landed, inspect contract ABIs, or check destination wallet state.

## Blockscout MCP (Primary — No API Key, 3000+ Chains)

Official hosted MCP covering 3,000+ EVM-compatible chains. No installation or API key required.

### Installation

Hosted endpoint (recommended):

```bash
# Claude Code
claude mcp add --transport http blockscout https://mcp.blockscout.com/mcp
```

```json
// Claude Desktop
{
  "mcpServers": {
    "blockscout": {
      "type": "streamable-http",
      "url": "https://mcp.blockscout.com/mcp"
    }
  }
}
```

Local via Docker (optional):

```bash
docker run --rm -i ghcr.io/blockscout/mcp-server:latest
```

### Key Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_chains_list` | — | All known blockchain networks |
| `get_block_info` | `chain_id`, `number_or_hash`, `include_transactions` | Block details by number or hash |
| `get_address_info` | `chain_id`, `address` | Balance, ENS name, contract status |
| `get_tokens_by_address` | `chain_id`, `address`, `cursor` | ERC-20 holdings with market data |
| `get_transactions_by_address` | `chain_id`, `address`, `age_from` (required), `age_to`, `methods`, `cursor` | Transactions in a time range |
| `get_token_transfers_by_address` | `chain_id`, `address`, `age_from` (required), `age_to`, `token`, `cursor` | Token transfers by address and timeframe |
| `get_transaction_info` | `chain_id`, `transaction_hash`, `include_raw_input` | Full transaction details with decoded input |
| `get_contract_abi` | `chain_id`, `address` | Smart contract ABI (verified contracts) |
| `inspect_contract_code` | `chain_id`, `address`, `file_name` | Verified contract source code |
| `lookup_token_by_symbol` | `chain_id`, `symbol` | Find token by symbol or name |
| `get_address_by_ens_name` | `name` | ENS to Ethereum address resolution |
| `get_block_number` | `chain_id`, `datetime` | Block number at a specific time |
| `nft_tokens_by_address` | `chain_id`, `address`, `cursor` | NFTs owned by address |
| `read_contract` | `chain_id`, `address`, `abi`, `function_name`, `args`, `block` | Read-only contract call |
| `direct_api_call` | `chain_id`, `endpoint_path`, `query_params`, `cursor` | Raw Blockscout API access |

### Chain IDs

Blockscout uses standard EVM chain IDs. Common ones for deBridge:

| Chain | Chain ID |
|-------|----------|
| Ethereum | 1 |
| Arbitrum | 42161 |
| Polygon | 137 |
| BSC | 56 |
| Base | 8453 |
| Optimism | 10 |
| Avalanche | 43114 |
| Linea | 59144 |

### Example: Verify Bridge Transaction on Destination Chain

```
1. After deBridge bridge completes, take the destination tx hash.

2. Call mcp__blockscout__get_transaction_info:
     chain_id: "42161"                    // Arbitrum
     transaction_hash: "0xabc123..."
     include_raw_input: false

3. Confirm status is "ok" and the expected token transfer is present.

4. Call mcp__blockscout__get_tokens_by_address:
     chain_id: "42161"
     address: "<destination-wallet>"

5. Verify the expected token balance increased.
```

### Example: Look Up Token by Symbol on a Chain

```
Call mcp__blockscout__lookup_token_by_symbol:
  chain_id: "8453"        // Base
  symbol: "USDC"

Returns: contract address, name, decimals, total supply.
```

---

## Hive Intelligence (Multi-Chain Analytics — No API Key, Hosted)

Comprehensive Web3 data across 60+ blockchains with 351 endpoints spanning 14 analytics categories. Uses a meta-tool pattern: category tools return endpoint lists, then `invoke_api_endpoint` calls them.

### Installation

Hosted endpoint (no install, no key):

```bash
# Claude Code
claude mcp add --transport http hive https://hiveintelligence.xyz/mcp
```

```json
// Claude Desktop
{
  "mcpServers": {
    "hive": {
      "type": "streamable-http",
      "url": "https://hiveintelligence.xyz/mcp"
    }
  }
}
```

### How It Works

Hive uses a two-step pattern:

1. **Discover endpoints** — call a category tool (e.g., `get_portfolio_wallet_endpoints`) to get available endpoints and their schemas.
2. **Invoke endpoint** — call `invoke_api_endpoint` with the endpoint name and arguments.

### Category Tools

| Tool | Description |
|------|-------------|
| `get_market_and_price_endpoints` | Real-time and historical crypto price data |
| `get_onchain_dex_pool_endpoints` | DEX and pool analytics |
| `get_portfolio_wallet_endpoints` | Wallet balances, transaction history |
| `get_token_contract_endpoints` | Token and contract analysis |
| `get_defi_protocol_endpoints` | DeFi protocol analytics |
| `get_nft_analytics_endpoints` | NFT collection and marketplace data |
| `get_security_risk_endpoints` | Token security analysis, rug pull detection |
| `get_network_infrastructure_endpoints` | Network health, gas prices |
| `get_search_discovery_endpoints` | Trending tokens, search |
| `get_social_sentiment_endpoints` | Social media analytics, sentiment |

### Utility Tools

| Tool | Parameters (\* = required) | Description |
|------|-----------|-------------|
| `get_api_endpoint_schema` | `endpoint`\* | Get schema for a specific endpoint |
| `invoke_api_endpoint` | `endpoint_name`\*, `args`\* (object) | Call any Hive endpoint with arguments |

### Example: Check Token Security Before Swap

```
1. Discover security endpoints:
   Call mcp__hive__get_security_risk_endpoints

2. Get schema for token security check:
   Call mcp__hive__get_api_endpoint_schema:
     endpoint: "token_security_check"

3. Check the token:
   Call mcp__hive__invoke_api_endpoint:
     endpoint_name: "token_security_check"
     args: { "chain": "ethereum", "address": "0xTokenAddress..." }
```

---

## When to Use Which

| Scenario | MCP | Tool |
|----------|-----|------|
| Verify a single transaction | Blockscout | `get_transaction_info` |
| Look up contract ABI or source | Blockscout | `get_contract_abi` / `inspect_contract_code` |
| Read contract state | Blockscout | `read_contract` |
| ENS resolution | Blockscout | `get_address_by_ens_name` |
| Token holdings for an address | Blockscout | `get_tokens_by_address` |
| Transfer history by time range | Blockscout | `get_transactions_by_address` |
| Block details | Blockscout | `get_block_info` |
| Token security / rug pull check | Hive | `get_security_risk_endpoints` → `invoke_api_endpoint` |
| Multi-chain portfolio overview | Hive | `get_portfolio_wallet_endpoints` → `invoke_api_endpoint` |
| Social sentiment analysis | Hive | `get_social_sentiment_endpoints` → `invoke_api_endpoint` |
| NFT analytics | Hive | `get_nft_analytics_endpoints` → `invoke_api_endpoint` |
