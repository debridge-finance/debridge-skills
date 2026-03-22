---
name: debridge-wallets
description: >
  Set up a wallet for deBridge transactions. Use when the user has no signer
  available, needs to create a new wallet, or wants to configure wallet
  access for an AI agent. Covers generating a private key, creating a
  Foundry keystore, installing a browser wallet (MetaMask), and setting up
  Privy embedded wallets for zero-UI autonomous agent trading. Use this skill
  when: the user says "I don't have a wallet", "how do I set up a wallet",
  "create a new wallet", "generate an address", "I need a wallet for
  bridging", "set up Privy", "embedded wallet for my agent", "keystore
  setup", or when common Phase 3 detected no signer. Also relevant for
  "conversational trading setup" and "autonomous agent wallet".
license: MIT
metadata:
  author: deBridge
  version: "0.1.0"
---

# Wallet Setup

PREREQUISITE: Read ../common/SKILL.md for environment detection, auth, and chain configuration.

Use this skill when common Phase 3 detected **Signer = none**. Choose the method that matches your environment.

## Quick Reference

| Environment       | Recommended method       | Go to                                        |
|-------------------|--------------------------|----------------------------------------------|
| CLI + Node.js     | Generate key + env var   | Option 1 below                               |
| CLI + Foundry     | Foundry keystore         | Option 2 below                               |
| Browser           | Install MetaMask         | Option 3 below                               |
| Agent (zero-UI)   | Privy embedded wallet    | Option 4 / [privy-embedded.md](privy-embedded.md) |

After setup, re-run common Phase 3 to confirm the signer is detected, then proceed to ../signing/SKILL.md.

---

## Option 1: Private Key via Environment Variable

Fastest path for CLI agents. Generates a random private key and stores it in the shell environment.

### Generate with Node.js

```bash
node -e "const w = require('ethers').Wallet.createRandom(); console.log('Address:', w.address); console.log('Private key:', w.privateKey)"
```

If ethers is not installed:

```bash
npx -y ethers node -e "const w = require('ethers').Wallet.createRandom(); console.log('Address:', w.address); console.log('Private key:', w.privateKey)"
```

### Generate with OpenSSL

```bash
openssl rand -hex 32
```

This outputs a raw 32-byte hex string. Prefix with `0x` for use as a private key.

### Store in Environment

Add to shell profile (`~/.bashrc`, `~/.zshrc`, or `.env`):

```bash
export PRIVATE_KEY="0x<generated_key>"
```

Then reload: `source ~/.bashrc`

⚠️ CAUTION: Never commit private keys to git. Add `.env` to `.gitignore`.

### Derive Address

```bash
# ethers
node -e "const w = new (require('ethers').Wallet)('$PRIVATE_KEY'); console.log(w.address)"

# cast
cast wallet address --private-key "$PRIVATE_KEY"
```

### Fund the Wallet

The new wallet has zero balance. Send native tokens (ETH, etc.) to the derived address before bridging. Use a faucet for testnet work.

---

## Option 2: Foundry Keystore

More secure than a raw environment variable. The private key is encrypted at rest.

### Prerequisites

```bash
which cast || (curl -L https://foundry.paradigm.xyz | bash && foundryup)
```

### Create Keystore

```bash
cast wallet new ~/.foundry/keystores/debridge
```

This generates a new key pair and encrypts it with a password. Record the address from the output.

### Or Import Existing Key

```bash
cast wallet import debridge --interactive
```

Enter the private key and a password when prompted.

### Use in Commands

```bash
cast send "$TO" "$DATA" --account debridge --rpc-url "$RPC_URL"
```

Cast will prompt for the keystore password.

### Fund the Wallet

Send native tokens to the keystore address before bridging.

---

## Option 3: Browser Wallet (MetaMask)

For browser-based environments.

### Install

1. Go to [metamask.io/download](https://metamask.io/download).
2. Install the browser extension.
3. Create a new wallet or import an existing one.
4. Record the wallet address.

### Connect to deBridge Chains

MetaMask ships with Ethereum mainnet. Add other chains:

1. Open MetaMask → Settings → Networks → Add Network.
2. Use [chainlist.org](https://chainlist.org) to auto-add chains by name.
3. Or add manually using chain IDs from ../common/chain-config.md.

### Fund the Wallet

Send native tokens to the MetaMask address on the source chain before bridging.

---

## Option 4: Privy Embedded Wallet

Server-side wallets managed by Privy infrastructure (keys secured in TEEs). The agent signs and broadcasts transactions via Privy MCP — no browser, no wallet popup, no manual signing. Best for autonomous agent workflows.

Read [privy-embedded.md](privy-embedded.md) for full setup.

Quick summary:
1. Create a Privy account at [dashboard.privy.io](https://dashboard.privy.io) and get App ID + App Secret.
2. Install Privy MCP server and add it alongside deBridge MCP.
3. Create wallets via Privy MCP (`create_wallet` for EVM and/or Solana).
4. Fund the wallet on the source chain.
5. The agent passes `create_tx` output directly to Privy's `eth_sendTransaction` — no format conversion needed.

---

## After Setup

For Options 1–3:
1. Re-run common Phase 3 to verify the signer is detected.
2. Proceed to ../signing/SKILL.md for transaction signing.
3. Then to ../swap/SKILL.md for the operation.

For Option 4 (Privy):
1. Verify both deBridge and Privy MCPs are connected.
2. The agent uses deBridge MCP for routing and Privy MCP for signing — no separate signing step needed.
3. Proceed directly to ../swap/SKILL.md.

## References

- [privy-embedded.md](privy-embedded.md) — Full Privy embedded wallet setup and integration
