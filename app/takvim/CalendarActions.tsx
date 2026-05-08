"use client";

import { useCallback, useEffect, useState } from "react";

type ToastState = { msg: string; key: number } | null;

export function CalendarActions() {
  const [toast, setToast] = useState<ToastState>(null);
  const [feedUrl, setFeedUrl] = useState<string>("/feed.ics");

  useEffect(() => {
    setFeedUrl(`${window.location.origin}/feed.ics`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = useCallback((msg: string) => {
    setToast({ msg, key: Date.now() });
  }, []);

  const copyFeed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      showToast("Bağlantı kopyalandı. Takvim uygulamana yapıştır.");
    } catch {
      // Fallback: select prompt
      window.prompt("Bu bağlantıyı kopyala:", feedUrl);
    }
  }, [feedUrl, showToast]);

  const openGoogle = useCallback(() => {
    // ?cid=<URL-encoded feed> opens Google Calendar with a one-click
    // "Bu takvimi ekle?" prompt — no manual pasting.
    const url = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
      feedUrl,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [feedUrl]);

  return (
    <>
      <button
        type="button"
        onClick={copyFeed}
        className="hidden md:inline-flex border border-hair text-[12px] px-3 py-1.5 rounded-[2px] hover:border-text hover:text-text"
      >
        iCal aboneliği
      </button>
      <button
        type="button"
        onClick={openGoogle}
        className="hidden md:inline-flex bg-ink text-bg text-[12px] px-3 py-1.5 rounded-[2px] hover:opacity-90"
      >
        Google Takvim&apos;e ekle
      </button>

      {toast && (
        <div
          key={toast.key}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 max-w-sm bg-ink text-bg text-[12px] px-4 py-2.5 rounded-[2px] shadow-lg"
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
