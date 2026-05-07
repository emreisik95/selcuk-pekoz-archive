"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ManualEvent } from "@/lib/types";

type EventWithLabel = ManualEvent & { dateLabel: string };

export function AdminPanel({
  initialEvents,
}: {
  initialEvents: EventWithLabel[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithLabel[]>(initialEvents);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setTitle("");
    setDate("");
    setTime("21:00");
    setDuration("");
    setDescription("");
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || !date || !time) {
      setErr("Başlık, tarih ve saat gerekli");
      return;
    }
    // Combine local TRT date+time → ISO. We treat the user's input as
    // Europe/Istanbul (UTC+3, no DST).
    const [hh, mm] = time.split(":").map(Number);
    const [yy, mo, dd] = date.split("-").map(Number);
    const utc = Date.UTC(yy, mo - 1, dd, hh - 3, mm, 0);
    const iso = new Date(utc).toISOString();

    setBusy("add");
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scheduledAt: iso,
          description: description.trim() || undefined,
          durationMin: duration ? Number(duration) : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Eklenemedi");
        setBusy(null);
        return;
      }
      const j = (await res.json()) as { event: ManualEvent };
      const dateLabel = `${date} · ${time}`;
      setEvents((cur) =>
        [...cur, { ...j.event, dateLabel }].sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        ),
      );
      setAdding(false);
      reset();
      router.refresh();
    } catch {
      setErr("Hata oluştu");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu yayını silmek istiyor musun?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Silinemedi");
        return;
      }
      setEvents((cur) => cur.filter((e) => e.id !== id));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="px-5 md:px-10 pt-5 pb-10">
      <div className="flex items-center justify-between gap-4 mb-5">
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px]"
        >
          {adding ? "Vazgeç" : "+ Yeni yayın"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="font-mono text-[11px] uppercase text-muted hover:text-text"
          style={{ letterSpacing: "0.08em" }}
        >
          Çıkış yap
        </button>
      </div>

      {adding && (
        <form
          onSubmit={submit}
          className="border border-hair p-4 md:p-5 rounded-[2px] mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <label className="md:col-span-2 flex flex-col gap-1">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Başlık
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pazartesi Sohbeti — Haftaya Bakış"
              className="border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Tarih (TRT)
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Saat (TRT)
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Tahmini süre (dk, opsiyonel)
            </span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={0}
              placeholder="120"
              className="border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Açıklama (opsiyonel)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text resize-y"
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy === "add"}
              className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
            >
              {busy === "add" ? "Ekleniyor…" : "Ekle"}
            </button>
            {err && (
              <p
                className="font-mono text-[11px] text-red"
                style={{ letterSpacing: "0.04em" }}
              >
                {err}
              </p>
            )}
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <p className="font-mono text-[12px] text-muted py-8 text-center">
          Henüz manuel yayın yok.
        </p>
      ) : (
        <ul className="divide-y divide-hair border-y border-hair">
          {events.map((e) => (
            <li
              key={e.id}
              className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium leading-tight">
                  {e.title}
                  {e.youtubeId && (
                    <span
                      className="ml-2 inline-flex items-center bg-ink text-bg text-[10px] font-mono uppercase px-1.5 py-[1px] rounded-[1px]"
                      style={{ letterSpacing: "0.06em" }}
                    >
                      YouTube ile eşleşti
                    </span>
                  )}
                </div>
                <div
                  className="mt-0.5 font-mono text-[11px] uppercase text-muted"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {e.dateLabel}
                  {e.durationMin ? ` · tahmini ${e.durationMin} dk` : ""}
                </div>
              </div>
              {e.youtubeId && (
                <a
                  href={`/y/${e.youtubeId}`}
                  className="font-mono text-[11px] uppercase text-muted hover:text-text"
                  style={{ letterSpacing: "0.08em" }}
                >
                  Aç →
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(e.id)}
                disabled={busy === e.id}
                className="font-mono text-[11px] uppercase text-muted hover:text-red disabled:opacity-50"
                style={{ letterSpacing: "0.08em" }}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
