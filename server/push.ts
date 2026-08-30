import type { Express, Request, Response } from "express";
import { getPublicKey, sendTest, subscribe, unsubscribe } from "./push-handlers";

// Simple in-memory rate limiter by IP address
// Tracks requests per endpoint, capped at 5 per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max requests per window
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: Request, endpoint: string): string {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";
  return `${ip}:${endpoint}`;
}

function checkRateLimit(req: Request, endpoint: string): boolean {
  const key = getRateLimitKey(req, endpoint);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetAt) {
    // Reset or create new window
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  current.count++;
  return true;
}

function send(res: Response, result: { status: number; body: unknown }) {
  res.status(result.status).json(result.body);
}

export function registerPushRoutes(app: Express) {
  app.get("/api/push/public-key", async (_req, res) => send(res, await getPublicKey()));
  app.post("/api/push/subscribe", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, "subscribe")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await subscribe(req.body));
  });
  app.delete("/api/push/subscribe", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, "subscribe")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await unsubscribe(req.body));
  });
  app.post("/api/push/test", async (req: Request, res: Response) => {
    if (!checkRateLimit(req, "test")) {
      return send(res, { status: 429, body: { error: "Too many requests" } });
    }
    send(res, await sendTest());
  });
}
