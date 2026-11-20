import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { and, desc, eq, gt, isNull, lte } from "drizzle-orm";
import { adminAccessRequests, authSessions, googleOAuthIdentities, passwordResetTokens, userCredentials, users, type User } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { DIRECT_SESSION_MAX_AGE_MS } from "../shared/const";
import { getDb } from "./db";

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;

export type DirectAccountInput = {
  name: string;
  email: string;
  password: string;
};

export type GoogleIdentityInput = {
  subject: string;
  email: string;
  name: string | null;
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

  const accessDecision = (await db.select({ status: adminAccessRequests.status }).from(adminAccessRequests).where(eq(adminAccessRequests.email, email)).orderBy(desc(adminAccessRequests.createdAt)).limit(1))[0];
  if (accessDecision?.status === "restricted" || accessDecision?.status === "denied") return null;

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

/**
 * Links a verified Google subject to exactly one DreamCarz account. Google
 * access and refresh tokens are never stored by DreamCarz.
 */
export async function findOrCreateGoogleAccount(input: GoogleIdentityInput): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");

  const now = new Date();
  const linked = await db
    .select({ user: users })
    .from(googleOAuthIdentities)
    .innerJoin(users, eq(googleOAuthIdentities.userId, users.id))
    .where(eq(googleOAuthIdentities.googleSubject, input.subject))
    .limit(1);

  if (linked[0]) {
    const emailAtLink = normalizeEmail(input.email);
    await db.update(googleOAuthIdentities).set({ lastSignedIn: now, emailAtLink }).where(eq(googleOAuthIdentities.googleSubject, input.subject));
    await db.update(users).set({ lastSignedIn: now }).where(eq(users.id, linked[0].user.id));
    return { ...linked[0].user, lastSignedIn: now };
  }

  const email = normalizeEmail(input.email);
  const matchingAccount = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const matchedExistingAccount = Boolean(matchingAccount[0]);
  let user = matchingAccount[0];

  if (!user) {
    const created = await db.insert(users).values({
      openId: `google_${nanoid(24)}`,
      name: input.name?.trim() || null,
      email,
      loginMethod: "google",
      role: "user",
      lastSignedIn: now,
    });
    user = (await db.select().from(users).where(eq(users.id, Number(created[0].insertId))).limit(1))[0];
  } else {
    await db.update(users).set({ lastSignedIn: now }).where(eq(users.id, user.id));
    user = { ...user, lastSignedIn: now };
  }

  if (!user) throw new Error("DreamCarz could not create the Google account link");
  try {
    const existingIdentityForUser = await db
      .select({ id: googleOAuthIdentities.id })
      .from(googleOAuthIdentities)
      .where(eq(googleOAuthIdentities.userId, user.id))
      .limit(1);

    if (existingIdentityForUser[0]) {
      await db
        .update(googleOAuthIdentities)
        .set({ googleSubject: input.subject, emailAtLink: email, lastSignedIn: now })
        .where(eq(googleOAuthIdentities.id, existingIdentityForUser[0].id));
    } else {
      await db.insert(googleOAuthIdentities).values({ userId: user.id, googleSubject: input.subject, emailAtLink: email, lastSignedIn: now });
    }
  } catch (error) {
    console.error("[Google OAuth] identity link failed after verified email match", error);
    if (!matchedExistingAccount) throw error;
  }
  return user;
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
  const sessionUser = result[0]?.user;
  if (!sessionUser) return null;
  const accessDecision = (await db.select({ status: adminAccessRequests.status }).from(adminAccessRequests).where(eq(adminAccessRequests.email, sessionUser.email ?? "")).orderBy(desc(adminAccessRequests.createdAt)).limit(1))[0];
  if (accessDecision?.status === "restricted" || accessDecision?.status === "denied") return null;
  return sessionUser;
}

export async function revokeDirectSession(token: string | undefined) {
  if (!token) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash(token)));
}

export async function createPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");
  const token = randomBytes(32).toString("base64url");
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ userId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 30 * 60_000) });
  return token;
}

export async function resetPasswordWithToken(token: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("DreamCarz accounts are temporarily unavailable");
  const record = (await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, tokenHash(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date()))).limit(1))[0];
  if (!record) return false;
  await setDirectPasswordForUser(record.userId, password);
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));
  await db.delete(authSessions).where(eq(authSessions.userId, record.userId));
  return true;
}
