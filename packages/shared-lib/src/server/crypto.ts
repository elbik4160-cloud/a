import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENCRYPT_KEY;
  if (!raw) {
    throw new Error("ENCRYPT_KEY is not set");
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(text: string): string {
  if (text == null) return "";
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(data: string | null | undefined): string {
  if (!data) return "";
  try {
    const key = getKey();
    const buf = Buffer.from(data, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    return "";
  }
}
