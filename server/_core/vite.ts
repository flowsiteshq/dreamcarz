import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // The HTML shell must always be revalidated so a phone receives the current
  // hashed CSS/JS references after a deployment. Hashed assets, on the other
  // hand, are immutable and safe to cache long-term. This avoids a stale HTML
  // shell or an incomplete mobile cache rendering the React app without its CSS.
  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        const relativePath = path.relative(distPath, filePath);
        const isHtmlShell = relativePath === "index.html";
        const isVersionedAsset = relativePath.startsWith(`assets${path.sep}`);

        if (isHtmlShell) {
          res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
        } else if (isVersionedAsset) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      },
    })
  );

  // Never return the HTML shell for a missing CSS, JavaScript, image, or font
  // request. A cached mobile HTML shell can reference an older hashed asset;
  // returning index.html with 200 makes Safari reject it as a stylesheet and
  // leaves the otherwise-working React page completely unstyled.
  app.use("*", (req, res, next) => {
    const pathname = (req.originalUrl || req.url || req.path || "").split("?", 1)[0];
    const staleShellAsset = /^\/assets\/index-[^/]+\.(css|js)$/i.exec(pathname);
    if (staleShellAsset) {
      const extension = staleShellAsset[1].toLowerCase();
      const assetsPath = path.join(distPath, "assets");
      const currentAsset = fs
        .readdirSync(assetsPath)
        .find((name) => new RegExp(`^index-[^/]+\\.${extension}$`, "i").test(name));
      if (currentAsset) {
        return res
          .set("Cache-Control", "no-store, max-age=0, must-revalidate")
          .sendFile(path.join(assetsPath, currentAsset));
      }
    }
    const looksLikeAsset = pathname.startsWith("/assets/") || /\.(?:css|js|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|mp4|webm)$/i.test(pathname);
    if (!looksLikeAsset) return next();
    res.status(404).set("Cache-Control", "no-store").end();
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res
      .set("Cache-Control", "no-store, max-age=0, must-revalidate")
      .sendFile(path.resolve(distPath, "index.html"));
  });
}
