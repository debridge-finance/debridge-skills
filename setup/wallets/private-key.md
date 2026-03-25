
# OWS (Open Wallet Standard)

Local self-custody wallet with encrypted key storage. Works with all deBridge chains — EVM, Solana, and Tron — from a single wallet.

1. Install OWS:

```bash
curl -fsSL https://docs.openwallet.sh/install.sh | bash
```

2. Create a new wallet or import an existing key:

```bash
# Create new (generates keys for all supported chains)
ows wallet create

# Or import an existing private key
ows wallet import
```

3. Verify your wallet and addresses:

```bash
ows wallet list
```

This shows your EVM, Solana, and other chain addresses — all derived from a single wallet.

4. Fund the wallet on the source chain before bridging.

Security: Keys are encrypted at rest on your machine, decrypted only during signing, then wiped from memory. No plaintext keys in environment variables or config files.
