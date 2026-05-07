import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getNow, getPastStreams } from "@/lib/streams";
import { tagCounts } from "@/lib/tags";
import { ArchiveBrowser } from "./ArchiveBrowser";

export const revalidate = 60;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ etiket?: string }>;
}) {
  const { etiket } = await searchParams;
  const past = getPastStreams();
  const now = getNow();
  const totalHours = Math.round(
    past.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 3600,
  );
  const tags = tagCounts(past);

  return (
    <>
      <Nav />
      <main className="flex-1">
        <ArchiveBrowser
          streams={past}
          totalHours={totalHours}
          nowISO={now.toISOString()}
          tags={tags.map((t) => t.tag)}
          initialTag={etiket ?? null}
        />
      </main>
      <Footer />
    </>
  );
}
