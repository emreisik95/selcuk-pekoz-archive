// YouTube PubSubHubbub callback.
//
// GET  — hub verification handshake. Echo hub.challenge if subscription
//        details match.
// POST — push notification. Atom body contains videoId(s); we trigger a
//        background sync to ingest the new video right away.

import { spawn } from "node:child_process";
import { getAdminConfig } from "@/lib/admin-config";
import {
  parseNotificationVideoIds,
  recordNotificationReceived,
  recordSubscriptionConfirmed,
} from "@/lib/pubsub";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const topic = url.searchParams.get("hub.topic") ?? "";
  const lease = Number(url.searchParams.get("hub.lease_seconds") ?? "0");

  if (!mode || !challenge) {
    return new Response("missing params", { status: 400 });
  }

  const cfg = await getAdminConfig();
  const expectedTopic = cfg.pubsub.channelId
    ? `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${cfg.pubsub.channelId}`
    : null;
  if (!expectedTopic || topic !== expectedTopic) {
    return new Response("topic mismatch", { status: 404 });
  }

  if (mode === "subscribe" && lease > 0) {
    await recordSubscriptionConfirmed(lease);
  } else if (mode === "unsubscribe") {
    // Already cleared in unsubscribe API — just confirm the challenge.
  }

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: Request) {
  // We don't strictly verify HMAC here — the topic check + the hub's
  // own signature option could be added later. Keeping it permissive
  // since the worst case is a stranger telling us to fetch a video.
  const xml = await req.text();
  const videoIds = parseNotificationVideoIds(xml);
  if (videoIds.length > 0) {
    await recordNotificationReceived();
    // Trigger a full sync in the background — picks up the new video and
    // updates everything else opportunistically.
    const script = ["dist", "scripts", "sync.cjs"].join("/");
    try {
      const child = spawn("node", [script], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env, SYNC_TRIGGER: "manual" },
      });
      child.unref();
    } catch {
      // Sync isn't critical for the 200 response — the 15-minute live
      // check will still catch up.
    }
  }
  return new Response("ok", { status: 200 });
}
