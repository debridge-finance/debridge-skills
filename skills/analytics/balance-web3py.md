---
title: Balance Queries with Python web3.py
impact: MEDIUM
impactDescription: "Balance query method for Python-based agent environments"
tags: balance, python, web3py, erc20, native, wallet
---

# web3.py Balance Queries

## Setup

```python
from web3 import Web3
import os

w3 = Web3(Web3.HTTPProvider(os.environ["RPC_URL"]))
# Derive address from private key (if no address provided)
account = w3.eth.account.from_key(os.environ["PRIVATE_KEY"])
address = account.address
```

⚠️ CAUTION: Never log or expose `PRIVATE_KEY`. Derive the address, then use only the address for queries.

## Native Token Balance

```python
balance_wei = w3.eth.get_balance(address)
balance_eth = w3.from_wei(balance_wei, "ether")
print(f"{balance_eth} ETH")
```

## ERC-20 Token Balance

```python
ERC20_ABI = [
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}],
     "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}],
     "type": "function"},
    {"constant": True, "inputs": [],
     "name": "decimals", "outputs": [{"name": "", "type": "uint8"}],
     "type": "function"},
    {"constant": True, "inputs": [],
     "name": "symbol", "outputs": [{"name": "", "type": "string"}],
     "type": "function"},
]

token = w3.eth.contract(address=token_address, abi=ERC20_ABI)
balance = token.functions.balanceOf(address).call()
decimals = token.functions.decimals().call()
symbol = token.functions.symbol().call()
human_balance = balance / (10 ** decimals)
print(f"{human_balance} {symbol}")
```

## Multi-Chain Balance Scan

```python
from web3 import Web3
import concurrent.futures
import os

account = Web3().eth.account.from_key(os.environ["PRIVATE_KEY"])
address = account.address

CHAINS = [
    {"name": "Ethereum",  "rpc": "https://eth.llamarpc.com",              "symbol": "ETH"},
    {"name": "Arbitrum",  "rpc": "https://arb1.arbitrum.io/rpc",          "symbol": "ETH"},
    {"name": "Base",      "rpc": "https://mainnet.base.org",              "symbol": "ETH"},
    {"name": "Optimism",  "rpc": "https://mainnet.optimism.io",           "symbol": "ETH"},
    {"name": "Polygon",   "rpc": "https://polygon-bor-rpc.publicnode.com","symbol": "POL"},
    {"name": "BNB Chain", "rpc": "https://bsc-dataseed.binance.org",      "symbol": "BNB"},
    {"name": "Avalanche", "rpc": "https://api.avax.network/ext/bc/C/rpc", "symbol": "AVAX"},
]

def get_balance(chain):
    try:
        w3 = Web3(Web3.HTTPProvider(chain["rpc"], request_kwargs={"timeout": 5}))
        balance = w3.eth.get_balance(address)
        return f"{chain['name']}: {w3.from_wei(balance, 'ether')} {chain['symbol']}"
    except Exception as e:
        return f"{chain['name']}: error ({e})"

with concurrent.futures.ThreadPoolExecutor(max_workers=len(CHAINS)) as pool:
    for result in pool.map(get_balance, CHAINS):
        print(result)
```

## ERC-20 Scan Across Chains

```python
from web3 import Web3
import concurrent.futures
import os

account = Web3().eth.account.from_key(os.environ["PRIVATE_KEY"])
address = account.address

# USDC addresses from ../common/chain-config.md
USDC = [
    {"name": "Ethereum", "rpc": "https://eth.llamarpc.com",               "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "decimals": 6},
    {"name": "Arbitrum", "rpc": "https://arb1.arbitrum.io/rpc",           "token": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "decimals": 6},
    {"name": "Base",     "rpc": "https://mainnet.base.org",               "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "decimals": 6},
    {"name": "Polygon",  "rpc": "https://polygon-bor-rpc.publicnode.com", "token": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", "decimals": 6},
]

BALANCE_OF_ABI = [
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}],
     "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}],
     "type": "function"},
]

def get_usdc(chain):
    try:
        w3 = Web3(Web3.HTTPProvider(chain["rpc"], request_kwargs={"timeout": 5}))
        token = w3.eth.contract(
            address=Web3.to_checksum_address(chain["token"]),
            abi=BALANCE_OF_ABI,
        )
        raw = token.functions.balanceOf(address).call()
        human = raw / (10 ** chain["decimals"])
        return f"{chain['name']}: {human} USDC"
    except Exception as e:
        return f"{chain['name']}: error ({e})"

with concurrent.futures.ThreadPoolExecutor(max_workers=len(USDC)) as pool:
    for result in pool.map(get_usdc, USDC):
        print(result)
```

## Deriving Address from Private Key

```python
from web3 import Web3

account = Web3().eth.account.from_key(os.environ["PRIVATE_KEY"])
address = account.address
print(address)
```

## Common Errors

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'web3'` | Install: `pip install web3` |
| `TimeExhausted` | RPC too slow — increase timeout or try another endpoint |
| `BadFunctionCallOutput` | Token address is not a contract on this chain |
| `InvalidAddress` | Use `Web3.to_checksum_address()` on all addresses |
