---
title: Balance Queries with ethers.js and viem
impact: HIGH
impactDescription: "Primary balance query method for Node.js CLI and headless agents"
tags: balance, ethers, viem, erc20, native, wallet, typescript, javascript
---

# ethers.js / viem Balance Queries

## Setup

### ethers v6

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// Derive address from private key (if no address provided)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const address = wallet.address;
```

### viem

```typescript
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const client = createPublicClient({
  chain: mainnet, // replace with target chain
  transport: http(process.env.RPC_URL),
});
// Derive address from private key (if no address provided)
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const address = account.address;
```

## Native Token Balance

### ethers

```typescript
const balance = await provider.getBalance(address);
console.log(`${ethers.formatEther(balance)} ETH`);
```

### viem

```typescript
import { formatEther } from "viem";

const balance = await client.getBalance({ address });
console.log(`${formatEther(balance)} ETH`);
```

## ERC-20 Token Balance

### ethers

```typescript
const erc20Abi = ["function balanceOf(address) view returns (uint256)",
                  "function decimals() view returns (uint8)",
                  "function symbol() view returns (string)"];
const token = new ethers.Contract(tokenAddress, erc20Abi, provider);

const [balance, decimals, symbol] = await Promise.all([
  token.balanceOf(address),
  token.decimals(),
  token.symbol(),
]);
console.log(`${ethers.formatUnits(balance, decimals)} ${symbol}`);
```

### viem

```typescript
import { formatUnits } from "viem";
import { erc20Abi } from "viem";

const [balance, decimals, symbol] = await Promise.all([
  client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  }),
  client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  }),
  client.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
  }),
]);
console.log(`${formatUnits(balance, decimals)} ${symbol}`);
```

## Multi-Chain Balance Scan

Query native balance across multiple chains in parallel. Use RPC discovery from ../common/rpc-discovery.md or provide known RPCs.

### ethers

```typescript
import { ethers } from "ethers";

const chains = [
  { name: "Ethereum",  chainId: 1,     rpc: "https://eth.llamarpc.com",     symbol: "ETH"  },
  { name: "Arbitrum",  chainId: 42161, rpc: "https://arb1.arbitrum.io/rpc", symbol: "ETH"  },
  { name: "Base",      chainId: 8453,  rpc: "https://mainnet.base.org",     symbol: "ETH"  },
  { name: "Optimism",  chainId: 10,    rpc: "https://mainnet.optimism.io",  symbol: "ETH"  },
  { name: "Polygon",   chainId: 137,   rpc: "https://polygon-bor-rpc.publicnode.com", symbol: "POL" },
  { name: "BNB Chain", chainId: 56,    rpc: "https://bsc-dataseed.binance.org",       symbol: "BNB" },
];

async function getBalance(chain: typeof chains[0], address: string) {
  const provider = new ethers.JsonRpcProvider(chain.rpc, undefined, { staticNetwork: true });
  const balance = await Promise.race([
    provider.getBalance(address),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
  ]);
  return { ...chain, balance: ethers.formatEther(balance) };
}

const results = await Promise.allSettled(chains.map(c => getBalance(c, address)));
for (const r of results) {
  if (r.status === "fulfilled") {
    const { name, symbol, balance } = r.value;
    console.log(`${name}: ${balance} ${symbol}`);
  }
}
```

Key details:
- Use `staticNetwork: true` to skip the initial `eth_chainId` call — faster and avoids retry loops on slow RPCs.
- Always race with a timeout — public RPCs can hang indefinitely.
- Use `Promise.allSettled` (not `Promise.all`) so one failed chain does not abort the rest.

### viem

```typescript
import { createPublicClient, http, formatEther } from "viem";
import { mainnet, arbitrum, base, optimism, polygon, bsc } from "viem/chains";

const chains = [
  { chain: mainnet,  rpc: "https://eth.llamarpc.com" },
  { chain: arbitrum, rpc: "https://arb1.arbitrum.io/rpc" },
  { chain: base,     rpc: "https://mainnet.base.org" },
  { chain: optimism, rpc: "https://mainnet.optimism.io" },
  { chain: polygon,  rpc: "https://polygon-bor-rpc.publicnode.com" },
  { chain: bsc,      rpc: "https://bsc-dataseed.binance.org" },
];

const results = await Promise.allSettled(
  chains.map(async ({ chain, rpc }) => {
    const client = createPublicClient({ chain, transport: http(rpc) });
    const balance = await client.getBalance({ address });
    return { name: chain.name, symbol: chain.nativeCurrency.symbol, balance: formatEther(balance) };
  })
);
```

## ERC-20 Scan Across Chains

Check a specific token (e.g., USDC) on all chains where it exists:

```typescript
import { ethers } from "ethers";

// USDC addresses from ../common/chain-config.md
const usdcByChain = [
  { name: "Ethereum", rpc: "https://eth.llamarpc.com",              token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { name: "Arbitrum", rpc: "https://arb1.arbitrum.io/rpc",          token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  { name: "Base",     rpc: "https://mainnet.base.org",              token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
  { name: "Polygon",  rpc: "https://polygon-bor-rpc.publicnode.com",token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
];

const abi = ["function balanceOf(address) view returns (uint256)"];

const results = await Promise.allSettled(
  usdcByChain.map(async (c) => {
    const provider = new ethers.JsonRpcProvider(c.rpc, undefined, { staticNetwork: true });
    const contract = new ethers.Contract(c.token, abi, provider);
    const balance = await Promise.race([
      contract.balanceOf(address),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
    ]);
    return { name: c.name, balance: ethers.formatUnits(balance, c.decimals) };
  })
);
```

## Deriving Address from Private Key

When only `PRIVATE_KEY` is available and no address is known:

```typescript
// ethers
const address = new ethers.Wallet(process.env.PRIVATE_KEY).address;

// viem
import { privateKeyToAccount } from "viem/accounts";
const address = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`).address;
```

⚠️ CAUTION: Never log or expose `PRIVATE_KEY`. Derive the address, then discard the wallet object if signing is not needed.

## Common Errors

| Error | Fix |
|-------|-----|
| `staticNetwork` not recognized | ethers v6.7+ required — update: `npm install ethers@latest` |
| RPC timeout on `getBalance` | Use `Promise.race` with timeout; try next RPC from chainlist |
| `balanceOf` returns 0 unexpectedly | Verify token address matches the chain (USDC addresses differ per chain) |
| `CALL_EXCEPTION` on `decimals()` | Address is not an ERC-20 contract on this chain |
