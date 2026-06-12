"use client";

import { useState } from "react";
import { CalendarPopup } from "./CalendarPopup";

type Props = {
  stream: {
    id: string;
    title: string;
    scheduledAt: string;
    actualStartAt?: string | null;
    actualEndAt?: string | null;
    durationSec?: number | null;
  };
};

export function CalendarButton({ stream }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 border border-hair bg-transparent text-[13px] text-text font-medium px-4 md:px-[18px] py-3 md:py-[10px] rounded-[2px] hover:bg-hair/40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Takvime ekle
      </button>
      {open && (
        <CalendarPopup
          stream={stream}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}