import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Thumb } from "@/components/Thumb";
import { PlayIcon, ExtIcon, ArrowIcon } from "@/components/Icon";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getStreamById } from "@/lib/streams";
import { listManualEvents } from "@/lib/manual";
import { dateTR, duration as fmtDuration, views as fmtViews } from "@/lib/fmt";
import { streamTags } from "@/lib/tags";
import type { Metadata } from "next";
import type { Stream } from "@/lib/types";

function lookupStream(videoId: string): Stream | undefined {
  const real = getStreamById(videoId);
  if (real) return real;
  if (videoId.startsWith("manual:")) {
    const id = videoId.slice("manual:".length);
    const m = listManualEvents().find((e) => e.id === id);
    if (m) {
      return {
        id: `manual:${m.id}`,
        kind: "upcoming",
        title: m.title,
        scheduledAt: m.scheduledAt,
        actualStartAt: null,
        actualEndAt: null,
        durationSec: m.durationMin ? m.durationMin * 60 : null,
        viewCount: null,
        palette: ["#1a1815", "#a8a39c", "#6b6660"],
        episodeNo: 0,
        description: m.description,
      };
    }
  }
  return undefined;
}

const FALLBACK_DESCRIPTION = `Bu yayının açıklaması henüz çekilmedi. Aşağıdaki butondan YouTube'da açabilirsin.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const stream = lookupStream(videoId);
  if (!stream) return { title: "Bulunamadı" };
  const desc = (stream.description ?? "").trim().slice(0, 160) || undefined;
  const img = stream.thumbnailUrl;
  return {
    title: stream.title,
    description: desc,
    openGraph: {
      title: stream.title,
      description: desc,
      type: "article",
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: stream.title,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function DetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const stream = lookupStream(videoId);
  if (!stream) notFound();

  const description = (stream.description?.trim() || FALLBACK_DESCRIPTION);
  const tags = streamTags(stream);
  const d = dateTR(stream.scheduledAt);
  const utcHour = String(new Date(stream.scheduledAt).getUTCHours()).padStart(2, "0");
  const utcMin = String(new Date(stream.scheduledAt).getUTCMinutes()).padStart(2, "0");
  const status =
    stream.kind === "live"
      ? "Canlı"
      : stream.kind === "upcoming"
        ? "Yaklaşan"
        : "Tamamlandı";

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Mobile back row */}
        <div className="md:hidden border-b border-hair px-5 py-3 flex items-center gap-2.5">
          <Link href="/arsiv" className="flex items-center gap-2 text-[13px]">
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <ArrowIcon />
            </span>
            <span
              className="font-mono text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.06em" }}
            >
              Arşiv
            </span>
          </Link>
        </div>

        {/* Mobile full-bleed image */}
        <div className="md:hidden aspect-video bg-black">
          <Thumb stream={stream} />
        </div>

        {/* Desktop breadcrumb */}
        <div
          className="hidden md:block px-10 pt-5 pb-3 font-mono text-[11px] text-muted uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          <Link href="/arsiv" className="hover:text-text">Arşiv</Link>
          {" / "}
          {d.monthLong} {d.year}
          {" / "}
          EP-{String(stream.episodeNo).padStart(3, "0")}
        </div>

        {/* Mobile body */}
        <div className="md:hidden px-5 py-5">
          <div
            className="font-mono text-[10px] uppercase text-muted"
            style={{ letterSpacing: "0.1em" }}
          >
            EP-{String(stream.episodeNo).padStart(3, "0")}
            {stream.durationSec ? ` · ${fmtDuration(stream.durationSec)}` : ""}
          </div>
          <h1
            className="font-serif text-[24px] font-medium leading-[1.15] mt-1.5 text-balance"
            style={{ letterSpacing: "-0.02em" }}
          >
            {stream.title}
          </h1>
          <div
            className="mt-2.5 font-mono text-[11px] uppercase text-muted"
            style={{ letterSpacing: "0.04em" }}
          >
            {d.weekday} · {d.day} {d.monthLong} {d.year} · {d.time}
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link
                  key={t}
                  href={`/arsiv?etiket=${encodeURIComponent(t)}`}
                  className="border border-hair text-[11px] px-2 py-0.5 rounded-[2px] text-muted hover:text-text hover:border-text"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["İzlenme", fmtViews(stream.viewCount)],
              ["Süre", fmtDuration(stream.durationSec)],
              ["Bölüm", String(stream.episodeNo)],
            ].map(([l, v]) => (
              <div key={l} className="border-t border-hair pt-2">
                <div
                  className="font-mono text-[9px] uppercase text-faint"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {l}
                </div>
                <div className="font-serif text-[18px] font-medium mt-0.5">
                  {v || "—"}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif text-[14px] leading-[1.5] text-pretty">
            {description}
          </p>
          <a
            href={`https://youtube.com/watch?v=${stream.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-ink text-bg text-[13px] font-medium py-3 rounded-[2px]"
          >
            <PlayIcon />
            YouTube&apos;da aç
            <ExtIcon />
          </a>
        </div>

        {/* Desktop body */}
        <div className="hidden md:grid px-10 grid-cols-[1fr_380px] gap-10 pb-9">
          <div>
            <div className="aspect-video rounded-[2px] overflow-hidden bg-black">
              <Thumb stream={stream} />
            </div>
            <div className="mt-6">
              <div
                className="font-mono text-[11px] uppercase text-muted"
                style={{ letterSpacing: "0.1em" }}
              >
                Yayın
                {stream.durationSec ? ` — ${fmtDuration(stream.durationSec)}` : ""}
              </div>
              <h1
                className="font-serif text-[36px] font-medium leading-[1.1] mt-2 text-balance"
                style={{ letterSpacing: "-0.025em" }}
              >
                {stream.title}
              </h1>
              <div
                className="mt-3.5 font-mono text-[13px] uppercase text-muted"
                style={{ letterSpacing: "0.04em" }}
              >
                {d.weekday} · {d.day} {d.monthLong} {d.year} · {d.time} (TRT)
                <span className="text-faint">
                  {" "}
                  ↕ {utcHour}:{utcMin} (UTC)
                </span>
              </div>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      href={`/arsiv?etiket=${encodeURIComponent(t)}`}
                      className="border border-hair text-[12px] px-2.5 py-1 rounded-[2px] text-muted hover:text-text hover:border-text"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-6 font-serif text-[16px] leading-[1.55] text-pretty max-w-[640px]">
                {description}
              </p>
            </div>
          </div>

          <aside className="border-l border-hair pl-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 pb-6 border-b border-hair">
              {[
                ["İzlenme", fmtViews(stream.viewCount)],
                ["Süre", fmtDuration(stream.durationSec)],
                ["Bölüm", `EP-${String(stream.episodeNo).padStart(3, "0")}`],
                ["Durum", status],
              ].map(([l, v]) => (
                <div key={l}>
                  <div
                    className="font-mono text-[10px] uppercase text-faint"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {l}
                  </div>
                  <div className="font-serif text-[22px] font-medium mt-1">
                    {v || "—"}
                  </div>
                </div>
              ))}
            </div>
            <a
              href={`https://youtube.com/watch?v=${stream.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-ink text-bg text-[13px] font-medium py-3 rounded-[2px]"
            >
              <PlayIcon />
              YouTube&apos;da aç
              <ExtIcon />
            </a>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <FavoriteButton videoId={stream.id} variant="inline" />
              <button
                type="button"
                className="border border-hair text-[12px] py-2 rounded-[2px] hover:bg-hair/40"
              >
                Paylaş
              </button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
