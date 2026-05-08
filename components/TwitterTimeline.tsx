"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets?: { load?: (el?: HTMLElement) => void };
    };
  }
}

type Props = {
  handle: string;
  height?: number;
};

export function TwitterTimeline({ handle, height = 600 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  useEffect(() => {
    const SCRIPT_ID = "twitter-widgets";
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tryLoad = () => {
      if (window.twttr?.widgets?.load && ref.current) {
        window.twttr.widgets.load(ref.current);
        setLoaded(true);
      }
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = "https://platform.twitter.com/widgets.js";
      s.charset = "utf-8";
      s.onload = tryLoad;
      s.onerror = () => setFailed(true);
      document.body.appendChild(s);
    } else {
      tryLoad();
    }

    // If after 6 seconds Twitter didn't render, fall back to a simple link.
    timeoutId = setTimeout(() => {
      const iframe = ref.current?.querySelector("iframe");
      if (!iframe) setFailed(true);
    }, 6000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handle, theme]);

  if (failed) {
    return (
      <div className="border border-hair rounded-[2px] p-6 text-center">
        <p className="text-[14px] text-muted mb-3">
          X.com tweet&apos;leri yüklenemedi
        </p>
        <a
          href={`https://x.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px]"
        >
          @{handle} hesabını X&apos;te aç ↗
        </a>
      </div>
    );
  }

  return (
    <div ref={ref} className="border border-hair rounded-[2px] overflow-hidden">
      <a
        className="twitter-timeline"
        data-height={height}
        data-theme={theme}
        data-chrome="noheader nofooter noborders transparent"
        href={`https://twitter.com/${handle}`}
      >
        @{handle} tweet&apos;leri yükleniyor…
      </a>
      {!loaded && (
        <div className="px-4 py-6 text-center text-[12px] text-muted">
          Tweet&apos;ler yükleniyor…
        </div>
      )}
    </div>
  );
}
