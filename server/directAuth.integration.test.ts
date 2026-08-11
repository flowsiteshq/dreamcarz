import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { authSessions, userCredentials, users } from "../drizzle/schema";
import { createDirectSession, getDirectSessionUser, loginDirectAccount, registerDirectAccount, revokeDirectSession } from "./directAuth";
import { getDb } from "./db";

const testEmail = `dreamcarz-auth-smoke-${Date.now()}@example.test`;
let testUserId: number | null = null;

afterAll(async () => {
  if (!testUserId) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(authSessions).where(eq(authSessions.userId, testUserId));
  await db.delete(userCredentials).where(eq(userCredentials.userId, testUserId));
  await db.delete(users).where(eq(users.id, testUserId));
});

describe("direct DreamCarz account flow", () => {
  it("registers a member, authenticates a session, logs in, and revokes the session", async () => {
    const password = "DreamCarz!2026";
    const registered = await registerDirectAccount({
      name: "DreamCarz Auth Smoke Test",
      email: testEmail,
      password,
    });

    expect(registered).not.toBeNull();
    testUserId = registered!.id;
    expect(registered?.email).toBe(testEmail);
    expect(registered?.loginMethod).toBe("password");

    const session = await createDirectSession(registered!.id);
    const sessionUser = await getDirectSessionUser(session.token);
    expect(sessionUser?.id).toBe(registered!.id);

    const loggedIn = await loginDirectAccount(testEmail, password);
    expect(loggedIn?.id).toBe(registered!.id);
    await expect(loginDirectAccount(testEmail, "incorrect-password")).resolves.toBeNull();

    await revokeDirectSession(session.token);
    await expect(getDirectSessionUser(session.token)).resolves.toBeNull();
  });
});
