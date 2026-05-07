import Link from "next/link";
import type { Stream } from "@/lib/types";
import { Thumb } from "./Thumb";
import { FavoriteButton } from "./FavoriteButton";
import { relTR, views as fmtViews } from "@/lib/fmt";

type Props = {
  stream: Stream;
  now?: Date;
  className?: string;
};

export function MCard({ stream, now, className }: Props) {
  const meta = [relTR(stream.scheduledAt, now)];
  if (stream.viewCount && stream.kind === "completed") {
    meta.push(`${fmtViews(stream.viewCount)} izlenme`);
  }
  return (
    <Link
      href={`/y/${stream.id}`}
      className={"group block " + (className ?? "")}
    >
      <div className="relative w-full aspect-video overflow-hidden rounded-[2px] bg-black">
        <Thumb stream={stream} />
        <FavoriteButton videoId={stream.id} />
      </div>
      <div className="mt-2">
        <h3
          className="text-[13px] font-medium text-text leading-snug text-pretty line-clamp-2 group-hover:underline decoration-hair underline-offset-2"
          style={{ letterSpacing: "-0.005em" }}
        >
          {stream.title}
        </h3>
        <p
          className="mt-1 font-mono text-[11px] text-muted"
          style={{ letterSpacing: "0.02em" }}
        >
          {meta.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
