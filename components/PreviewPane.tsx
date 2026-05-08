"use client";

import { useEffect, useRef, useState } from "react";

const PAGES = [
  { path: "/", label: "Anasayfa" },
  { path: "/takvim", label: "Takvim" },
  { path: "/arsiv", label: "Arşiv" },
  { path: "/shorts", label: "Shorts" },
  { path: "/istatistikler", label: "İstatistikler" },
  { path: "/hakkinda", label: "Hakkında" },
] as const;

export function PreviewPane({ refreshKey = 0 }: { refreshKey?: number }) {
  const [page, setPage] = useState<string>("/");
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bump iframe URL whenever the parent says "I just saved something"
  // so the preview reflects fresh server config.
  useEffect(() => {
    setLoaded(false);
    const el = iframeRef.current;
    if (!el) return;
    el.src = `${page}?preview=1&t=${Date.now()}`;
  }, [page, refreshKey]);

  return (
    <div className="sticky top-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className="text-[11px] text-muted mr-1"
            style={{ letterSpacing: "0.04em" }}
          >
            Önizleme
          </span>
          {PAGES.map((p) => (
            <button
              key={p.path}
              type="button"
              onClick={() => setPage(p.path)}
              className={
                "text-[11px] px-2 py-0.5 rounded-[2px] border " +
                (page === p.path
                  ? "border-ink bg-ink text-bg"
                  : "border-hair text-muted hover:text-text hover:border-text")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <a
          href={page}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted hover:text-text"
          aria-label="Yeni sekmede aç"
        >
          ↗
        </a>
      </div>
      <div className="relative border border-hair rounded-[2px] overflow-hidden bg-bg" style={{ height: "calc(100vh - 180px)", minHeight: 480 }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] text-muted">
            Yükleniyor…
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Site önizleme"
          src={`${page}?preview=1`}
          onLoad={() => setLoaded(true)}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
