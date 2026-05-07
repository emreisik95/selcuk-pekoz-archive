"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useFavorites } from "@/lib/favorites";

const links = [
  { href: "/", label: "Anasayfa" },
  { href: "/takvim", label: "Takvim" },
  { href: "/arsiv", label: "Arşiv" },
  { href: "/shorts", label: "Shorts" },
  { href: "/istatistikler", label: "İstatistikler" },
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
    <header className="sticky top-0 z-30 bg-bg border-b border-hair">
      <div className="h-14 px-5 md:px-10 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center w-8 h-8 -ml-1.5 text-text"
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
          className="flex items-baseline gap-2 md:justify-self-start min-w-0"
        >
          <span
            className="font-serif text-[16px] md:text-[17px] font-semibold text-text whitespace-nowrap"
            style={{ letterSpacing: "-0.015em" }}
          >
            Selçuk Peköz
          </span>
          <span
            className="hidden sm:inline font-serif text-[15px] text-faint whitespace-nowrap"
            style={{ letterSpacing: "-0.01em" }}
          >
            · Yayın Arşivi
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 md:justify-self-center">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "relative py-1 text-[13px] " +
                  (active ? "text-text" : "text-muted hover:text-text")
                }
              >
                {l.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-ink" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 md:justify-self-end ml-auto md:ml-0">
          <Link
            href="/favorilerim"
            aria-label="Favorilerim"
            className={
              "inline-flex items-center gap-1 " +
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
          <nav
            className="md:hidden absolute left-0 right-0 top-full bg-bg border-b border-hair z-30 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          >
            <div className="px-5 py-2 flex flex-col">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-center justify-between py-3 border-b border-hair last:border-b-0 text-[15px] " +
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
