import type { NextFunction, Request, Response, RequestHandler } from "express";

export const MAINTENANCE_MODE_ENV = "DREAMCARZ_MAINTENANCE_MODE";

const EXCLUDED_API_PREFIXES = [
  "/api/stripe/webhook",
  "/api/cocard/webhook",
  "/api/meta/lead-ads/webhook",
  "/api/integrations/zapier/meta-leads",
  "/api/meta/lead-ads/retry",
] as const;

const maintenancePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>DreamCarz — Coming Soon</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #080908;
        color: #f8f7f2;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body::before, body::after {
        position: fixed;
        content: "";
        border-radius: 999px;
        filter: blur(1px);
        pointer-events: none;
      }
      body::before {
        width: 44rem;
        height: 44rem;
        top: -27rem;
        left: -18rem;
        background: radial-gradient(circle, rgba(185, 142, 57, .28), transparent 67%);
      }
      body::after {
        width: 36rem;
        height: 36rem;
        right: -20rem;
        bottom: -22rem;
        background: radial-gradient(circle, rgba(255, 255, 255, .12), transparent 68%);
      }
      main {
        position: relative;
        width: min(42rem, calc(100% - 3rem));
        padding: 3.5rem 2rem;
        text-align: center;
      }
      .mark {
        display: inline-grid;
        place-items: center;
        width: 3.25rem;
        height: 3.25rem;
        border: 1px solid rgba(224, 185, 92, .68);
        border-radius: 50%;
        color: #dfb95c;
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: .12em;
      }
      .eyebrow {
        margin: 2.25rem 0 1rem;
        color: #dfb95c;
        font-size: .7rem;
        font-weight: 800;
        letter-spacing: .22em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: clamp(3rem, 9vw, 6.5rem);
        font-weight: 400;
        letter-spacing: -.065em;
        line-height: .92;
      }
      p {
        max-width: 32rem;
        margin: 1.65rem auto 0;
        color: #c9c8c1;
        font-size: clamp(1rem, 2vw, 1.15rem);
        line-height: 1.65;
      }
      .rule {
        width: 4rem;
        height: 1px;
        margin: 2.5rem auto 0;
        background: #dfb95c;
      }
      .footer {
        margin-top: 1.15rem;
        color: #85877f;
        font-size: .72rem;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="mark" aria-label="DreamCarz">DC</div>
      <div class="eyebrow">DreamCarz Network</div>
      <h1>Coming Soon</h1>
      <p>We are preparing a better DreamCarz experience. Please check back soon.</p>
      <div class="rule" aria-hidden="true"></div>
      <div class="footer">Drive your dream</div>
    </main>
  </body>
</html>`;

export function isMaintenanceModeEnabled(value = process.env[MAINTENANCE_MODE_ENV]) {
  return value?.trim().toLowerCase() === "true";
}

export function isMaintenanceExemptPath(pathname: string) {
  return EXCLUDED_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function wantsHtml(req: Request) {
  const accept = req.headers.accept ?? "";
  return req.method === "GET" || req.method === "HEAD" || accept.includes("text/html");
}

export function maintenanceModeGate(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isMaintenanceModeEnabled() || isMaintenanceExemptPath(req.path)) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Retry-After", "3600");

    if (wantsHtml(req)) {
      res.status(503).type("html").send(maintenancePage);
      return;
    }

    res.status(503).json({
      error: "maintenance_mode",
      message: "DreamCarz is temporarily unavailable while we prepare the next experience.",
    });
  };
}
