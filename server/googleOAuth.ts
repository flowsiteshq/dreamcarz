import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { DIRECT_SESSION_COOKIE, DIRECT_SESSION_MAX_AGE_MS } from "../shared/const";
import { createDirectSession, findOrCreateGoogleAccount } from "./directAuth.ts";
import { getSessionCookieOptions } from "./_core/cookies";

const GOOGLE_STATE_COOKIE = "dreamcarz_google_oauth_state";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60_000;

const tokenPayloadSchema = z.object({ id_token: z.string().min(1) });

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function safeGoogleReturnTo(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function encodeStateCookie(state: string, returnTo: string) {
  return Buffer.from(JSON.stringify({ state, returnTo }), "utf8").toString("base64url");
}

function decodeStateCookie(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { state?: unknown; returnTo?: unknown };
    if (typeof parsed.state !== "string" || parsed.state.length < 32) return null;
    return { state: parsed.state, returnTo: safeGoogleReturnTo(parsed.returnTo) };
  } catch {
    return null;
  }
}

function statesMatch(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function callbackFailure(res: Response) {
  res.redirect(302, "/login?google=failed");
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const config = getGoogleOAuthConfig();
    if (!config) {
      res.redirect(302, "/login?google=unavailable");
      return;
    }

    const state = randomBytes(32).toString("base64url");
    const returnTo = safeGoogleReturnTo(req.query.next);
    res.cookie(GOOGLE_STATE_COOKIE, encodeStateCookie(state, returnTo), {
      ...getSessionCookieOptions(req),
      maxAge: OAUTH_STATE_MAX_AGE_MS,
    });

    const authorizationUrl = new URL(GOOGLE_AUTHORIZE_URL);
    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "select_account");
    res.redirect(302, authorizationUrl.toString());
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const config = getGoogleOAuthConfig();
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const storedState = decodeStateCookie(parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE]);
    res.clearCookie(GOOGLE_STATE_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });

    if (!config || !code || !state || !storedState || !statesMatch(state, storedState.state)) {
      callbackFailure(res);
      return;
    }

    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: config.redirectUri,
        }),
      });
      if (!tokenResponse.ok) throw new Error("Google token exchange failed");
      const tokenPayload = tokenPayloadSchema.parse(await tokenResponse.json());
      const ticket = await new OAuth2Client(config.clientId).verifyIdToken({
        idToken: tokenPayload.id_token,
        audience: config.clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true) throw new Error("Google account email is not verified");

      const user = await findOrCreateGoogleAccount({
        subject: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
      });
      const session = await createDirectSession(user.id);
      res.cookie(DIRECT_SESSION_COOKIE, session.token, {
        ...getSessionCookieOptions(req),
        maxAge: DIRECT_SESSION_MAX_AGE_MS,
      });
      res.redirect(302, storedState.returnTo);
    } catch (error) {
      console.error("[Google OAuth] callback failed", error);
      callbackFailure(res);
    }
  });
}
