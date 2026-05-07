import type { CSSProperties } from "react";
import type { Stream } from "@/lib/types";
import { duration as fmtDuration } from "@/lib/fmt";

type ThumbVariant = "blocks" | "stripes" | "type";

function pickVariant(id: string): ThumbVariant {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (["blocks", "stripes", "type"] as const)[hash % 3];
}

type ThumbProps = {
  stream: Stream;
  showLive?: boolean;
  variant?: ThumbVariant;
  className?: string;
  style?: CSSProperties;
};

export function Thumb({
  stream,
  showLive = true,
  variant,
  className,
  style,
}: ThumbProps) {
  const [bg, accent, deep] = stream.palette;
  const v = variant ?? pickVariant(stream.id);
  const isLive = stream.kind === "live" && showLive;
  const useReal = !!stream.thumbnailUrl;

  return (
    <div
      className={"relative w-full h-full overflow-hidden " + (className ?? "")}
      style={{ background: bg, ...style }}
    >
      {useReal && (
        <img
          src={stream.thumbnailUrl}
          alt={stream.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {!useReal && v === "blocks" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${bg} 0%, ${deep} 100%)`,
            }}
          />
          <div
            className="absolute"
            style={{
              right: "-10%",
              top: "-10%",
              width: "70%",
              height: "70%",
              background: accent,
              transform: "rotate(15deg)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 px-2.5 py-2 font-mono text-[9px] uppercase opacity-85 text-white"
            style={{ letterSpacing: "0.05em" }}
          >
            #{stream.episodeNo}
          </div>
          <div
            className="absolute text-white font-extrabold leading-none"
            style={{
              top: "38%",
              left: "8%",
              right: "40%",
              fontSize: "min(3vw, 22px)",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {String(stream.episodeNo).padStart(3, "0")}
          </div>
        </>
      )}
      {!useReal && v === "stripes" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(45deg, ${bg} 0 14px, ${deep} 14px 28px)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)",
            }}
          />
          <div
            className="absolute top-3 left-3 rounded-full"
            style={{ width: 28, height: 28, background: accent }}
          />
          <div
            className="absolute bottom-2 left-2.5 right-2.5 text-white text-[11px] font-semibold leading-tight"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
          >
            {stream.title.length > 32
              ? stream.title.slice(0, 30) + "…"
              : stream.title}
          </div>
        </>
      )}
      {!useReal && v === "type" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${accent}55 0%, ${bg} 60%, ${deep} 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center"
            style={{
              fontSize: "min(4vw, 28px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            SP
          </div>
          <div
            className="absolute bottom-2 left-2.5 right-2.5 font-mono text-[9px] uppercase"
            style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em" }}
          >
            EP·{String(stream.episodeNo).padStart(3, "0")}
          </div>
        </>
      )}
      {isLive && (
        <div
          className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-[3px] text-[9px] font-bold text-white"
          style={{
            background: "#dc2626",
            letterSpacing: "0.08em",
            borderRadius: 2,
          }}
        >
          <span
            className="live-dot inline-block w-[5px] h-[5px] rounded-full"
            style={{ background: "#fff" }}
          />
          CANLI
        </div>
      )}
      {stream.durationSec ? (
        <div
          className="absolute bottom-1.5 right-1.5 px-[5px] py-[2px] font-mono text-[9px] font-semibold text-white"
          style={{ background: "rgba(0,0,0,0.78)", borderRadius: 2 }}
        >
          {fmtDuration(stream.durationSec)}
        </div>
      ) : null}
    </div>
  );
}
