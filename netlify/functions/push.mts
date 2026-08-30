import type { Config, Context } from "@netlify/functions";
import { getPublicKey, sendTest, subscribe, unsubscribe, type PushHandlerResult } from "../../server/push-handlers";

function json(result: PushHandlerResult) {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/push/public-key" && req.method === "GET") return json(await getPublicKey());
  if (url.pathname === "/api/push/subscribe" && req.method === "POST") return json(await subscribe(await readJsonBody(req)));
  if (url.pathname === "/api/push/subscribe" && req.method === "DELETE") return json(await unsubscribe(await readJsonBody(req)));
  if (url.pathname === "/api/push/test" && req.method === "POST") return json(await sendTest());

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
};

export const config: Config = {
  path: ["/api/push/public-key", "/api/push/subscribe", "/api/push/test"],
};
