import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./directAuth";

describe("direct DreamCarz password handling", () => {
  it("creates a salted hash that verifies only the original password", async () => {
    const password = "DreamCarz!2026";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("NotTheSamePassword", hash)).resolves.toBe(false);
  });

  it("rejects malformed stored password records", async () => {
    await expect(verifyPassword("DreamCarz!2026", "not-a-valid-hash")).resolves.toBe(false);
  });
});
