"use client";

import { toggleFavorite, useIsFavorite } from "@/lib/favorites";

type Props = {
  videoId: string;
  className?: string;
  /** "card" floats over a thumbnail; "inline" sits next to a button row. */
  variant?: "card" | "inline";
};

export function FavoriteButton({ videoId, className, variant = "card" }: Props) {
  const isFav = useIsFavorite(videoId);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(videoId);
  };

  const cardCls =
    "absolute top-2 right-2 z-10 w-8 h-8 inline-flex items-center justify-center rounded-full backdrop-blur-sm transition-colors " +
    (isFav
      ? "bg-red text-white"
      : "bg-black/40 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100");

  const inlineCls =
    "inline-flex items-center justify-center gap-1.5 border text-[12px] font-medium px-3 py-2 rounded-[2px] transition-colors " +
    (isFav
      ? "border-red text-red"
      : "border-hair text-text hover:border-text");

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={isFav}
      className={(variant === "card" ? cardCls : inlineCls) + " " + (className ?? "")}
    >
      <Heart filled={isFav} />
      {variant === "inline" && (
        <span>{isFav ? "Favoride" : "Favorilere ekle"}</span>
      )}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M7 12.2 2.2 7.4a3 3 0 0 1 4.2-4.2L7 3.8l.6-.6a3 3 0 0 1 4.2 4.2L7 12.2Z" />
    </svg>
  );
}
