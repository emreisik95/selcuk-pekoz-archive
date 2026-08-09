"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useFavorites } from "@/lib/favorites";
import { ChannelMark } from "./ChannelMark";

const links = [
  { href: "/", label: "Sinyal" },
  { href: "/takvim", label: "Takvim" },
  { href: "/arsiv", label: "Arşiv" },
  { href: "/shorts", label: "Shorts" },
  { href: "/istatistikler", label: "Rakamlar" },
];

export function Nav() {
  const pathname = usePathname();
  const favSet = useFavorites();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while menu is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const favActive = isActive("/favorilerim");

  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-bg/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-7 md:px-8 lg:px-10">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          className="inline-flex size-10 -ml-2 items-center justify-center text-text md:hidden"
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 5h14M2 9h14M2 13h14" />
            </svg>
          )}
        </button>

        <Link
          href="/"
          aria-label="Selçuk Peköz Channel HQ — ana sayfa"
          className="min-w-0 md:justify-self-start"
        >
          <ChannelMark />
        </Link>

        <nav className="hidden items-center rounded-full border border-hair bg-surface/70 p-1 md:flex md:justify-self-center">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "relative rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors " +
                  (active
                    ? "bg-text text-bg"
                    : "text-muted hover:bg-text/5 hover:text-text")
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:justify-self-end">
          <Link
            href="/favorilerim"
            aria-label="Favorilerim"
            className={
              "inline-flex size-9 items-center justify-center gap-1 rounded-full border border-transparent hover:border-hair " +
              (favActive ? "text-red" : "text-muted hover:text-text")
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill={favSet.size > 0 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M7 12.2 2.2 7.4a3 3 0 0 1 4.2-4.2L7 3.8l.6-.6a3 3 0 0 1 4.2 4.2L7 12.2Z" />
            </svg>
            {favSet.size > 0 && (
              <span
                className="font-mono text-[10px] tabular"
                style={{ letterSpacing: "0.04em" }}
              >
                {favSet.size}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
            className="md:hidden fixed inset-x-0 top-14 bottom-0 z-20 bg-ink/40 backdrop-blur-sm"
          />
          <nav className="absolute left-0 right-0 top-full z-30 border-b border-hair bg-bg shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:hidden">
            <div className="flex flex-col px-5 py-3">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-center justify-between border-b border-hair py-3.5 text-[15px] last:border-b-0 " +
                      (active ? "text-text font-medium" : "text-muted")
                    }
                  >
                    <span>{l.label}</span>
                    {active && (
                      <span
                        className="font-mono text-[10px] uppercase text-red"
                        style={{ letterSpacing: "0.08em" }}
                      >
                        Aktif
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
