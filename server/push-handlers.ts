import webpush from "web-push";
import mysql from "mysql2/promise";

const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const subject = process.env.VAPID_SUBJECT ?? "";

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function isPushConfigured() {
  return Boolean(publicKey && privateKey && subject);
}

let connectionPromise: Promise<mysql.Connection> | null = null;

async function getConnection() {
  if (!connectionPromise) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    connectionPromise = mysql.createConnection(url);
  }
  return connectionPromise;
}

function isSubscription(value: unknown): value is { endpoint: string; keys?: { p256dh?: string; auth?: string } } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return typeof candidate.endpoint === "string" && candidate.endpoint.length > 20 && typeof candidate.keys?.p256dh === "string" && typeof candidate.keys?.auth === "string";
}

export interface PushHandlerResult {
  status: number;
  body: unknown;
}

export async function getPublicKey(): Promise<PushHandlerResult> {
  if (!publicKey) return { status: 503, body: { error: "Push notifications are not configured" } };
  return { status: 200, body: { publicKey } };
}

export async function subscribe(body: unknown): Promise<PushHandlerResult> {
  if (!isPushConfigured()) return { status: 503, body: { error: "Push notifications are not configured" } };
  const subscription = (body as { subscription?: unknown } | null)?.subscription;
  if (!isSubscription(subscription)) return { status: 400, body: { error: "Invalid push subscription" } };
  try {
    const connection = await getConnection();
    await connection.execute(
      `INSERT INTO push_subscriptions (userId, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), updatedAt = CURRENT_TIMESTAMP`,
      [0, subscription.endpoint, subscription.keys?.p256dh ?? null, subscription.keys?.auth ?? null],
    );
    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("[push] subscription persistence failed", error);
    return { status: 500, body: { error: "Unable to save push subscription" } };
  }
}

export async function unsubscribe(body: unknown): Promise<PushHandlerResult> {
  const endpoint = typeof (body as { endpoint?: unknown } | null)?.endpoint === "string" ? (body as { endpoint: string }).endpoint : "";
  if (!endpoint) return { status: 400, body: { error: "Missing push endpoint" } };
  try {
    const connection = await getConnection();
    await connection.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
    return { status: 200, body: { ok: true } };
  } catch (error) {
    console.error("[push] subscription deletion failed", error);
    return { status: 500, body: { error: "Unable to remove push subscription" } };
  }
}

export async function sendTest(): Promise<PushHandlerResult> {
  if (!isPushConfigured()) return { status: 503, body: { error: "Push notifications are not configured" } };
  try {
    const connection = await getConnection();
    const [rows] = await connection.query("SELECT endpoint, p256dh, auth FROM push_subscriptions");
    const subscriptions = rows as Array<{ endpoint: string; p256dh: string; auth: string }>;
    await Promise.all(subscriptions.map(async (item) => {
      try {
        await webpush.sendNotification({ endpoint: item.endpoint, keys: { p256dh: item.p256dh, auth: item.auth } }, JSON.stringify({ title: "FootyScores Pro", body: "Push notifications are working.", tag: "footyscores-test" }));
      } catch (error) {
        const statusCode = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode: unknown }).statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) await connection.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [item.endpoint]);
      }
    }));
    return { status: 200, body: { ok: true, delivered: subscriptions.length } };
  } catch (error) {
    console.error("[push] test delivery failed", error);
    return { status: 500, body: { error: "Unable to send test notification" } };
  }
}
