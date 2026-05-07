import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { isAdmin } from "@/lib/auth";
import { listManualEvents } from "@/lib/manual";
import { dateTR } from "@/lib/fmt";
import { AdminPanel } from "./AdminPanel";

export const metadata = {
  title: "Yönetici paneli",
  robots: { index: false, follow: false },
};

export default async function AdminPanelPage() {
  if (!(await isAdmin())) redirect("/admin");
  const events = listManualEvents();
  // Sort by scheduledAt ascending (upcoming first)
  events.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

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
              Manuel yayınlar
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
