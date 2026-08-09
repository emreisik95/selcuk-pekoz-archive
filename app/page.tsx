import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TwitterTimeline } from "@/components/TwitterTimeline";
import { ArchivePortal } from "@/components/channel/ArchivePortal";
import { BroadcastGrid } from "@/components/channel/BroadcastGrid";
import { ChannelHero } from "@/components/channel/ChannelHero";
import { ChannelMetrics } from "@/components/channel/ChannelMetrics";
import { ShortsRail } from "@/components/channel/ShortsRail";
import { getAdminConfig } from "@/lib/admin-config";
import { buildChannelSnapshot } from "@/lib/channel-snapshot";
import { getShorts } from "@/lib/shorts";
import { getAllStreams, getNow, isUsingMockData } from "@/lib/streams";

export const revalidate = 10;

export default function HomePage() {
  const streams = getAllStreams();
  const shorts = getShorts();
  const now = getNow();
  const config = getAdminConfig();
  const snapshot = buildChannelSnapshot(streams, shorts, now);
  const pinned = config.pinnedVideoId
    ? streams.find((stream) => stream.id === config.pinnedVideoId)
    : null;
  const editorialPick = pinned?.id === snapshot.active?.id ? null : pinned;

  return (
    <>
      <Nav />
      <main className="flex-1">
        <ChannelHero
          snapshot={snapshot}
          now={now}
          freezeCountdown={isUsingMockData()}
        />
        <ChannelMetrics totals={snapshot.totals} />
        <BroadcastGrid
          recent={snapshot.recent}
          upcoming={snapshot.upcoming}
          pinned={editorialPick}
          now={now}
        />
        <ShortsRail items={snapshot.latestShorts} now={now} />
        <ArchivePortal popular={snapshot.popular} />

        {config.twitterTimeline?.enabled && config.twitterTimeline.handle && (
          <section className="grid border-b border-hair bg-surface lg:grid-cols-[minmax(260px,.55fr)_minmax(0,1fr)]">
            <div className="flex flex-col justify-between border-b border-hair px-5 py-10 md:px-8 md:py-14 lg:border-b-0 lg:border-r lg:px-10 lg:py-16">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue">
                  Topluluk hattı
                </p>
                <h2 className="font-display mt-3 max-w-[10ch] text-[38px] font-bold leading-[0.96] tracking-[-0.05em] md:text-[52px]">
                  Yayın dışında neler oluyor?
                </h2>
              </div>
              <a
                href={`https://x.com/${config.twitterTimeline.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="signal-link mt-8 inline-flex w-fit items-center gap-2 text-[12px] font-semibold text-muted hover:text-text"
              >
                @{config.twitterTimeline.handle} <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="px-5 py-8 md:px-8 lg:px-10 lg:py-12">
              <div className="mx-auto max-w-[680px] overflow-hidden rounded-[18px] border border-hair bg-bg p-2">
                <TwitterTimeline handle={config.twitterTimeline.handle} height={520} />
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
