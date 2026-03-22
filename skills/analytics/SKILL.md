---
name: debridge-analytics
description: >
  Query DeFi analytics and on-chain data from third-party MCP servers to
  make informed bridging and swapping decisions. Covers token prices
  (CoinGecko, Alchemy), on-chain lookups (Blockscout), protocol TVL and
  yields (DefiLlama), DEX pool liquidity (DexPaprika), subgraph queries
  (The Graph), and multi-chain wallet data (Moralis, Alchemy). Use this
  skill whenever the user asks about token prices, wallet balances,
  portfolio overview, transaction history, protocol TVL, DEX liquidity,
  yield opportunities, or on-chain data. Also use for: "what's the price
  of ETH", "check my balance", "how much USDC do I have across chains",
  "show me the TVL of Aave", "is there enough liquidity to swap", "look up
  this transaction", "query the Uniswap subgraph".
license: MIT
metadata:
  author: deBridge
  version: "0.1.0"
---

# DeFi Analytics

PREREQUISITE: Read ../common/SKILL.md for environment detection, auth, and chain configuration.

Third-party MCP servers provide analytics data useful before, during, and after deBridge operations: token prices, wallet balances, protocol TVL, DEX liquidity, and on-chain transaction details.

## Quick Reference

| Want to...                              | MCP options              | Reference                                          |
|-----------------------------------------|--------------------------|----------------------------------------------------|
| Get token prices and market data        | CoinGecko, Alchemy       | [token-prices.md](token-prices.md)                 |
| Look up address, tx, or contract        | Blockscout, Alchemy      | [onchain-explorer.md](onchain-explorer.md)         |
| Check protocol TVL, fees, yields        | DefiLlama                | [defi-tvl.md](defi-tvl.md)                         |
| Analyze DEX pools, OHLCV, trades        | DexPaprika               | [dex-pools.md](dex-pools.md)                       |
| Query protocol subgraphs (GraphQL)      | The Graph                | [subgraph-queries.md](subgraph-queries.md)         |
| Get wallet balances across many chains  | Moralis, Alchemy         | [multi-chain-data.md](multi-chain-data.md)         |
| Query balances directly (no MCP)        | ethers, viem, cast, web3 | Direct Balance Queries below                       |

---

## Installing Analytics MCPs

### npx vs npm install

Use **`npx`** for one-shot exploration — the package is fetched, executed once, and not retained:

```bash
npx -y @coingecko/coingecko-mcp         # try CoinGecko MCP
npx -y @nic0xflamel/defillama-mcp-server # try DefiLlama MCP
npx dexpaprika-mcp                       # try DexPaprika MCP
```

Use **`npm install -g`** (or add to `devDependencies`) when building a persistent agent harness, a recurring script, or a long-lived process:

```bash
npm install -g @coingecko/coingecko-mcp  # always available, faster startup
```

| Scenario                                    | Use         |
|---------------------------------------------|-------------|
| First time trying an MCP                    | `npx -y`    |
| One-off query during a conversation         | `npx -y`    |
| CI/CD pipeline, ephemeral environment       | `npx -y`    |
| Agent harness running the MCP repeatedly    | `npm install -g` or `devDependencies` |
| Project with pinned MCP versions            | `devDependencies` in `package.json`   |

### Adding to Claude Desktop

All analytics MCPs use the same config pattern. Add to the Claude Desktop config file (see ../common/mcp-setup.md for file location):

```json
{
  "mcpServers": {
    "<mcp-name>": {
      "command": "npx",
      "args": ["-y", "<package-name>"],
      "env": {
        "API_KEY": "<key-if-required>"
      }
    }
  }
}
```

For hosted MCPs (CoinGecko, Blockscout) that expose a remote endpoint:

```json
{
  "mcpServers": {
    "<mcp-name>": {
      "type": "streamable-http",
      "url": "<hosted-endpoint>"
    }
  }
}
```

### Adding to Claude Code (CLI)

Stdio (local):
```bash
claude mcp add <name> -- npx -y <package-name>
```

Streaming (hosted):
```bash
claude mcp add --transport http <name> <hosted-url>
```

---

## API Key Requirements

| MCP         | API Key Required | Where to Get                                       |
|-------------|------------------|----------------------------------------------------|
| CoinGecko   | No (hosted)      | Optional Pro key at coingecko.com/api/pricing       |
| Blockscout  | No               | Free hosted endpoint                               |
| DefiLlama   | No               | Free, no authentication                            |
| DexPaprika  | No               | Free, no authentication                            |
| The Graph   | Yes              | thegraph.com/studio — Gateway API key              |
| Alchemy     | Yes              | alchemy.com — free tier available                  |
| Moralis     | Yes              | moralis.io — free tier available                   |

---

## Use Case Routing

### Before a Bridge or Swap

1. **Check token price** → [token-prices.md](token-prices.md) — verify the token is priced as expected before committing.
2. **Check destination pool liquidity** → [dex-pools.md](dex-pools.md) — ensure the destination chain has sufficient liquidity.
3. **Check wallet balances** → [multi-chain-data.md](multi-chain-data.md) — find which chain has the most of a token to bridge from.

### After a Bridge or Swap

4. **Verify transaction on-chain** → [onchain-explorer.md](onchain-explorer.md) — confirm the tx landed on the destination chain.
5. **Check received balance** → [multi-chain-data.md](multi-chain-data.md) — confirm the destination wallet holds the expected tokens.

### Research and Analysis

6. **Protocol TVL and yields** → [defi-tvl.md](defi-tvl.md) — compare protocols, check yield opportunities on destination chains.
7. **Subgraph queries** → [subgraph-queries.md](subgraph-queries.md) — query protocol-specific data (Uniswap pools, Aave markets, etc.).

---

## Direct Balance Queries (No MCP Required)

When no analytics MCP is connected, query balances directly using the signer/runtime detected in ../common/SKILL.md Phase 3. Route based on available tool:

| Signer / Runtime      | Read this file                             |
|-----------------------|--------------------------------------------|
| ethers-viem / Node.js | [balance-ethers.md](balance-ethers.md)     |
| foundry-cast          | [balance-cast.md](balance-cast.md)         |
| web3py / Python       | [balance-web3py.md](balance-web3py.md)     |
| none                  | Install one: `npm install ethers` is fastest |

All direct query methods require an RPC endpoint. Resolve RPCs in this order:
1. Environment variable (`$RPC_URL`, `$ETH_RPC_URL`).
2. User-provided URL.
3. Discover from Chainlist — read ../common/rpc-discovery.md.

### Deriving Address from Private Key

If only `PRIVATE_KEY` is available and no address is known, each reference file includes a "Deriving Address" section. The address must be derived before any balance query.

### When to Use Direct Queries vs MCP

| Scenario | Use |
|----------|-----|
| Quick balance check, one chain | Direct query — no setup overhead |
| Multi-chain scan, native only | Direct query — parallel RPC calls |
| Portfolio with USD values | Moralis MCP — returns balances with prices |
| Single call for all chains | Alchemy MCP — `fetchTokensOwnedByMultichainAddresses` |
| No API key, no MCP | Direct query — only needs a public RPC |

---

## When No Analytics MCP Is Available

If no analytics MCPs are installed, you can still gather basic data:

| Need | Fallback |
|------|----------|
| Token balance | Direct RPC query — see Direct Balance Queries above |
| Token price | deBridge MCP itself: compare `create_tx` input/output amounts for an implied exchange rate |
| Transaction verification | Use an RPC `eth_getTransactionReceipt` call or the bundled scripts |
| Pool liquidity / TVL / yields | No direct fallback — suggest installing CoinGecko MCP (free, no key): `claude mcp add --transport http coingecko https://mcp.api.coingecko.com/mcp` |

For a quick start with zero setup, CoinGecko (hosted, no API key) and Blockscout (hosted, no API key) cover most pre-swap research needs.

## Common Errors

| Error                          | Cause                         | Fix                                                      |
|--------------------------------|-------------------------------|----------------------------------------------------------|
| MCP tool not found             | MCP not installed/configured  | Follow installation in the relevant reference file        |
| Rate limited (429)             | Too many requests             | Add delay between calls, or use a paid API tier           |
| API key invalid                | Wrong or expired key          | Regenerate at the provider's dashboard                    |
| `npx` hangs on first run      | Large package download        | Use `npm install -g` for persistent use                   |
| Chain not supported            | MCP doesn't cover that chain  | Check chain support in each reference file                |

## References

- [token-prices.md](token-prices.md) — Token prices and market data (CoinGecko, Alchemy)
- [onchain-explorer.md](onchain-explorer.md) — On-chain address, transaction, contract lookup (Blockscout, Alchemy)
- [defi-tvl.md](defi-tvl.md) — Protocol TVL, fees, revenue, yields (DefiLlama)
- [dex-pools.md](dex-pools.md) — DEX pool analytics, OHLCV, trades (DexPaprika)
- [subgraph-queries.md](subgraph-queries.md) — Subgraph search and GraphQL queries (The Graph)
- [multi-chain-data.md](multi-chain-data.md) — Multi-chain wallet balances, tokens, NFTs (Moralis)
- [balance-ethers.md](balance-ethers.md) — Direct balance queries with ethers.js / viem
- [balance-cast.md](balance-cast.md) — Direct balance queries with Foundry cast
- [balance-web3py.md](balance-web3py.md) — Direct balance queries with Python web3.py
