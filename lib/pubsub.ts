// YouTube PubSubHubbub (WebSub) helpers.
//
// Subscribing to YouTube's hub gives us real-time push notifications
// whenever the watched channel publishes a new video — no polling.
// Lease is up to 5 days; we record the expiry and renew before it lapses.

import { getAdminConfig, patchAdminConfig } from "./admin-config";

const HUB_URL = "https://pubsubhubbub.appspot.com/subscribe";
const MAX_LEASE_SECONDS = 432000; // 5 days

function topicFor(channelId: string): string {
  return `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
}

function callbackFor(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3007";
  return `${base.replace(/\/$/, "")}/api/webhook/youtube`;
}

async function hubRequest(
  channelId: string,
  mode: "subscribe" | "unsubscribe",
  secret?: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const params = new URLSearchParams({
    "hub.callback": callbackFor(),
    "hub.topic": topicFor(channelId),
    "hub.verify": "async",
    "hub.mode": mode,
    "hub.lease_seconds": String(MAX_LEASE_SECONDS),
  });
  if (secret) params.set("hub.secret", secret);

  const res = await fetch(HUB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

export async function subscribeToChannel(
  channelId: string,
): Promise<{ ok: boolean; error?: string }> {
  const secret = `psh_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const r = await hubRequest(channelId, "subscribe", secret);
  if (!r.ok) {
    return { ok: false, error: `hub ${r.status}: ${r.body.slice(0, 200)}` };
  }
  // Hub returns 202 Accepted; verification happens out-of-band on our
  // /api/webhook/youtube GET handler. Persist intent — verification
  // will flip `active` on once the GET hits.
  patchAdminConfig({
    pubsub: {
      channelId,
      active: false,
      leaseExpiresAt: null,
      lastNotifiedAt: getAdminConfig().pubsub.lastNotifiedAt,
      secret,
    },
  });
  return { ok: true };
}

export async function unsubscribeFromChannel(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const cfg = getAdminConfig();
  const channelId = cfg.pubsub.channelId;
  if (!channelId) return { ok: false, error: "Abonelik yok" };
  const r = await hubRequest(channelId, "unsubscribe", cfg.pubsub.secret ?? undefined);
  if (!r.ok) {
    return { ok: false, error: `hub ${r.status}: ${r.body.slice(0, 200)}` };
  }
  patchAdminConfig({
    pubsub: {
      channelId: null,
      active: false,
      leaseExpiresAt: null,
      lastNotifiedAt: cfg.pubsub.lastNotifiedAt,
      secret: null,
    },
  });
  return { ok: true };
}

// Called by the verification GET handler — flips active=true and records lease.
export function recordSubscriptionConfirmed(leaseSeconds: number): void {
  const cfg = getAdminConfig();
  patchAdminConfig({
    pubsub: {
      ...cfg.pubsub,
      active: true,
      leaseExpiresAt: new Date(
        Date.now() + leaseSeconds * 1000,
      ).toISOString(),
    },
  });
}

export function recordNotificationReceived(): void {
  const cfg = getAdminConfig();
  patchAdminConfig({
    pubsub: { ...cfg.pubsub, lastNotifiedAt: new Date().toISOString() },
  });
}

// Extract videoId(s) from the Atom XML body YouTube sends in a
// PubSubHubbub notification. Body looks like:
//   <feed>...<entry>...<yt:videoId>VID</yt:videoId>...</entry>...</feed>
export function parseNotificationVideoIds(xml: string): string[] {
  const ids: string[] = [];
  const re = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    if (m[1]) ids.push(m[1]);
  }
  return ids;
}
