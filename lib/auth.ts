// Tiny cookie-based admin auth.
// Cookie is `admin = base64(timestamp).hmacHex`. We never store passwords —
// only verify against process.env.ADMIN_PASSWORD on login, and after that
// only verify the HMAC signature against ADMIN_SECRET (or password fallback).

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sp_admin";
const TTL_MS = 30 * 86400 * 1000; // 30 days

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-change-me"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(): string {
  const issuedAt = Date.now();
  const payload = String(issuedAt);
  const sig = sign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return false;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return false;
  }
  const expected = sign(payload);
  if (
    expected.length !== sig.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return false;
  }
  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > TTL_MS) return false;
  return true;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (expected.length !== input.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(input));
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}
