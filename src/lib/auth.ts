import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, newId, nowIso } from "./db";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "ig_session";
const SESSION_DAYS = 30;
const SCRYPT_N = 16384;

// ---------- passwords ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N });
  return `scrypt$${SCRYPT_N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, n, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, { N: Number(n) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- users ----------

export class AuthError extends Error {}

export function createUser(email: string, name: string, password: string): SessionUser {
  const normalized = email.trim().toLowerCase();
  const exists = db().prepare("SELECT 1 FROM users WHERE email = ?").get(normalized);
  if (exists) throw new AuthError("An account with this email already exists.");
  const id = newId("u_");
  const now = nowIso();
  db()
    .prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, normalized, name.trim(), hashPassword(password), now);
  db().prepare("INSERT INTO preferences (user_id, updated_at) VALUES (?, ?)").run(id, now);
  return { id, email: normalized, name: name.trim() };
}

// A fixed dummy hash so failed lookups take the same time as real ones.
const DUMMY_HASH = hashPassword(randomBytes(12).toString("hex"));

export function authenticate(email: string, password: string): SessionUser | null {
  const row = db()
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as { id: string; email: string; name: string; password_hash: string } | undefined;
  if (!row) {
    verifyPassword(password, DUMMY_HASH);
    return null;
  }
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email, name: row.name };
}

// ---------- sessions ----------

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(userId: string): { token: string; expires: Date } {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db()
    .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, expires.toISOString(), nowIso());
  return { token, expires };
}

export function userForToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    )
    .get(hashToken(token)) as { id: string; email: string; name: string; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
    return null;
  }
  return { id: row.id, email: row.email, name: row.name };
}

export function deleteSessionToken(token: string) {
  db().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
}

export async function startSession(userId: string) {
  const { token, expires } = createSessionToken(userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) deleteSessionToken(token);
  jar.delete(SESSION_COOKIE);
}

/** Data Access Layer entry point: the current user or null. Memoized per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userForToken(token);
});

/** For pages: redirect to /login when signed out. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}
