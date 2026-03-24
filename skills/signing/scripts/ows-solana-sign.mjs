#!/usr/bin/env node
//
// OWS Solana Sign + Broadcast
//
// Signs and broadcasts a Solana transaction from deBridge using the
// @open-wallet-standard/core Node.js SDK. Handles the three format
// adaptations that Solana requires:
//
//   1. Blockhash insertion — deBridge returns a placeholder (all zeros)
//      because blockhashes expire in ~60-90s. This script fetches a
//      fresh one from Solana RPC and writes it into the transaction.
//
//   2. Byte-range extraction — Solana V0 versioned transactions include
//      a signature placeholder at bytes 0-64. The Ed25519 signature
//      must cover only the message portion (offset 65+). The script
//      extracts these bytes and passes them to OWS signMessage().
//
//   3. Encoding conversion — OWS returns a hex signature; Solana RPC
//      expects the full transaction as base64. The script assembles
//      the final transaction and converts it before broadcast.
//
// Usage:
//   node ows-solana-sign.mjs <tx_hex> <wallet_name>
//   node ows-solana-sign.mjs <tx_hex> <wallet_name> --rpc <solana_rpc_url>
//   node ows-solana-sign.mjs <tx_hex> <wallet_name> --json
//
// Arguments:
//   tx_hex       Hex-encoded Solana V0 transaction from deBridge create_tx
//                (strip the leading 0x if present)
//   wallet_name  OWS wallet name (e.g. "agent-treasury")
//
// Options:
//   --rpc <url>  Solana RPC endpoint (default: $SOLANA_RPC_URL or mainnet-beta)
//   --json       Output result as JSON
//
// Examples:
//   # Sign and broadcast using default RPC
//   node ows-solana-sign.mjs 01000000...abcdef agent-treasury
//
//   # Sign with custom RPC and JSON output
//   node ows-solana-sign.mjs 01000000...abcdef agent-treasury --rpc https://my-rpc.example.com --json
//
// Prerequisites:
//   npm install @open-wallet-standard/core
//
// The OWS Node.js SDK includes prebuilt binaries for macOS and Linux —
// no Rust toolchain required.

import { signMessage } from "@open-wallet-standard/core";
import { getRpc } from "../../common/scripts/rpc.mjs";

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--rpc" && args[i + 1]) {
    flags.rpc = args[++i];
  } else if (args[i] === "--json") {
    flags.json = true;
  } else if (args[i].startsWith("--")) {
    console.error(`Unknown flag: ${args[i]}`);
    process.exit(1);
  } else {
    positional.push(args[i]);
  }
}

if (positional.length < 2) {
  console.error("Usage: node ows-solana-sign.mjs <tx_hex> <wallet_name> [--rpc <url>] [--json]");
  process.exit(1);
}

const txHex = positional[0].replace(/^0x/, "");
const walletName = positional[1];
const rpcUrl = flags.rpc || await getRpc(7565164);

// ---------------------------------------------------------------------------
// Solana V0 transaction layout
// ---------------------------------------------------------------------------
// Byte 0:       number of signatures (expect 0x01 for single-signer)
// Bytes 1-64:   signature placeholder (64 zero bytes)
// Byte 65:      0x80 = V0 version prefix
// Bytes 66-68:  message header (num_required_sigs, num_readonly_signed, num_readonly_unsigned)
// Byte 69:      num_account_keys
// Bytes 70+:    account keys (32 bytes each), then recent_blockhash (32 bytes)
// ---------------------------------------------------------------------------

const tx = Buffer.from(txHex, "hex");

if (tx[0] !== 0x01) {
  console.error(`Expected single-signer tx (byte 0 = 0x01), got 0x${tx[0].toString(16).padStart(2, "0")}`);
  process.exit(1);
}

const numKeys = tx[69];
const blockhashOffset = 70 + numKeys * 32;

// ---------------------------------------------------------------------------
// Step 1: Fetch a fresh blockhash from Solana RPC
// ---------------------------------------------------------------------------
// Blockhashes are valid for ~60-90 seconds. deBridge returns all zeros as a
// placeholder because the blockhash would expire before the user signs.

const bhResp = await fetch(rpcUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getLatestBlockhash",
    params: [{ commitment: "confirmed" }],
  }),
}).then((r) => r.json());

if (bhResp.error) {
  console.error("RPC error fetching blockhash:", bhResp.error);
  process.exit(1);
}

// Decode the base58 blockhash into 32 raw bytes.
// Inline implementation to avoid adding a dependency — the OWS SDK does not
// export base58 utilities and we only need decode for a single 32-byte value.
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function b58decode(str) {
  const bytes = [0];
  for (const c of str) {
    let carry = ALPHABET.indexOf(c);
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const c of str) {
    if (c === "1") bytes.push(0);
    else break;
  }
  return Buffer.from(bytes.reverse());
}

// ---------------------------------------------------------------------------
// Step 2: Insert blockhash BEFORE signing
// ---------------------------------------------------------------------------
// The Ed25519 signature covers the message bytes which include the blockhash,
// so it must be written into the transaction before we sign.

const blockhashBytes = b58decode(bhResp.result.value.blockhash);
blockhashBytes.copy(tx, blockhashOffset);

// ---------------------------------------------------------------------------
// Step 3: Sign the message bytes (offset 65+) with OWS SDK
// ---------------------------------------------------------------------------
// Solana V0 signature covers only the message portion of the serialized
// transaction. Bytes 0-64 are the signature count + placeholder.
// We pass the message as a hex string to OWS signMessage().
// signMessage(wallet, chain, message, passphrase?, encoding?, index?, vaultPath?)
// passphrase is undefined (use env or interactive), encoding is "hex" (5th param).

const messageHex = tx.subarray(65).toString("hex");
const signResult = signMessage(walletName, "solana", messageHex, undefined, "hex");

// ---------------------------------------------------------------------------
// Step 4: Insert the 64-byte signature at bytes 1-64
// ---------------------------------------------------------------------------

Buffer.from(signResult.signature, "hex").copy(tx, 1);

// ---------------------------------------------------------------------------
// Step 5: Broadcast the assembled transaction as base64
// ---------------------------------------------------------------------------
// Solana RPC sendTransaction expects base64 encoding.

const txBase64 = tx.toString("base64");
const sendResp = await fetch(rpcUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "sendTransaction",
    params: [
      txBase64,
      {
        encoding: "base64",
        skipPreflight: false,
        preflightCommitment: "confirmed",
      },
    ],
  }),
}).then((r) => r.json());

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (flags.json) {
  console.log(JSON.stringify(sendResp, null, 2));
} else if (sendResp.error) {
  console.error("Broadcast failed:", sendResp.error.message || JSON.stringify(sendResp.error));
  process.exit(1);
} else {
  console.log("Transaction sent:", sendResp.result);
}
