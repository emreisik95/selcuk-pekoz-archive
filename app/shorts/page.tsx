import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getShorts } from "@/lib/shorts";
import { extractTags } from "@/lib/tags";
import { ShortsBrowser } from "./ShortsBrowser";

export const revalidate = 60;

export const metadata = {
  title: "Shorts",
};

export default function ShortsPage() {
  const shorts = getShorts();
  const enriched = shorts.map((s) => ({
    ...s,
    tags: extractTags(s.title),
  }));

  if (shorts.length === 0) {
    return (
      <>
        <Nav />
        <main className="flex-1">
          <div className="px-5 md:px-10 pt-5 md:pt-8 pb-9">
            <div
              className="font-mono text-[10px] md:text-[11px] uppercase text-muted"
              style={{ letterSpacing: "0.12em" }}
            >
              Shorts
            </div>
            <h1
              className="font-serif text-[26px] md:text-[38px] font-medium mt-1.5"
              style={{ letterSpacing: "-0.025em" }}
            >
              Henüz shorts yok
            </h1>
            <p className="mt-3 font-mono text-[12px] text-muted">
              <code className="bg-hair/40 px-1 py-0.5">npm run sync</code>{" "}
              komutunu çalıştırarak en güncel shorts&apos;ları çekebilirsin.
            </p>
            <Link
              href="/arsiv"
              className="mt-4 inline-block font-mono text-[11px] uppercase text-text underline decoration-hair underline-offset-4"
              style={{ letterSpacing: "0.08em" }}
            >
              Arşive göz at
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="flex-1">
        <ShortsBrowser items={enriched} />
      </main>
      <Footer />
    </>
  );
}

