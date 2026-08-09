import Link from "next/link";
import type { AdminOverview as AdminOverviewModel } from "@/lib/admin-overview";

type Props = {
  overview: AdminOverviewModel;
};

const modeCopy = {
  live: { label: "Şimdi canlı", tone: "bg-on-air text-white" },
  upcoming: { label: "Sıradaki yayın", tone: "bg-switch text-white" },
  latest: { label: "Son yayın", tone: "bg-broadcast text-paper" },
  empty: { label: "Yayın bekleniyor", tone: "bg-console text-white" },
} as const;

const healthCopy = {
  healthy: {
    label: "Güncel",
    note: "Senkron düzenli çalışıyor.",
    dot: "bg-phosphor",
    tone: "border-lime/35 bg-lime/10",
  },
  review: {
    label: "Kontrol edilmeli",
    note: "Veri altı saatten uzun süredir yenilenmedi.",
    dot: "bg-switch",
    tone: "border-blue/35 bg-blue/10",
  },
  error: {
    label: "Senkron hatası",
    note: "Son hatadan sonra başarılı senkron yok.",
    dot: "bg-on-air",
    tone: "border-red/35 bg-red/10",
  },
} as const;

function formatDate(value?: string | null) {
  if (!value) return "Henüz yok";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function ageLabel(minutes: number | null) {
  if (minutes === null) return "Bilinmiyor";
  if (minutes < 2) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function AdminOverview({ overview }: Props) {
  const mode = modeCopy[overview.publicMode];
  const health = healthCopy[overview.health];
  const healthNote =
    overview.health === "review" && overview.dataAgeMinutes === null
      ? "Henüz başarılı bir senkron kaydı yok."
      : overview.health === "review" &&
          overview.counts.live + overview.counts.upcoming + overview.counts.completed === 0
        ? "Kanal verisi boş; senkron ve yapılandırmayı kontrol et."
        : health.note;
  const coverage = [
    { value: overview.counts.live, label: "Canlı" },
    { value: overview.counts.upcoming, label: "Yaklaşan" },
    { value: overview.counts.completed, label: "Arşiv" },
    { value: overview.counts.shorts, label: "Shorts" },
  ];
  const publishing = [
    { value: overview.publishing.banner ? "Açık" : "Kapalı", label: "Duyuru bandı" },
    { value: overview.publishing.pinned ? "Seçili" : "Yok", label: "Editörün seçimi" },
    { value: overview.publishing.hidden, label: "Gizli yayın" },
    { value: overview.publishing.overrides, label: "İçerik düzenlemesi" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <section className="overflow-hidden rounded-[22px] border border-hair bg-surface">
          <div className="flex items-center justify-between gap-4 border-b border-hair px-5 py-4 md:px-6">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Yayın durumu
              </p>
              <h2 className="font-display mt-1 text-[24px] font-bold tracking-[-0.04em]">
                Sitenin şu an gösterdiği
              </h2>
            </div>
            <span className={`rounded-full px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] ${mode.tone}`}>
              {mode.label}
            </span>
          </div>

          {overview.active ? (
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="aspect-video overflow-hidden bg-broadcast sm:aspect-auto">
                {overview.active.thumbnailUrl ? (
                  <img
                    src={overview.active.thumbnailUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="signal-grid size-full" />
                )}
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-6 p-5 md:p-6">
                <div>
                  <h3 className="font-display text-balance text-[27px] font-bold leading-[1.02] tracking-[-0.04em]">
                    {overview.active.title}
                  </h3>
                  <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    {formatDate(overview.active.scheduledAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/y/${overview.active.id}`}
                    className="rounded-full bg-text px-4 py-2 text-[11px] font-semibold text-bg"
                  >
                    Yayını aç ↗
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    className="rounded-full border border-hair px-4 py-2 text-[11px] font-semibold"
                  >
                    Ana sayfayı gör ↗
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-[13px] text-muted">
              Kamuya gösterilecek yayın bulunmuyor.
            </div>
          )}
        </section>

        <section className={`rounded-[22px] border p-5 md:p-6 ${health.tone}`}>
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
            Veri sağlığı
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className={`size-3 rounded-full ${health.dot}`} />
            <h2 className="font-display text-[30px] font-bold tracking-[-0.04em]">
              {health.label}
            </h2>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-muted">{healthNote}</p>

          <dl className="mt-8 space-y-3 border-t border-current/10 pt-5 text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Son başarılı senkron</dt>
              <dd className="font-mono text-[9px] uppercase tracking-[0.08em]">
                {ageLabel(overview.dataAgeMinutes)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Zaman</dt>
              <dd className="font-mono text-[9px] uppercase tracking-[0.08em]">
                {formatDate(overview.lastSuccess?.finishedAt)}
              </dd>
            </div>
            {overview.latestFailure && (
              <div className="rounded-[10px] bg-red/10 p-3 text-red">
                <dt className="font-semibold">Son hata</dt>
                <dd className="mt-1 break-words text-[10px] leading-4">
                  {overview.latestFailure.error ?? overview.latestFailure.message}
                </dd>
              </div>
            )}
          </dl>

          <Link
            href="/admin/panel?t=system"
            className="mt-6 inline-flex text-[11px] font-semibold hover:underline"
          >
            Sistem kayıtlarını aç ↗
          </Link>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[22px] border border-hair bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                İçerik kapsamı
              </p>
              <h2 className="font-display mt-1 text-[24px] font-bold tracking-[-0.04em]">
                Kanalın veri tabanı
              </h2>
            </div>
            <Link href="/admin/panel?t=events" className="text-[11px] font-semibold text-muted hover:text-text">
              Etkinlik ekle ↗
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hair bg-hair sm:grid-cols-4">
            {coverage.map((item) => (
              <div key={item.label} className="bg-bg p-4">
                <dd className="font-display text-[30px] font-bold leading-none tracking-[-0.04em]">
                  {item.value.toLocaleString("tr-TR")}
                </dd>
                <dt className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-[22px] border border-hair bg-surface p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Yayınlama durumu
              </p>
              <h2 className="font-display mt-1 text-[24px] font-bold tracking-[-0.04em]">
                Sitedeki müdahaleler
              </h2>
            </div>
            <Link href="/admin/panel?t=content" className="text-[11px] font-semibold text-muted hover:text-text">
              İçeriği yönet ↗
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hair bg-hair sm:grid-cols-4">
            {publishing.map((item) => (
              <div key={item.label} className="bg-bg p-4">
                <dd className="font-display text-[25px] font-bold leading-none tracking-[-0.04em]">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString("tr-TR")
                    : item.value}
                </dd>
                <dt className="mt-2 font-mono text-[8px] uppercase leading-4 tracking-[0.1em] text-muted">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-hair pt-4">
        <Link href="/admin/panel?t=events" className="rounded-full border border-hair px-4 py-2 text-[11px] font-semibold hover:bg-surface">
          + Yayın planla
        </Link>
        <Link href="/admin/panel?t=content" className="rounded-full border border-hair px-4 py-2 text-[11px] font-semibold hover:bg-surface">
          Vitrini düzenle
        </Link>
        <Link href="/admin/panel?t=system" className="rounded-full border border-hair px-4 py-2 text-[11px] font-semibold hover:bg-surface">
          Şimdi senkronla
        </Link>
      </div>
    </div>
  );
}
