"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "favorites";
const EVT = "favorites:change";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function write(s: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* ignore */
  }
}

export function toggleFavorite(id: string) {
  const s = read();
  if (s.has(id)) s.delete(id);
  else s.add(id);
  write(s);
}

export function isFavorite(id: string) {
  return read().has(id);
}

export function getFavoriteIds(): string[] {
  return [...read()];
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onChange = () => cb();
  window.addEventListener(EVT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useFavorites(): Set<string> {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY) ?? "",
    () => "",
  );
  return new Set<string>(
    (() => {
      try {
        const arr = JSON.parse(snapshot || "[]");
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    })(),
  );
}

export function useIsFavorite(id: string): boolean {
  // Hook for components — subscribes to store
  // Avoid hydration mismatch by returning false on first server pass.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (read().has(id) ? "1" : "0"),
    () => "0",
  );
  return snapshot === "1";
}

export { useEffect };
