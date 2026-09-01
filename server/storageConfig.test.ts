import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const storageSource = readFileSync(resolve(import.meta.dirname, "./storage.ts"), "utf8");

describe("protected storage configuration", () => {
  it("reads platform-injected storage settings when a storage operation starts", () => {
    expect(storageSource).toContain('process.env.BUILT_IN_FORGE_API_URL ?? ""');
    expect(storageSource).toContain('process.env.BUILT_IN_FORGE_API_KEY ?? ""');
    expect(storageSource).not.toContain('const forgeUrl = ENV.forgeApiUrl');
  });
});
