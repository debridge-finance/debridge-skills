// Minimal base58 decoder (Bitcoin alphabet) — shared across Solana scripts.
// Only decode is needed; encode is not used anywhere in the pipeline.

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function b58decode(str) {
  const bytes = [0];
  for (const c of str) {
    let carry = ALPHABET.indexOf(c);
    if (carry < 0) throw new Error(`Invalid base58 character: '${c}'`);
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
