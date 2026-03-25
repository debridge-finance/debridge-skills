
# Foundry (Cast Keystore)

Encrypted keystore wallet using Foundry's `cast` CLI. Keys are encrypted at rest with a password. EVM chains only.

1. Install Foundry if not already available:

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

2. Create a new wallet or import an existing key:

```bash
# Create new
cast wallet new ~/.foundry/keystores/debridge

# Or import an existing private key
cast wallet import debridge --interactive
```

3. Verify your wallet:

```bash
cast wallet list
```

4. Fund the wallet on the source chain before bridging.

Foundry supports EVM chains only. For multi-chain support (EVM, Solana, Tron), use [OWS](../private-key/SKILL.md) instead.
