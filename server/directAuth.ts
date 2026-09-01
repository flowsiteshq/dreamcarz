import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { and, eq, gt, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authSessions, userCredentials, users, type User } from "../drizzle/schema";
import { DIRECT_SESSION_MAX_AGE_MS } from "../shared/const";
import { getDb } from "./db";

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;

export type DirectAccountInput = {
  name: string;
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, digest] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !digest) return false;

  const derived = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(digest, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export async function registerDirectAccount(input: DirectAccountInput): Promise<User | null> {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");

  const email = normalizeEmail(input.email);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing[0]) return null;

  const now = new Date();
  const created = await db.insert(users).values({
    openId: `direct_${nanoid(24)}`,
    name: input.name.trim(),
    email,
    loginMethod: "password",
    role: "user",
    lastSignedIn: now,
  });
  const userId = Number(created[0].insertId);
  await db.insert(userCredentials).values({
    userId,
    passwordHash: await hashPassword(input.password),
  });

  const account = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return account[0] ?? null;
}

export async function loginDirectAccount(emailInput: string, password: string): Promise<User | null> {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");

  const email = normalizeEmail(emailInput);
  const account = await db
    .select({ user: users, passwordHash: userCredentials.passwordHash })
    .from(userCredentials)
    .innerJoin(users, eq(userCredentials.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);

  const match = account[0];
  if (!match || !(await verifyPassword(password, match.passwordHash))) return null;

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, match.user.id));
  return { ...match.user, lastSignedIn: new Date() };
}

export async function hasDirectAccountForEmail(emailInput: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");

  const email = normalizeEmail(emailInput);
  const account = await db
    .select({ id: users.id })
    .from(userCredentials)
    .innerJoin(users, eq(userCredentials.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);
  return Boolean(account[0]);
}

export async function createDirectSession(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz sessions are temporarily unavailable");

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DIRECT_SESSION_MAX_AGE_MS);
  await db.delete(authSessions).where(lte(authSessions.expiresAt, now));
  await db.insert(authSessions).values({ userId, tokenHash: tokenHash(token), expiresAt });
  return { token, expiresAt };
}

export async function setDirectPasswordForUser(userId: number, password: string) {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");

  const existingCredential = await db
    .select({ id: userCredentials.id })
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);
  const passwordHash = await hashPassword(password);

  if (existingCredential[0]) {
    await db.update(userCredentials).set({ passwordHash }).where(eq(userCredentials.id, existingCredential[0].id));
  } else {
    await db.insert(userCredentials).values({ userId, passwordHash });
  }
}

export async function getDirectSessionUser(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.tokenHash, tokenHash(token)), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return result[0]?.user ?? null;
}

export async function revokeDirectSession(token: string | undefined) {
  if (!token) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash(token)));
}
