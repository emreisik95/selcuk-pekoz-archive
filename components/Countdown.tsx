"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/fmt";

type Props = {
  targetISO: string;
  /** Initial "now" (ISO). When pinned, no ticking happens (used in mock mode). */
  nowISO?: string;
  /** Freeze countdown — won't tick. Useful for static / mock data. */
  pinned?: boolean;
  big?: boolean;
};

export function Countdown({ targetISO, nowISO, pinned = false, big = true }: Props) {
  const initial = nowISO ? new Date(nowISO) : new Date();
  const [c, setC] = useState(() => countdown(targetISO, initial));

  useEffect(() => {
    if (pinned) return;
    const tick = () => setC(countdown(targetISO));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO, pinned]);

  const numCls = big
    ? "font-serif tabular text-[88px] font-semibold leading-[0.95]"
    : "font-serif tabular text-[44px] font-semibold leading-[0.95]";
  const labelCls = "mt-1.5 font-mono text-[10px] text-muted uppercase";
  const gap = big ? "gap-8" : "gap-5";

  const pad = (n: number) => String(n).padStart(2, "0");

  const items: Array<[string, number]> = [
    ["Gün", c.d],
    ["Saat", c.h],
    ["Dk", c.m],
  ];
  if (big) items.push(["Sn", c.s]);

  return (
    <div className={"flex items-baseline " + gap}>
      {items.map(([label, val]) => (
        <div key={label} className="flex flex-col items-start">
          <span className={numCls} style={{ letterSpacing: "-0.04em" }}>
            {pad(val)}
          </span>
          <span className={labelCls} style={{ letterSpacing: "0.1em" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
