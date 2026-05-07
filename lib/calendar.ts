import type { Stream } from "./types";

export type MonthCell = {
  date: Date;
  dayOfMonth: number;
  inMonth: boolean;
  events: Stream[];
};

// 35-cell Mon-first grid (5 rows × 7) for a given year/month (0-indexed).
export function buildMonthGrid(
  streams: Stream[],
  year: number,
  month: number,
): MonthCell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const firstDow = (first.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < 35; i++) {
    const dayOfMonth = i - firstDow + 1;
    const inMonth = dayOfMonth >= 1 && dayOfMonth <= daysInMonth;
    const date = new Date(Date.UTC(year, month, dayOfMonth));
    const events = streams.filter((s) => {
      // Bucket by Europe/Istanbul calendar day
      const d = new Date(new Date(s.scheduledAt).getTime() + 3 * 3600 * 1000);
      return (
        d.getUTCFullYear() === date.getUTCFullYear() &&
        d.getUTCMonth() === date.getUTCMonth() &&
        d.getUTCDate() === date.getUTCDate()
      );
    });
    cells.push({ date, dayOfMonth, inMonth, events });
  }
  return cells;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
