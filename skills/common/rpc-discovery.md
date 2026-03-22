---
title: RPC Endpoint Discovery via Chainlist
impact: HIGH
impactDescription: "Required for any direct chain interaction — balance queries, signing, tx sending"
tags: rpc, chainlist, endpoints, provider, public-rpc, privacy
---

# RPC Endpoint Discovery

All direct chain interactions (balance queries, signing, sending transactions) require an RPC endpoint. This reference describes how to discover and select RPC endpoints programmatically using the Chainlist registry.

## RPC Resolution Order

Check in order. Stop at the first match.

1. **Environment variable** — `$ETH_RPC_URL`, `$RPC_URL`, or chain-specific vars (`$ARB_RPC_URL`, `$BASE_RPC_URL`).
2. **User-provided RPC** — the user explicitly gave an RPC URL.
3. **Chainlist registry** — fetch and filter from `https://chainlist.org/rpcs.json`.

## Chainlist Registry

`https://chainlist.org/rpcs.json` is a public JSON array of all known EVM chains with their RPC endpoints.

### Schema

```json
{
  "name": "Ethereum Mainnet",
  "chainId": 1,
  "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
  "rpc": [
    {
      "url": "https://eth.llamarpc.com",
      "tracking": "none",
      "isOpenSource": true
    },
    {
      "url": "https://eth-mainnet.nodereal.io/v1/...",
      "tracking": "yes"
    }
  ],
  "explorers": [
    { "name": "etherscan", "url": "https://etherscan.io", "standard": "EIP3091" }
  ],
  "isTestnet": false
}
```

### Key Fields

| Field | Type | Purpose |
|-------|------|---------|
| `chainId` | number | EVM chain ID — use to match deBridge chain config |
| `rpc[].url` | string | RPC endpoint URL |
| `rpc[].tracking` | string | `"none"`, `"limited"`, `"yes"`, `"unspecified"` |
| `rpc[].isOpenSource` | boolean | Whether the RPC implementation is open-source |
| `nativeCurrency` | object | Native token name, symbol, and decimals |
| `isTestnet` | boolean | Filter out testnets for production use |

### Tracking Values

| Value | Meaning | Recommendation |
|-------|---------|----------------|
| `"none"` | No user tracking | Preferred — use these first |
| `"limited"` | Aggregated analytics only | Acceptable fallback |
| `"yes"` | Tracks users | Avoid unless no alternative |
| `"unspecified"` | Unknown policy | Treat as `"limited"` |

## Fetching and Filtering

### Node.js

```typescript
const resp = await fetch("https://chainlist.org/rpcs.json");
const chains = await resp.json();

function getRpcs(chainId: number): string[] {
  const chain = chains.find((c: any) => c.chainId === chainId && !c.isTestnet);
  if (!chain) return [];
  return chain.rpc
    .filter((r: any) =>
      r.tracking === "none" || r.tracking === "limited"
    )
    .filter((r: any) =>
      !r.url.includes("${") && !r.url.includes("{")  // skip template URLs with API key placeholders
    )
    .map((r: any) => r.url);
}

// Example: get privacy-respecting Ethereum RPCs
const ethRpcs = getRpcs(1);
// → ["https://eth.llamarpc.com", "https://rpc.mevblocker.io", ...]
```

### Python

```python
import requests

resp = requests.get("https://chainlist.org/rpcs.json")
chains = resp.json()

def get_rpcs(chain_id: int) -> list[str]:
    chain = next((c for c in chains if c["chainId"] == chain_id and not c.get("isTestnet")), None)
    if not chain:
        return []
    return [
        r["url"] for r in chain["rpc"]
        if r.get("tracking") in ("none", "limited")
        and "${" not in r["url"] and "{" not in r["url"]
    ]

# Example: get privacy-respecting Arbitrum RPCs
arb_rpcs = get_rpcs(42161)
```

### Bash (curl + jq)

```bash
# Get first no-tracking RPC for a chain ID
get_rpc() {
  local chain_id="$1"
  curl -sL https://chainlist.org/rpcs.json | jq -r --argjson id "$chain_id" '
    .[] | select(.chainId == $id and .isTestnet != true) |
    .rpc[] | select(.tracking == "none") |
    select(.url | (contains("${") or contains("{")) | not) |
    .url
  ' | head -1
}

# Example
ETH_RPC=$(get_rpc 1)
ARB_RPC=$(get_rpc 42161)
```

## Mapping deBridge Chain IDs to Chainlist

Some deBridge chains use internal IDs (see chain-config.md). Map to standard EVM chain IDs before querying Chainlist:

| Chain | deBridge ID | Chainlist ID |
|-------|-------------|--------------|
| Sonic | 100000014 | 146 |
| Berachain | 100000020 | 80094 |
| Neon | 100000001 | 245022934 |
| Gnosis | 100000002 | 100 |

All other deBridge chain IDs match standard EVM chain IDs directly.

## RPC Health Check

Public RPCs can be unreliable. Always verify connectivity before use:

```typescript
// Node.js — quick health check
async function checkRpc(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      signal: controller.signal,
    });
    const data = await resp.json();
    return !!data.result;
  } catch {
    return false;
  }
}
```

```bash
# Bash — quick health check
check_rpc() {
  local url="$1"
  curl -s --max-time 3 -X POST "$url" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    | jq -e '.result' > /dev/null 2>&1
}
```

## Caching

Chainlist data changes infrequently. Cache the full `rpcs.json` response:
- **CLI agents**: cache to `/tmp/chainlist-rpcs.json`, refresh every 24 hours.
- **Long-lived processes**: cache in memory, refresh every 6 hours.
- **One-shot queries**: fetch fresh each time (< 500 KB).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| All RPCs timeout | Network restriction or all endpoints overloaded | Try a different tracking tier, or use a paid RPC provider |
| 401/403 from RPC | URL contains API key placeholder | Filter out template URLs containing `${` or `{` |
| Wrong chain data | Used deBridge internal ID | Map to standard EVM chain ID first (table above) |
| Stale block number | RPC node behind | Try the next RPC in the list |
