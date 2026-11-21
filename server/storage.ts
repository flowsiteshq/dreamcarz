// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

const STORAGE_REQUEST_TIMEOUT_MS = 15_000;

function getForgeConfig() {
  // Read the platform-injected values when a storage operation begins. This
  // avoids retaining an empty startup snapshot during managed restarts.
  const forgeUrl = process.env.BUILT_IN_FORGE_API_URL ?? "";
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY ?? "";

  if (!forgeUrl || !forgeKey) {
    throw new Error("Secure document storage is not configured.");
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function requestSignal() {
  return AbortSignal.timeout(STORAGE_REQUEST_TIMEOUT_MS);
}

function logStorageFailure(operation: string, details: { status?: number; reason?: string }) {
  // Never log provider response bodies, signed URLs, storage keys, credentials,
  // or document contents. The operation and HTTP status are sufficient for
  // server-side diagnostics without leaking sensitive data.
  console.error(`[Storage] ${operation} failed`, details);
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  let presignResp: Response;
  try {
    presignResp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
      signal: requestSignal(),
    });
  } catch (error) {
    logStorageFailure("presign request", { reason: error instanceof Error ? error.name : "unknown" });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  if (!presignResp.ok) {
    logStorageFailure("presign response", { status: presignResp.status });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  let s3Url: string | undefined;
  try {
    const payload = (await presignResp.json()) as { url?: unknown };
    if (typeof payload.url === "string" && payload.url.length > 0) s3Url = payload.url;
  } catch (error) {
    logStorageFailure("presign response parsing", { reason: error instanceof Error ? error.name : "unknown" });
  }
  if (!s3Url) throw new Error("Secure document storage is temporarily unavailable.");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  let uploadResp: Response;
  try {
    uploadResp = await fetch(s3Url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
      signal: requestSignal(),
    });
  } catch (error) {
    logStorageFailure("object upload", { reason: error instanceof Error ? error.name : "unknown" });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  if (!uploadResp.ok) {
    logStorageFailure("object upload response", { status: uploadResp.status });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  let resp: Response;
  try {
    resp = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
      signal: requestSignal(),
    });
  } catch (error) {
    logStorageFailure("signed URL request", { reason: error instanceof Error ? error.name : "unknown" });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  if (!resp.ok) {
    logStorageFailure("signed URL response", { status: resp.status });
    throw new Error("Secure document storage is temporarily unavailable.");
  }

  try {
    const payload = (await resp.json()) as { url?: unknown };
    if (typeof payload.url === "string" && payload.url.length > 0) return payload.url;
  } catch (error) {
    logStorageFailure("signed URL response parsing", { reason: error instanceof Error ? error.name : "unknown" });
  }

  throw new Error("Secure document storage is temporarily unavailable.");
}
