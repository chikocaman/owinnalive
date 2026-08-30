function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export type PushStatus = "unsupported" | "default" | "denied" | "subscribed" | "error";

export async function getPushStatus(): Promise<PushStatus> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "subscribed" : Notification.permission === "default" ? "default" : "error";
}

export async function enablePushNotifications(): Promise<PushStatus> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "default";

  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const response = await fetch("/api/push/public-key");
  if (!response.ok) throw new Error("Push notifications are not configured");
  const { publicKey } = (await response.json()) as { publicKey: string };
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeBase64Url(publicKey) });
  const save = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription }) });
  if (!save.ok) throw new Error("Unable to save push subscription");
  return "subscribed";
}

export async function disablePushNotifications(): Promise<PushStatus> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "default";
  await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  await subscription.unsubscribe();
  return "default";
}

export async function sendPushTest() {
  const response = await fetch("/api/push/test", { method: "POST" });
  if (!response.ok) throw new Error("Unable to send a test notification");
}
