import type { ChannelSnapshot } from "@/lib/channel-snapshot";

type Props = {
  totals: ChannelSnapshot["totals"];
};

const compact = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function ChannelMetrics({ totals }: Props) {
  const metrics = [
    { value: totals.broadcasts.toLocaleString("tr-TR"), label: "Yayınlık arşiv" },
    { value: totals.hours.toLocaleString("tr-TR"), label: "Saatlik kayıt" },
    { value: compact.format(totals.views), label: "Toplam izlenme" },
    { value: totals.shorts.toLocaleString("tr-TR"), label: "Kısa video" },
  ];

  return (
    <section aria-label="Kanal özeti" className="border-b border-hair bg-surface">
      <div className="grid grid-cols-2 divide-x divide-y divide-hair md:grid-cols-4 md:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-5 py-5 md:px-8 md:py-6 lg:px-10">
            <p className="font-display text-[30px] font-bold leading-none tracking-[-0.045em] md:text-[38px]">
              {metric.value}
            </p>
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted md:text-[9px]">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
