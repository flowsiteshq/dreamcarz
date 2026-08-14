import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { authSessions, userCredentials, users } from "../drizzle/schema";
import { createDirectSession, getDirectSessionUser, loginDirectAccount, registerDirectAccount, revokeDirectSession, setDirectPasswordForUser } from "./directAuth";
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

  it("replaces a member password so an existing account can use direct sign-in", async () => {
    const originalPassword = "DreamCarz!2026";
    const replacementPassword = "DreamCarz!2027";
    const registered = await registerDirectAccount({
      name: "DreamCarz Legacy Password Test",
      email: `dreamcarz-auth-password-${Date.now()}@example.test`,
      password: originalPassword,
    });
    expect(registered).not.toBeNull();
    testUserId = registered!.id;

    await setDirectPasswordForUser(registered!.id, replacementPassword);
    await expect(loginDirectAccount(registered!.email!, originalPassword)).resolves.toBeNull();
    await expect(loginDirectAccount(registered!.email!, replacementPassword)).resolves.toMatchObject({ id: registered!.id });
  });
});
