import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registerPushRoutes } from "./push";
import { registerMalawiRoutes } from "./malawi";
import { proxyEspnRequest, UnsupportedEspnHostError } from "./espn-proxy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function proxyEspn(req: express.Request, res: express.Response) {
  const rawTarget = req.originalUrl.replace(/^\/api\/espn\/?/, "");
  try {
    const result = await proxyEspnRequest(rawTarget);
    res.status(result.status);
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", result.cacheControl);
    res.setHeader("X-FootyScores-Cache", result.cacheStatus);
    res.send(result.body);
  } catch (error) {
    if (error instanceof UnsupportedEspnHostError) {
      res.status(403).json({ error: "Unsupported ESPN host" });
      return;
    }
    if (error instanceof TypeError) {
      res.status(400).json({ error: "Invalid ESPN target" });
      return;
    }
    const message = error instanceof Error && error.name === "AbortError" ? "ESPN request timed out" : "ESPN request failed";
    res.status(504).json({ error: message });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "32kb" }));
  registerPushRoutes(app);
  registerMalawiRoutes(app);
  app.use("/api/espn", (req, res) => void proxyEspn(req, res));

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
