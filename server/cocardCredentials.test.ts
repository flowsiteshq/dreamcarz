import { describe, expect, it } from "vitest";

const cocardQueryKey = process.env.COCARD_QUERY_SECURITY_KEY;

describe("CoCard Query API credential", () => {
  it.skipIf(!cocardQueryKey)("authenticates a harmless impossible transaction lookup", async () => {
    const body = new URLSearchParams({
      security_key: cocardQueryKey!,
      transaction_id: "0",
    });
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 12_000);

    try {
      const response = await fetch("https://secure.cocardgateway.com/api/query.php", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: abortController.signal,
      });
      const responseBody = await response.text();

      expect(response.ok).toBe(true);
      expect(responseBody).toContain("<nm_response>");
      expect(responseBody.toLowerCase()).not.toContain("invalid security key");
    } finally {
      clearTimeout(timeout);
    }
  }, 15_000);
});
