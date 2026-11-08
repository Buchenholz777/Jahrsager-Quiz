import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Admin-Sitzung: signiertes Cookie "<ablauf>.<hmac>" (Web Crypto, daher auch im Proxy nutzbar).
 */
const enc = new TextEncoder();
const SESSION_MS = 12 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (mind. 32 Zeichen) fehlt.");
    return "dev-fallback-secret-dev-fallback-secret";
  }
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createAdminToken(nowMs = Date.now()): Promise<string> {
  const exp = String(nowMs + SESSION_MS);
  return `${exp}.${await hmac(`admin:${exp}`)}`;
}

export async function verifyAdminToken(token: string | undefined | null, nowMs = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < nowMs) return false;
  const expected = await hmac(`admin:${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export function hashPassword(password: string, salt = crypto.randomUUID().replace(/-/g, "")): string {
  return `scrypt:${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

/** Prüft das Passwort gegen ADMIN_PASSWORD_HASH (bevorzugt) oder ADMIN_PASSWORD (nur lokal). */
export function checkAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [kind, salt, hex] = hash.split(":");
    if (kind !== "scrypt" || !salt || !hex) return false;
    const a = scryptSync(password, salt, 32);
    const b = Buffer.from(hex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (plain && process.env.NODE_ENV !== "production") {
    const a = Buffer.from(password);
    const b = Buffer.from(plain);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return false;
}

// Einfache Begrenzung von Anmeldeversuchen (pro Prozess; in Serverless nur Best-Effort).
const attempts = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number, nowMs = Date.now()): boolean {
  const cur = attempts.get(key);
  if (!cur || cur.reset < nowMs) {
    attempts.set(key, { n: 1, reset: nowMs + windowMs });
    return true;
  }
  cur.n++;
  return cur.n <= max;
}
