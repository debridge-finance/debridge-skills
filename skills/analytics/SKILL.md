---
name: debridge-analytics
description: >
  Query DeFi analytics and on-chain data from third-party MCP servers to
  make informed bridging and swapping decisions. Covers token prices and
  exchange data (CoinGecko, Crypto.com, mcp-crypto-price), on-chain
  lookups and multi-chain analytics (Blockscout, Hive Intelligence),
  protocol TVL, yields, and vault risk (DefiLlama, Philidor), and DEX
  pool liquidity (DexPaprika). All servers are free and require no API
  key. Use this skill whenever the user asks about token prices, wallet
  balances, portfolio overview, transaction history, protocol TVL, DEX
  liquidity, yield opportunities, orderbook depth, vault risk, token
  security, or on-chain data. Also use for: "what's the price of ETH",
  "check my balance", "show me the TVL of Aave", "is there enough
  liquidity to swap", "look up this transaction", "is this token safe",
  "what's the risk of this vault".
license: MIT
metadata:
  author: deBridge
  version: "0.1.0"
---

# DeFi Analytics

PREREQUISITE: Read ../common/SKILL.md for environment detection, auth, and chain configuration.

Third-party MCP servers provide analytics data useful before, during, and after deBridge operations: token prices, wallet balances, protocol TVL, DEX liquidity, and on-chain transaction details. All analytics MCPs listed here are free and require no API key.

## Quick Reference

| Want to...                              | MCP                          | Reference                                          |
|-----------------------------------------|------------------------------|----------------------------------------------------|
| Get token prices and market data        | CoinGecko, Crypto.com        | [token-prices.md](token-prices.md)                 |
| Look up address, tx, or contract        | Blockscout, Hive             | [onchain-explorer.md](onchain-explorer.md)         |
| Check protocol TVL, fees, yields        | DefiLlama, Philidor          | [defi-tvl.md](defi-tvl.md)                         |
| Analyze DEX pools, OHLCV, trades        | DexPaprika                   | [dex-pools.md](dex-pools.md)                       |
| Assess DeFi vault risk                  | Philidor                     | [defi-tvl.md](defi-tvl.md)                         |
| Token security / rug pull check         | Hive                         | [onchain-explorer.md](onchain-explorer.md)         |
| Query balances directly (no MCP)        | ethers, viem, cast, web3     | Direct Balance Queries below                       |

---

## Installing Analytics MCPs

### npx vs npm install

Use **`npx`** for one-shot exploration — the package is fetched, executed once, and not retained:

```bash
npx -y @coingecko/coingecko-mcp         # try CoinGecko MCP
npx -y @nic0xflamel/defillama-mcp-server # try DefiLlama MCP
npx dexpaprika-mcp                       # try DexPaprika MCP
npx -y mcp-crypto-price                  # try mcp-crypto-price MCP
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

All analytics MCPs are free and require no API key:

| MCP              | API Key Required | Endpoint                                          |
|------------------|------------------|---------------------------------------------------|
| CoinGecko        | No               | Hosted: `https://mcp.api.coingecko.com/mcp`      |
| Crypto.com       | No               | Hosted: `https://mcp.crypto.com/market-data/mcp`  |
| Blockscout       | No               | Hosted: `https://mcp.blockscout.com/mcp`          |
| Hive Intelligence| No               | Hosted: `https://hiveintelligence.xyz/mcp`        |
| Philidor         | No               | Hosted: `https://mcp.philidor.io/api/mcp`        |
| DexPaprika       | No               | Hosted: `https://mcp.dexpaprika.com/streamable-http` |
| DefiLlama        | No               | Local: `npx -y @nic0xflamel/defillama-mcp-server` |
| mcp-crypto-price | No               | Local: `npx -y mcp-crypto-price`                  |

---

## Use Case Routing

### Before a Bridge or Swap

1. **Check token price** → [token-prices.md](token-prices.md) — verify the token is priced as expected before committing.
2. **Check destination pool liquidity** → [dex-pools.md](dex-pools.md) — ensure the destination chain has sufficient liquidity.
3. **Check wallet balances** → Direct Balance Queries below, or Blockscout `get_tokens_by_address` per chain.

### After a Bridge or Swap

4. **Verify transaction on-chain** → [onchain-explorer.md](onchain-explorer.md) — confirm the tx landed on the destination chain.
5. **Check received balance** → Blockscout `get_tokens_by_address` or Direct Balance Queries below.

### Research and Analysis

6. **Protocol TVL and yields** → [defi-tvl.md](defi-tvl.md) — compare protocols, check yield opportunities on destination chains.

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

**Bundled scripts** (in `../common/scripts/`) provide a faster path when Node.js is available:

```bash
npx tsx ../common/scripts/balance.ts 0xAddr 1 42161 8453          # native balance on 3 chains
npx tsx ../common/scripts/balance.ts 0xAddr 42161 --token 0xUSDC  # ERC-20 balance
npx tsx ../common/scripts/balance.ts --derive 1 42161 8453        # derive address from $PRIVATE_KEY, then query
```

These scripts auto-discover RPCs from Chainlist and support `--json` output.

### Deriving Address from Private Key

If only `PRIVATE_KEY` is available and no address is known, each reference file includes a "Deriving Address" section. The address must be derived before any balance query.

### When to Use Direct Queries vs MCP

| Scenario | Use |
|----------|-----|
| Quick balance check, one chain | Direct query — no setup overhead |
| Multi-chain scan, native only | Direct query — parallel RPC calls |
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

For a quick start with zero setup, CoinGecko (hosted, no API key), Crypto.com (hosted, no API key), and Blockscout (hosted, no API key) cover most pre-swap research needs.

## Common Errors

| Error                          | Cause                         | Fix                                                      |
|--------------------------------|-------------------------------|----------------------------------------------------------|
| MCP tool not found             | MCP not installed/configured  | Follow installation in the relevant reference file        |
| Rate limited (429)             | Too many requests             | Add delay between calls or switch to a different free MCP |
| `npx` hangs on first run      | Large package download        | Use `npm install -g` for persistent use                   |
| Chain not supported            | MCP doesn't cover that chain  | Check chain support in each reference file                |

## References

- [token-prices.md](token-prices.md) — Token prices and market data (CoinGecko)
- [onchain-explorer.md](onchain-explorer.md) — On-chain address, transaction, contract lookup (Blockscout)
- [defi-tvl.md](defi-tvl.md) — Protocol TVL, fees, revenue, yields (DefiLlama)
- [dex-pools.md](dex-pools.md) — DEX pool analytics, OHLCV, trades (DexPaprika)
- [balance-ethers.md](balance-ethers.md) — Direct balance queries with ethers.js / viem
- [balance-cast.md](balance-cast.md) — Direct balance queries with Foundry cast
- [balance-web3py.md](balance-web3py.md) — Direct balance queries with Python web3.py
