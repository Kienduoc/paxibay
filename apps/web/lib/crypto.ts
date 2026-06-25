/**
 * Symmetric encryption for BYOK secrets at rest.
 *
 * Uses AES-256-GCM with a server-managed master key (env var BYOK_MASTER_KEY).
 * Nonce is generated per encryption and stored alongside ciphertext.
 *
 * For production, rotate to pgsodium / Supabase Vault. This is the MVP path.
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getMasterKey(): Buffer {
  const key = process.env.BYOK_MASTER_KEY;
  if (!key) {
    throw new Error(
      "BYOK_MASTER_KEY env var required (generate via: openssl rand -base64 32)",
    );
  }
  return Buffer.from(key, "base64");
}

/** Encrypt a secret. Returns base64-encoded blob `nonce:ciphertext:tag`. */
export function encryptSecret(plaintext: string): string {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getMasterKey(), nonce);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [nonce, ct, tag].map((b) => b.toString("base64")).join(":");
}

/** Decrypt a base64 blob produced by encryptSecret. */
export function decryptSecret(blob: string): string {
  const parts = blob.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted blob format");
  }
  const [nonce, ct, tag] = parts.map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv(ALGO, getMasterKey(), nonce!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(ct!), decipher.final()]).toString("utf8");
}
