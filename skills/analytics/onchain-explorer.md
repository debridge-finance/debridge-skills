---
title: On-Chain Explorer — Address, Transaction, Contract Lookup
impact: HIGH
impactDescription: "Verify transactions and inspect addresses after bridge/swap operations"
tags: blockscout, alchemy, explorer, transactions, address, contract, abi, ens
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
| `get_address_info` | `chain_id`, `address` | Balance, ENS name, contract status |
| `get_tokens_by_address` | `chain_id`, `address`, `cursor` | ERC-20 holdings with market data |
| `get_transactions_by_address` | `chain_id`, `address`, `age_from`, `age_to`, `methods`, `cursor` | Transactions in a time range |
| `get_token_transfers_by_address` | `chain_id`, `address`, `age_from`, `age_to`, `token`, `cursor` | Token transfers by address and timeframe |
| `get_transaction_info` | `chain_id`, `hash`, `include_raw_input` | Full transaction details with decoded input |
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
     hash: "0xabc123..."
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

## Alchemy MCP (Alternative — API Key Required)

Alchemy covers major EVM chains with multichain address queries and transfer history. Useful when Blockscout is slow or for aggregated multichain views.

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
| `fetchAddressTransactionHistory` | `address`, `networks` | Transaction history across multiple chains |
| `fetchTransfers` | `address`, filters | Asset movement details |
| `fetchTokensOwnedByMultichainAddresses` | `addresses`, `chains` | Token balances across chains |
| `fetchNftsOwnedByMultichainAddresses` | `addresses`, spam filter | NFT holdings |

### Example: Check Multi-Chain Balance After Bridge

```
Call mcp__alchemy__fetchTokensOwnedByMultichainAddresses:
  addresses: ["0xYourWallet"]
  chains: ["eth-mainnet", "arb-mainnet", "base-mainnet"]

Returns token holdings per chain — verify the bridged tokens arrived.
```

---

## When to Use Which

| Scenario | Use |
|----------|-----|
| Verify a single transaction | Blockscout (free, no key) |
| Look up contract ABI or source | Blockscout |
| Read contract state | Blockscout `read_contract` |
| ENS resolution | Blockscout `get_address_by_ens_name` |
| Multi-chain balance overview | Alchemy `fetchTokensOwnedByMultichainAddresses` |
| Transfer history across chains | Alchemy `fetchTransfers` |
| Chains with sparse explorer support | Blockscout (3000+ chains) |
