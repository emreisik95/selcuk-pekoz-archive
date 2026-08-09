import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { isAdmin } from "@/lib/auth";
import { listManualEvents } from "@/lib/manual";
import { readLog } from "@/lib/sync-log";
import { dateTR } from "@/lib/fmt";
import { getAdminConfig } from "@/lib/admin-config";
import { getAllStreams, getAllStreamsRaw } from "@/lib/streams";
import { getShorts } from "@/lib/shorts";
import { buildAdminOverview } from "@/lib/admin-overview";
import { AdminPanel } from "./AdminPanel";

export const metadata = {
  title: "Yönetici paneli",
  robots: { index: false, follow: false },
};

export default async function AdminPanelPage() {
  if (!(await isAdmin())) redirect("/admin");
  const [events, allLog, config, visibleStreams] = await Promise.all([
    listManualEvents(),
    readLog(),
    getAdminConfig(),
    getAllStreams(),
  ]);
  events.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const syncLog = allLog.slice(0, 20);
  const allStreams = getAllStreamsRaw();
  const overview = buildAdminOverview({
    streams: visibleStreams,
    shorts: getShorts(),
    log: allLog,
    config,
    now: new Date(),
  });
  const streamCatalog = allStreams.map((s) => ({
    id: s.id,
    title: s.title,
    kind: s.kind,
    scheduledAt: s.scheduledAt,
    thumbnailUrl: s.thumbnailUrl ?? "",
  }));

  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="px-5 md:px-10 pt-5 md:pt-8 pb-5 border-b border-hair">
          <div
            className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.12em" }}
          >
            Yönetici paneli
          </div>
          <div className="flex items-baseline justify-between gap-4 mt-1.5">
            <h1
              className="font-serif text-[26px] md:text-[38px] font-semibold"
              style={{ letterSpacing: "-0.025em" }}
            >
              Yönetim
            </h1>
            <Link
              href="/takvim"
              className="font-mono text-[11px] uppercase text-muted hover:text-text"
              style={{ letterSpacing: "0.08em" }}
            >
              Takvime dön ↗
            </Link>
          </div>
        </div>
        <AdminPanel
          initialEvents={events.map((e) => ({
            ...e,
            dateLabel: dateLabel(e.scheduledAt),
          }))}
          initialLog={syncLog}
          initialConfig={config}
          initialOverview={overview}
          streamCatalog={streamCatalog}
          syncAvailable={process.env.DEPLOY_TARGET !== "cloudflare"}
        />
      </main>
      <Footer />
    </>
  );
}

function dateLabel(iso: string): string {
  const d = dateTR(iso);
  return `${d.weekday} · ${d.day} ${d.monthLong} ${d.year} · ${d.time}`;
}
