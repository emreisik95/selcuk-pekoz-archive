import type { BannerTone } from "@/lib/admin-config";

type Props = {
  message: string;
  tone: BannerTone;
};

export function BannerView({ message, tone }: Props) {
  if (!message) return null;
  const tonePrefix =
    tone === "celebration" ? "🎉" : tone === "warning" ? "⚠️" : "📣";
  const tonalCls =
    tone === "warning"
      ? "bg-red text-white"
      : tone === "celebration"
        ? "bg-ink text-bg"
        : "bg-event-past text-text border-b border-hair";

  return (
    <div className={"w-full text-[13px] " + tonalCls} role="status" aria-live="polite">
      <div className="px-5 md:px-10 py-2.5 flex items-center gap-3">
        <span aria-hidden>{tonePrefix}</span>
        <span className="leading-snug">{message}</span>
      </div>
    </div>
  );
}
