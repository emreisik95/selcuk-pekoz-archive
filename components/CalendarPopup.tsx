"use client";

import { useState } from "react";
import { CloseIcon as XIcon } from "./Icon";
import {
  generateICS,
  googleCalendarUrl,
  appleCalendarUrl,
  downloadICS,
} from "@/lib/calendar";

type Props = {
  stream: {
    id: string;
    title: string;
    scheduledAt: string;
    actualStartAt?: string | null;
    actualEndAt?: string | null;
    durationSec?: number | null;
  };
  onClose: () => void;
};

export function CalendarPopup({ stream, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const start = stream.actualStartAt
    ? new Date(stream.actualStartAt)
    : new Date(stream.scheduledAt);
  const end = stream.actualEndAt
    ? new Date(stream.actualEndAt)
    : stream.durationSec
      ? new Date(start.getTime() + stream.durationSec * 1000)
      : new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const title = stream.title;
  const description = `Selçuk Peköz yayınınız: ${title}\nhttps://youtube.com/watch?v=${stream.id}`;
  const uid = `selcuk-pekoz-${stream.id}@sp.emre.zip`;

  const icsContent = generateICS({ title, start, end, description, uid });
  const gcalUrl = googleCalendarUrl({ title, start, end, description });
  const acalUrl = appleCalendarUrl({ title, start, end });

  const handleDownload = () => {
    downloadICS(`selcuk-pekoz-${stream.id}`, icsContent);
    setCopied("ics");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-title"
    >
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-sm bg-bg border border-hair rounded-[2px] shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
          <h2 id="cal-title" className="font-serif text-[16px] font-medium">
            Takvime ekle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-text rounded-[2px] hover:bg-hair/40"
            aria-label="Kapat"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-sm text-muted">
            <span className="font-medium text-text">{title}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-[2px] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.3 12.7c-.1-.4-.3-.7-.5-1l-2.9-2.8c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4L17.2 12H4c-.6 0-1 .4-1 1s.4 1 1 1h13.2l-2.7 2.7c-.4.4-.4 1 0 1.4.2.2.5.3.7.3s.5-.1.7-.3l3-2.9c.4-.4.4-1 0-1.4z" />
              </svg>
              Google
            </a>

            <a
              href={acalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-[2px] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
              </svg>
              Apple
            </a>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-text bg-transparent border border-hair hover:bg-hair/40 rounded-[2px] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {copied === "ics" ? "İndirildi!" : ".ics dosyasını indir"}
          </button>
        </div>
      </div>
    </div>
  );
}