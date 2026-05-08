"use client";

import { useCallback, useEffect, useState } from "react";

type ToastState = { msg: string; key: number } | null;

export function CalendarActions() {
  const [toast, setToast] = useState<ToastState>(null);
  const [feedUrl, setFeedUrl] = useState<string>("/feed.ics");
  const [webcalUrl, setWebcalUrl] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setFeedUrl(`${origin}/feed.ics`);
    setWebcalUrl(`${origin.replace(/^https?:/, "webcal:")}/feed.ics`);
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
      showToast("Bağlantı kopyalandı.");
      return true;
    } catch {
      window.prompt("Bu bağlantıyı kopyala:", feedUrl);
      return false;
    }
  }, [feedUrl, showToast]);

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
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex bg-ink text-bg text-[12px] px-3 py-1.5 rounded-[2px] hover:opacity-90"
      >
        Takvime ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative bg-bg border border-hair rounded-[2px] max-w-md w-full p-5 md:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <div className="flex items-baseline justify-between mb-4">
              <h3
                className="font-serif text-[18px] font-semibold"
                style={{ letterSpacing: "-0.015em" }}
              >
                Takvime ekle
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[12px] text-muted hover:text-text"
              >
                Kapat
              </button>
            </div>
            <p className="text-[13px] text-muted leading-relaxed mb-4">
              Yaklaşan yayınları otomatik takvimine eklemek için aşağıdaki
              seçeneklerden birini kullan.
            </p>
            <div className="space-y-2.5">
              <a
                href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 border border-hair rounded-[2px] px-4 py-3 hover:border-text"
              >
                <div>
                  <div className="text-[14px] font-medium">Google Takvim</div>
                  <div className="text-[12px] text-muted mt-0.5">
                    Kabul ederek aboneliği başlat
                  </div>
                </div>
                <span className="text-muted text-[12px]">↗</span>
              </a>
              <a
                href={webcalUrl}
                className="flex items-center justify-between gap-3 border border-hair rounded-[2px] px-4 py-3 hover:border-text"
              >
                <div>
                  <div className="text-[14px] font-medium">
                    Apple Takvim · Outlook · vd.
                  </div>
                  <div className="text-[12px] text-muted mt-0.5">
                    webcal:// linkini varsayılan takvim uygulamasında aç
                  </div>
                </div>
                <span className="text-muted text-[12px]">↗</span>
              </a>
              <button
                type="button"
                onClick={copyFeed}
                className="w-full flex items-center justify-between gap-3 border border-hair rounded-[2px] px-4 py-3 hover:border-text text-left"
              >
                <div>
                  <div className="text-[14px] font-medium">Bağlantıyı kopyala</div>
                  <div className="text-[12px] text-muted mt-0.5 break-all">
                    {feedUrl}
                  </div>
                </div>
                <span className="text-muted text-[12px]">⎘</span>
              </button>
            </div>
            <p className="mt-4 text-[11px] text-faint leading-relaxed">
              Google &quot;URL bulunamadı&quot; derse, &quot;Bağlantıyı kopyala&quot;
              ile URL&apos;yi al, Google Takvim &gt; Diğer takvimler &gt; URL&apos;den
              ekle alanına yapıştır.
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast.key}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] max-w-sm bg-ink text-bg text-[12px] px-4 py-2.5 rounded-[2px] shadow-lg"
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
