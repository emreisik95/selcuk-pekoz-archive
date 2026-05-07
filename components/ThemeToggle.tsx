"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  try {
    localStorage.setItem("theme", t);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mounted
          ? theme === "dark"
            ? "Açık temaya geç"
            : "Koyu temaya geç"
          : "Tema değiştir"
      }
      className="inline-flex items-center justify-center w-8 h-8 text-muted hover:text-text"
      suppressHydrationWarning
    >
      {/* Show sun in dark mode (click to go light), moon in light mode */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        suppressHydrationWarning
      >
        {mounted && theme === "dark" ? (
          <>
            <circle cx="7" cy="7" r="2.5" />
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M2.6 11.4l1.1-1.1M10.3 3.7l1.1-1.1" />
          </>
        ) : (
          <path d="M11.5 8.5A4.5 4.5 0 0 1 5.5 2.5a5 5 0 1 0 6 6Z" />
        )}
      </svg>
    </button>
  );
}
