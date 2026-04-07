import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [salt, digest] = encoded.split(":");
  if (!salt || !digest) {
    return false;
  }
  const incoming = scryptSync(password, salt, 64).toString("hex");
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(incoming, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
