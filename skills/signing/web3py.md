---
title: Signing with Python web3.py
impact: MEDIUM
impactDescription: "Signing method for Python-based agent environments"
tags: signing, python, web3py, eip-712, private-key
---

# web3.py Signing

## Setup

```python
from web3 import Web3
import os

w3 = Web3(Web3.HTTPProvider(os.environ["RPC_URL"]))
private_key = os.environ["PRIVATE_KEY"]
account = w3.eth.account.from_key(private_key)
```

⚠️ CAUTION: Never log or expose `PRIVATE_KEY`. Read from environment only.

## Sign and Send Transaction

Given tx data from `mcp__debridge__create_tx`:

```python
tx = {
    "to": tx_data["to"],
    "data": tx_data["data"],
    "value": int(tx_data.get("value", "0")),
    "chainId": int(tx_data["chainId"]),
    "gas": int(tx_data.get("gasLimit", "300000")),
    "gasPrice": w3.eth.gas_price,
    "nonce": w3.eth.get_transaction_count(account.address),
}

signed = account.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
print(f"tx hash: {receipt.transactionHash.hex()}")
```

## Sign EIP-712 Typed Data

For DLN order signatures:

```python
from web3 import Web3

# typed_data contains domain, types, primaryType, message
signature = account.sign_typed_data(
    domain_data=typed_data["domain"],
    message_types=typed_data["types"],
    message_data=typed_data["message"],
)
print(f"signature: {signature.signature.hex()}")
```

Requires web3.py >= 6.0 for `sign_typed_data` support.

## Approval Transaction

Send token approval before the bridge tx:

```python
approve_tx = {
    "to": approve_tx_data["to"],
    "data": approve_tx_data["data"],
    "value": 0,
    "chainId": int(approve_tx_data["chainId"]),
    "gas": 100000,
    "gasPrice": w3.eth.gas_price,
    "nonce": w3.eth.get_transaction_count(account.address),
}

signed = account.sign_transaction(approve_tx)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
w3.eth.wait_for_transaction_receipt(tx_hash)  # must confirm before bridge tx
```

## Common Errors

| Error | Fix |
|-------|-----|
| `insufficient funds for gas` | Fund wallet with native token |
| `nonce too low` | Pending tx — use `w3.eth.get_transaction_count(addr, "pending")` |
| `sign_typed_data` not found | Upgrade web3.py: `pip install --upgrade web3` |
