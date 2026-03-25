#!/usr/bin/env node
//
// deBridge Solana Bridge — sign and broadcast a create_tx response via OWS
//
// Usage:
//   echo '<create_tx JSON>' | node debridge-solana-bridge.mjs <wallet_name> [--rpc <url>] [--json]
//
// The script reads a deBridge create_tx JSON response from stdin.
// The agent calls MCP to get the quote, then pipes it here for signing.
//
// Example:
//   npx -y @apify/mcpc @debridge tools-call create_tx '...' | node debridge-solana-bridge.mjs default
//
// Requires:
//   npm install @open-wallet-standard/core

import { signMessage } from "@open-wallet-standard/core";
import { getRpc } from "../../common/scripts/rpc.mjs";
import { b58decode } from "../../common/scripts/b58.mjs";

// ---------------------------------------------------------------------------
// Parse CLI
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--rpc" && args[i + 1]) flags.rpc = args[++i];
  else if (args[i] === "--json") flags.json = true;
  else if (!args[i].startsWith("--")) positional.push(args[i]);
  else { console.error(`Unknown flag: ${args[i]}`); process.exit(1); }
}

if (positional.length < 1) {
  console.error("Usage: echo '<create_tx JSON>' | node debridge-solana-bridge.mjs <wallet_name> [--rpc <url>] [--json]");
  process.exit(1);
}

const walletName = positional[0];
const rpcUrl = flags.rpc || await getRpc(7565164);

// ---------------------------------------------------------------------------
// Read create_tx response from stdin
// ---------------------------------------------------------------------------
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
const stdinData = Buffer.concat(chunks).toString("utf8");

// Expect plain create_tx JSON on stdin (agent parses MCP response before piping)
const quote = JSON.parse(stdinData.trim());

if (quote.message || quote.code) {
  console.error("deBridge error:", quote.message || JSON.stringify(quote));
  process.exit(1);
}

const est = quote.estimation.dstChainTokenOut;
console.log(`Estimated output: ${(Number(est.amount) / Math.pow(10, est.decimals)).toFixed(4)} ${est.symbol} (~$${est.approximateUsdValue.toFixed(2)})`);
console.log("Order ID:", quote.orderId);

// ---------------------------------------------------------------------------
// Sign and broadcast
// ---------------------------------------------------------------------------
const txHex = quote.tx.data.replace(/^0x/, "");
const tx = Buffer.from(txHex, "hex");

if (tx[0] !== 0x01) {
  console.error(`Expected single-signer tx (byte 0 = 0x01), got 0x${tx[0].toString(16).padStart(2, "0")}`);
  process.exit(1);
}

if (tx.length < 70) {
  console.error(`Transaction too short for expected V0 layout: length=${tx.length}, expected at least 70 bytes`);
  process.exit(1);
}

const numKeys = tx[69];
const blockhashOffset = 70 + numKeys * 32;

if (blockhashOffset + 32 > tx.length) {
  console.error(
    `Transaction too short for expected V0 layout: blockhash would end at offset ${blockhashOffset + 32}, but tx length is ${tx.length}`,
  );
  process.exit(1);
}

// Fetch fresh blockhash
const bhResp = await fetch(rpcUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0", id: 1,
    method: "getLatestBlockhash",
    params: [{ commitment: "confirmed" }],
  }),
}).then((r) => r.json());

if (bhResp.error) {
  console.error("RPC error fetching blockhash:", bhResp.error);
  process.exit(1);
}

// Insert blockhash
const bhValue = bhResp?.result?.value;
if (!bhValue || typeof bhValue.blockhash !== "string") {
  console.error("RPC response missing valid blockhash field:", JSON.stringify(bhResp));
  process.exit(1);
}

const blockhashBytes = b58decode(bhValue.blockhash);
if (blockhashBytes.length !== 32) {
  console.error(`Invalid blockhash length from RPC (expected 32 bytes, got ${blockhashBytes.length})`);
  process.exit(1);
}
blockhashBytes.copy(tx, blockhashOffset);

// Sign message bytes (offset 65+)
console.log("Signing with OWS...");
const messageHex = tx.subarray(65).toString("hex");
const signResult = signMessage(walletName, "solana", messageHex, undefined, "hex");
Buffer.from(signResult.signature, "hex").copy(tx, 1);

// Broadcast
console.log("Broadcasting...");
const txBase64 = tx.toString("base64");
const sendResp = await fetch(rpcUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0", id: 1,
    method: "sendTransaction",
    params: [txBase64, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" }],
  }),
}).then((r) => r.json());

if (sendResp.error) {
  console.error("Broadcast failed:", sendResp.error.message || JSON.stringify(sendResp.error));
  process.exit(1);
}

console.log("Transaction sent:", sendResp.result);
console.log("Order ID:", quote.orderId);
