"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ManualEvent } from "@/lib/types";
import type { SyncLogEntry } from "@/lib/sync-log";
import type { AdminConfig, BannerTone } from "@/lib/admin-config";

type EventWithLabel = ManualEvent & { dateLabel: string };
type Tab = "events" | "content" | "system";

type StreamLite = {
  id: string;
  title: string;
  kind: string;
  scheduledAt: string;
  thumbnailUrl: string;
};

export function AdminPanel({
  initialEvents,
  initialLog,
  initialConfig,
  streamCatalog,
}: {
  initialEvents: EventWithLabel[];
  initialLog: SyncLogEntry[];
  initialConfig: AdminConfig;
  streamCatalog: StreamLite[];
}) {
  const [tab, setTab] = useState<Tab>("events");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="px-5 md:px-10 pt-5 pb-10">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex">
          {([
            ["events", "Manuel yayınlar"],
            ["content", "İçerik"],
            ["system", "Sistem"],
          ] as const).map(([k, label], i) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={
                "border border-hair text-[12px] px-3 py-1.5 rounded-[2px] " +
                (tab === k
                  ? "bg-ink text-bg border-ink"
                  : "bg-transparent text-text") +
                (i > 0 ? " -ml-px" : "")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={logout}
          className="font-mono text-[11px] uppercase text-muted hover:text-text"
          style={{ letterSpacing: "0.08em" }}
        >
          Çıkış yap
        </button>
      </div>

      {tab === "events" && <EventsTab initialEvents={initialEvents} />}
      {tab === "content" && (
        <ContentTab initialConfig={initialConfig} catalog={streamCatalog} />
      )}
      {tab === "system" && <SystemTab initialLog={initialLog} />}
    </div>
  );
}

// ── Events tab ─────────────────────────────────────────────────────────────

function EventsTab({ initialEvents }: { initialEvents: EventWithLabel[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithLabel[]>(initialEvents);
  const [mode, setMode] = useState<"none" | "single" | "recurring">("none");
  const [editing, setEditing] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  // Manual events that were planned 12+ hours ago but still don't have a
  // matched YouTube video — likely Selçuk skipped or the auto-match failed.
  const now = Date.now();
  const stuckUnmatched = events.filter((e) => {
    if (e.youtubeId) return false;
    return new Date(e.scheduledAt).getTime() + 12 * 3600 * 1000 < now;
  });

  return (
    <div>
      {stuckUnmatched.length > 0 && (
        <div className="mb-5 border border-red bg-red/10 rounded-[2px] px-4 py-3">
          <div
            className="font-mono text-[10px] uppercase text-red mb-1"
            style={{ letterSpacing: "0.1em" }}
          >
            ⚠ Eşleşmeyen yayınlar
          </div>
          <p className="text-[13px] text-text leading-snug mb-2">
            {stuckUnmatched.length} planlı yayın 12 saatten uzun süredir
            YouTube'da bulunamadı. Selçuk iptal etmiş olabilir, ya da eşleştirmeyi
            elle yapman gerekiyor.
          </p>
          <ul className="text-[12px] text-muted space-y-0.5">
            {stuckUnmatched.slice(0, 5).map((e) => (
              <li key={e.id}>
                · {e.title}{" "}
                <span className="font-mono text-[10px] uppercase text-faint">
                  {e.dateLabel}
                </span>
              </li>
            ))}
            {stuckUnmatched.length > 5 && (
              <li className="text-faint">… +{stuckUnmatched.length - 5} daha</li>
            )}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setMode(mode === "single" ? "none" : "single")}
          className={
            "text-[13px] font-medium px-4 py-2 rounded-[2px] border " +
            (mode === "single"
              ? "bg-ink text-bg border-ink"
              : "border-hair hover:border-text")
          }
        >
          + Yeni yayın
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "recurring" ? "none" : "recurring")}
          className={
            "text-[13px] font-medium px-4 py-2 rounded-[2px] border " +
            (mode === "recurring"
              ? "bg-ink text-bg border-ink"
              : "border-hair hover:border-text")
          }
        >
          ⟳ Tekrar eden plan
        </button>
      </div>

      {mode === "single" && (
        <SingleEventForm
          onCancel={() => setMode("none")}
          onCreated={(ev, label) => {
            setEvents((cur) =>
              [...cur, { ...ev, dateLabel: label }].sort(
                (a, b) =>
                  new Date(a.scheduledAt).getTime() -
                  new Date(b.scheduledAt).getTime(),
              ),
            );
            setMode("none");
            refresh();
          }}
        />
      )}
      {mode === "recurring" && (
        <RecurringForm
          onCancel={() => setMode("none")}
          onCreated={() => {
            setMode("none");
            refresh();
            // Reload list from server next render — keep simple
            location.reload();
          }}
        />
      )}

      {events.length === 0 ? (
        <p className="font-mono text-[12px] text-muted py-8 text-center">
          Henüz manuel yayın yok.
        </p>
      ) : (
        <ul className="divide-y divide-hair border-y border-hair">
          {events.map((e) => (
            <li key={e.id}>
              {editing === e.id ? (
                <EditEventForm
                  event={e}
                  onCancel={() => setEditing(null)}
                  onSaved={(updated, label) => {
                    setEvents((cur) =>
                      cur
                        .map((x) =>
                          x.id === e.id
                            ? { ...x, ...updated, dateLabel: label }
                            : x,
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.scheduledAt).getTime() -
                            new Date(b.scheduledAt).getTime(),
                        ),
                    );
                    setEditing(null);
                    refresh();
                  }}
                />
              ) : linking === e.id ? (
                <LinkForm
                  event={e}
                  onCancel={() => setLinking(null)}
                  onLinked={(updated) => {
                    setEvents((cur) =>
                      cur.map((x) =>
                        x.id === e.id ? { ...x, ...updated } : x,
                      ),
                    );
                    setLinking(null);
                    refresh();
                  }}
                />
              ) : (
                <EventRow
                  event={e}
                  onEdit={() => setEditing(e.id)}
                  onLink={() => setLinking(e.id)}
                  onDelete={async () => {
                    if (!confirm("Bu yayını silmek istiyor musun?")) return;
                    await fetch(`/api/admin/events?id=${e.id}`, {
                      method: "DELETE",
                    });
                    setEvents((cur) => cur.filter((x) => x.id !== e.id));
                    refresh();
                  }}
                  onUnlink={async () => {
                    if (!confirm("YouTube bağlantısını kaldırmak istiyor musun?"))
                      return;
                    const res = await fetch(
                      `/api/admin/events?id=${e.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ unlink: true }),
                      },
                    );
                    if (res.ok) {
                      setEvents((cur) =>
                        cur.map((x) =>
                          x.id === e.id
                            ? {
                                ...x,
                                youtubeId: undefined,
                                matchedAt: undefined,
                              }
                            : x,
                        ),
                      );
                      refresh();
                    }
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventRow({
  event,
  onEdit,
  onLink,
  onUnlink,
  onDelete,
}: {
  event: EventWithLabel;
  onEdit: () => void;
  onLink: () => void;
  onUnlink: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium leading-tight">
          {event.title}
          {event.youtubeId && (
            <a
              href={`/y/${event.youtubeId}`}
              className="ml-2 inline-flex items-center bg-ink text-bg text-[10px] font-mono uppercase px-1.5 py-[1px] rounded-[1px] hover:opacity-80"
              style={{ letterSpacing: "0.06em" }}
            >
              YouTube ile eşleşti ↗
            </a>
          )}
        </div>
        <div
          className="mt-0.5 font-mono text-[11px] uppercase text-muted"
          style={{ letterSpacing: "0.04em" }}
        >
          {event.dateLabel}
          {event.durationMin ? ` · tahmini ${event.durationMin} dk` : ""}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={onEdit}
          className="font-mono text-[11px] uppercase text-muted hover:text-text px-2 py-1"
          style={{ letterSpacing: "0.08em" }}
        >
          Düzenle
        </button>
        {event.youtubeId ? (
          <button
            type="button"
            onClick={onUnlink}
            className="font-mono text-[11px] uppercase text-muted hover:text-text px-2 py-1"
            style={{ letterSpacing: "0.08em" }}
          >
            Bağı kopar
          </button>
        ) : (
          <button
            type="button"
            onClick={onLink}
            className="font-mono text-[11px] uppercase text-muted hover:text-text px-2 py-1"
            style={{ letterSpacing: "0.08em" }}
          >
            Elle bağla
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="font-mono text-[11px] uppercase text-muted hover:text-red px-2 py-1"
          style={{ letterSpacing: "0.08em" }}
        >
          Sil
        </button>
      </div>
    </div>
  );
}

// ── Forms ──────────────────────────────────────────────────────────────────

function isoFromTRT(date: string, time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const [yy, mo, dd] = date.split("-").map(Number);
  return new Date(Date.UTC(yy, mo - 1, dd, hh - 3, mm, 0)).toISOString();
}

function trtFromIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const trt = new Date(d.getTime() + 3 * 3600 * 1000);
  const yy = trt.getUTCFullYear();
  const mo = String(trt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(trt.getUTCDate()).padStart(2, "0");
  const hh = String(trt.getUTCHours()).padStart(2, "0");
  const mm = String(trt.getUTCMinutes()).padStart(2, "0");
  return { date: `${yy}-${mo}-${dd}`, time: `${hh}:${mm}` };
}

function dateLabelFor(iso: string): string {
  const d = new Date(iso);
  const trt = new Date(d.getTime() + 3 * 3600 * 1000);
  return trt.toLocaleString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function SingleEventForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (ev: ManualEvent, label: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || !date || !time) {
      setErr("Başlık, tarih ve saat gerekli");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scheduledAt: isoFromTRT(date, time),
          description: description.trim() || undefined,
          durationMin: duration ? Number(duration) : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Eklenemedi");
        return;
      }
      const { event } = (await res.json()) as { event: ManualEvent };
      onCreated(event, dateLabelFor(event.scheduledAt));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormCard
      onSubmit={submit}
      err={err}
      onCancel={onCancel}
      busy={busy}
      submitLabel="Ekle"
      title="Yeni yayın"
    >
      <Field label="Başlık" full>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Pazartesi Sohbeti"
          className={inputCls}
        />
      </Field>
      <Field label="Tarih (TRT)">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Saat (TRT)">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tahmini süre (dk, ops)">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={0}
          placeholder="120"
          className={inputCls}
        />
      </Field>
      <Field label="Açıklama (ops)" full>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls + " resize-y"}
        />
      </Field>
    </FormCard>
  );
}

function EditEventForm({
  event,
  onCancel,
  onSaved,
}: {
  event: EventWithLabel;
  onCancel: () => void;
  onSaved: (updated: Partial<ManualEvent>, label: string) => void;
}) {
  const dt = trtFromIso(event.scheduledAt);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(dt.date);
  const [time, setTime] = useState(dt.time);
  const [duration, setDuration] = useState(
    event.durationMin ? String(event.durationMin) : "",
  );
  const [description, setDescription] = useState(event.description ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || !date || !time) {
      setErr("Başlık, tarih ve saat gerekli");
      return;
    }
    setBusy(true);
    try {
      const iso = isoFromTRT(date, time);
      const res = await fetch(`/api/admin/events?id=${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          scheduledAt: iso,
          description: description.trim() || null,
          durationMin: duration ? Number(duration) : null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Kaydedilemedi");
        return;
      }
      const { event: updated } = (await res.json()) as { event: ManualEvent };
      onSaved(updated, dateLabelFor(updated.scheduledAt));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormCard
      onSubmit={submit}
      err={err}
      onCancel={onCancel}
      busy={busy}
      submitLabel="Kaydet"
      title="Yayını düzenle"
    >
      <Field label="Başlık" full>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tarih (TRT)">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Saat (TRT)">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tahmini süre (dk, ops)">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={0}
          className={inputCls}
        />
      </Field>
      <Field label="Açıklama (ops)" full>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls + " resize-y"}
        />
      </Field>
    </FormCard>
  );
}

function LinkForm({
  event,
  onCancel,
  onLinked,
}: {
  event: EventWithLabel;
  onCancel: () => void;
  onLinked: (updated: Partial<ManualEvent>) => void;
}) {
  const [yid, setYid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const id = yid.trim();
    // Allow either a raw video id or a full URL
    const m = id.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
    const videoId = m ? m[1] : id;
    if (videoId.length < 6) {
      setErr("Geçersiz YouTube ID veya URL");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/events?id=${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId: videoId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Bağlanamadı");
        return;
      }
      const { event: updated } = (await res.json()) as { event: ManualEvent };
      onLinked(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormCard
      onSubmit={submit}
      err={err}
      onCancel={onCancel}
      busy={busy}
      submitLabel="Bağla"
      title={`"${event.title}" → YouTube`}
    >
      <Field label="YouTube ID veya URL" full>
        <input
          value={yid}
          onChange={(e) => setYid(e.target.value)}
          placeholder="dQw4w9WgXcQ ya da https://youtu.be/dQw4w9WgXcQ"
          autoFocus
          className={inputCls}
        />
      </Field>
    </FormCard>
  );
}

function RecurringForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [time, setTime] = useState("21:00");
  const [count, setCount] = useState("8");
  const [intervalDays, setIntervalDays] = useState("7");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || !startDate || !time) {
      setErr("Başlık, başlangıç tarihi ve saat gerekli");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/events/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startDate,
          time,
          count: Number(count),
          intervalDays: Number(intervalDays),
          durationMin: duration ? Number(duration) : undefined,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Eklenemedi");
        return;
      }
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormCard
      onSubmit={submit}
      err={err}
      onCancel={onCancel}
      busy={busy}
      submitLabel="Tümünü ekle"
      title="Tekrar eden yayın planı"
    >
      <Field label="Başlık" full>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Pazartesi Sohbeti"
          className={inputCls}
        />
      </Field>
      <Field label="İlk tarih (TRT)">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Saat (TRT)">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tekrar">
        <select
          value={intervalDays}
          onChange={(e) => setIntervalDays(e.target.value)}
          className={inputCls}
        >
          <option value="1">Günlük</option>
          <option value="2">2 günde bir</option>
          <option value="3">3 günde bir</option>
          <option value="7">Haftalık</option>
          <option value="14">2 haftada bir</option>
          <option value="28">4 haftada bir</option>
          <option value="30">Aylık</option>
        </select>
      </Field>
      <Field label="Toplam yayın sayısı">
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          min={1}
          max={52}
          className={inputCls}
        />
      </Field>
      <Field label="Tahmini süre (dk, ops)">
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min={0}
          placeholder="120"
          className={inputCls}
        />
      </Field>
      <Field label="Açıklama (ops)" full>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputCls + " resize-y"}
        />
      </Field>
    </FormCard>
  );
}

// ── Content tab ────────────────────────────────────────────────────────────

function ContentTab({
  initialConfig,
  catalog,
}: {
  initialConfig: AdminConfig;
  catalog: StreamLite[];
}) {
  const router = useRouter();
  const [config, setConfig] = useState<AdminConfig>(initialConfig);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: object) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error ?? "Kaydedilemedi");
        return false;
      }
      const next = (await res.json()) as AdminConfig;
      setConfig(next);
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <BannerEditor config={config} busy={busy} onSave={patch} msg={msg} />
      <PinnedEditor
        config={config}
        catalog={catalog}
        busy={busy}
        onSave={patch}
      />
      <HiddenList
        config={config}
        catalog={catalog}
        busy={busy}
        onSave={patch}
      />
      <OverrideEditor catalog={catalog} busy={busy} onSave={patch} />
      <WebhookManager config={config} busy={busy} onSave={patch} />
    </div>
  );
}

function BannerEditor({
  config,
  busy,
  onSave,
  msg,
}: {
  config: AdminConfig;
  busy: boolean;
  onSave: (body: object) => Promise<boolean>;
  msg: string | null;
}) {
  const [message, setMessage] = useState(config.banner?.message ?? "");
  const [tone, setTone] = useState<BannerTone>(config.banner?.tone ?? "info");

  return (
    <section>
      <SectionHeader title="Site banner" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
        <div className="flex flex-col gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuma akşamı özel maraton 21:00'de!"
            className={inputCls}
          />
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] uppercase text-muted"
              style={{ letterSpacing: "0.08em" }}
            >
              Ton
            </span>
            {(["info", "warning", "celebration"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={
                  "border text-[12px] px-2.5 py-1 rounded-[2px] " +
                  (tone === t
                    ? "bg-ink text-bg border-ink"
                    : "border-hair text-text hover:border-text")
                }
              >
                {t === "info" ? "Bilgi" : t === "warning" ? "Uyarı" : "Kutlama"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onSave({ banner: message ? { message, tone } : null })
            }
            className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
          >
            Kaydet
          </button>
          {config.banner && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMessage("");
                onSave({ banner: null });
              }}
              className="border border-hair text-[12px] px-3 py-2 rounded-[2px] hover:border-text disabled:opacity-50"
            >
              Kaldır
            </button>
          )}
        </div>
      </div>
      {msg && (
        <p className="mt-2 font-mono text-[11px] text-muted">{msg}</p>
      )}
      {config.banner && (
        <p
          className="mt-2 font-mono text-[10px] uppercase text-faint"
          style={{ letterSpacing: "0.06em" }}
        >
          Yayında — {new Date(config.banner.updatedAt).toLocaleString("tr-TR")}
        </p>
      )}
    </section>
  );
}

function StreamPicker({
  catalog,
  value,
  onChange,
  placeholder = "Yayın ara…",
}: {
  catalog: StreamLite[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    if (!query) return [] as StreamLite[];
    return catalog
      .filter((s) =>
        s.title.toLocaleLowerCase("tr-TR").includes(query),
      )
      .slice(0, 8);
  }, [catalog, q]);
  const selected = catalog.find((s) => s.id === value);

  return (
    <div className="flex flex-col gap-2">
      {selected && (
        <div className="flex items-center gap-3 border border-hair rounded-[2px] px-3 py-2">
          <div className="text-[13px] font-medium leading-tight flex-1 min-w-0 truncate">
            {selected.title}
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="font-mono text-[11px] uppercase text-muted hover:text-red"
            style={{ letterSpacing: "0.08em" }}
          >
            Kaldır
          </button>
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
      {matches.length > 0 && (
        <ul className="border border-hair rounded-[2px] divide-y divide-hair max-h-60 overflow-y-auto">
          {matches.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-event-past"
              >
                <div className="font-medium leading-tight line-clamp-1">
                  {s.title}
                </div>
                <div
                  className="font-mono text-[10px] uppercase text-faint mt-0.5"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {s.kind} · {new Date(s.scheduledAt).toLocaleDateString("tr-TR")}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PinnedEditor({
  config,
  catalog,
  busy,
  onSave,
}: {
  config: AdminConfig;
  catalog: StreamLite[];
  busy: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [pick, setPick] = useState<string>(config.pinnedVideoId ?? "");
  return (
    <section>
      <SectionHeader title="Sabitlenmiş yayın (anasayfa)" />
      <p className="mb-3 text-[12px] text-muted">
        Anasayfada hero'nun altında öne çıkar.
      </p>
      <StreamPicker catalog={catalog} value={pick} onChange={setPick} />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || pick === (config.pinnedVideoId ?? "")}
          onClick={() => onSave({ pinnedVideoId: pick || null })}
          className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
        >
          Kaydet
        </button>
      </div>
    </section>
  );
}

function HiddenList({
  config,
  catalog,
  busy,
  onSave,
}: {
  config: AdminConfig;
  catalog: StreamLite[];
  busy: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [pick, setPick] = useState("");
  const hidden = config.hiddenVideoIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is StreamLite => Boolean(s));

  return (
    <section>
      <SectionHeader
        title={`Gizlenmiş yayınlar (${config.hiddenVideoIds.length})`}
      />
      <p className="mb-3 text-[12px] text-muted">
        Bu yayınlar tüm public sayfalarda gizlenir. Admin panelden yeniden
        görünür yapabilirsin.
      </p>
      <StreamPicker
        catalog={catalog.filter((s) => !config.hiddenVideoIds.includes(s.id))}
        value={pick}
        onChange={setPick}
        placeholder="Gizlenecek yayını ara…"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy || !pick}
          onClick={async () => {
            const ok = await onSave({ hideVideoId: pick });
            if (ok) setPick("");
          }}
          className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
        >
          Gizle
        </button>
      </div>
      {hidden.length > 0 && (
        <ul className="mt-4 divide-y divide-hair border-y border-hair">
          {hidden.map((s) => (
            <li
              key={s.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium leading-tight truncate">
                  {s.title}
                </div>
                <div
                  className="font-mono text-[10px] uppercase text-faint mt-0.5"
                  style={{ letterSpacing: "0.06em" }}
                >
                  {new Date(s.scheduledAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSave({ unhideVideoId: s.id })}
                className="font-mono text-[11px] uppercase text-muted hover:text-text"
                style={{ letterSpacing: "0.08em" }}
              >
                Geri göster
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OverrideEditor({
  catalog,
  busy,
  onSave,
}: {
  catalog: StreamLite[];
  busy: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  const [pick, setPick] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumb, setThumb] = useState("");

  return (
    <section>
      <SectionHeader title="Yayın override" />
      <p className="mb-3 text-[12px] text-muted">
        Seçili yayının başlık, açıklama veya kapağını değiştir. Boş bırakırsan
        mevcut değer kalır. Tüm alanları boşaltıp kaydedersen override silinir.
      </p>
      <StreamPicker catalog={catalog} value={pick} onChange={setPick} />
      {pick && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Başlık (boş = orijinal)" full>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder={catalog.find((s) => s.id === pick)?.title ?? ""}
            />
          </Field>
          <Field label="Kapak URL" full>
            <input
              value={thumb}
              onChange={(e) => setThumb(e.target.value)}
              className={inputCls}
              placeholder={catalog.find((s) => s.id === pick)?.thumbnailUrl ?? ""}
            />
          </Field>
          <Field label="Açıklama" full>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls + " resize-y"}
            />
          </Field>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const ok = await onSave({
                  override: {
                    videoId: pick,
                    title: title || undefined,
                    description: description || undefined,
                    thumbnailUrl: thumb || undefined,
                  },
                });
                if (ok) {
                  setTitle("");
                  setDescription("");
                  setThumb("");
                  setPick("");
                }
              }}
              className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WebhookManager({
  config,
  busy,
  onSave,
}: {
  config: AdminConfig;
  busy: boolean;
  onSave: (body: object) => Promise<boolean>;
}) {
  return (
    <section>
      <SectionHeader title="Webhook (3rd party event ekleme)" />
      <p className="mb-3 text-[12px] text-muted">
        Bu token ile dış servisler (Discord botu, IFTTT, Zapier) <code>POST /api/webhook/event</code> üzerinden manuel yayın ekleyebilir.
      </p>
      {config.webhookToken ? (
        <div className="border border-hair rounded-[2px] px-3 py-2 mb-3">
          <div
            className="font-mono text-[10px] uppercase text-muted mb-1"
            style={{ letterSpacing: "0.08em" }}
          >
            Aktif token
          </div>
          <code className="text-[12px] break-all select-all">
            {config.webhookToken}
          </code>
        </div>
      ) : (
        <p
          className="font-mono text-[11px] uppercase text-faint mb-3"
          style={{ letterSpacing: "0.06em" }}
        >
          Token yok — webhook devre dışı
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              config.webhookToken &&
              !confirm("Yeni token, eskisini geçersiz kılar. Devam?")
            )
              return;
            onSave({ rotateWebhook: true });
          }}
          className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
        >
          {config.webhookToken ? "Yeni token üret" : "Token oluştur"}
        </button>
      </div>
      <details className="mt-4">
        <summary
          className="cursor-pointer font-mono text-[11px] uppercase text-muted hover:text-text"
          style={{ letterSpacing: "0.08em" }}
        >
          Örnek istek
        </summary>
        <pre className="mt-2 text-[11px] bg-event-past p-3 rounded-[2px] overflow-x-auto">
{`curl -X POST https://sp.emre.zip/api/webhook/event \\
  -H "Authorization: Bearer ${config.webhookToken ?? "<TOKEN>"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Pazartesi Sohbeti",
    "scheduledAt": "2026-05-12T18:00:00Z",
    "description": "haftaya bakış",
    "durationMin": 120
  }'`}
        </pre>
      </details>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      className="font-mono text-[10px] uppercase text-muted mb-3"
      style={{ letterSpacing: "0.12em" }}
    >
      {title}
    </div>
  );
}

// ── System tab ─────────────────────────────────────────────────────────────

function SystemTab({ initialLog }: { initialLog: SyncLogEntry[] }) {
  const [log, setLog] = useState<SyncLogEntry[]>(initialLog);
  const [busy, setBusy] = useState<"full" | "live" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshLog() {
    try {
      const res = await fetch("/api/admin/sync");
      if (res.ok) {
        const j = (await res.json()) as { entries: SyncLogEntry[] };
        setLog(j.entries);
      }
    } catch {
      /* ignore */
    }
  }

  async function trigger(kind: "full" | "live") {
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/sync?kind=${kind}`, {
        method: "POST",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error ?? "Tetiklenemedi");
      } else {
        setMsg(
          kind === "full"
            ? "Full sync tetiklendi (1–3 dk sürebilir). Birazdan logu yenile."
            : "Canlı kontrol tetiklendi (saniyeler içinde tamamlanır).",
        );
        // Poll log a few times
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          await refreshLog();
        }
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div
          className="font-mono text-[10px] uppercase text-muted mb-3"
          style={{ letterSpacing: "0.12em" }}
        >
          Manuel sync
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => trigger("full")}
            disabled={busy !== null}
            className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
          >
            {busy === "full" ? "Çalışıyor…" : "Şimdi full sync et"}
          </button>
          <button
            type="button"
            onClick={() => trigger("live")}
            disabled={busy !== null}
            className="border border-hair text-[13px] font-medium px-4 py-2 rounded-[2px] hover:border-text disabled:opacity-50"
          >
            {busy === "live" ? "Çalışıyor…" : "Canlı yayını şimdi kontrol et"}
          </button>
          <button
            type="button"
            onClick={refreshLog}
            className="font-mono text-[11px] uppercase text-muted hover:text-text px-2"
            style={{ letterSpacing: "0.08em" }}
          >
            Logu yenile
          </button>
        </div>
        {msg && (
          <p
            className="font-mono text-[11px] text-muted mb-2"
            style={{ letterSpacing: "0.04em" }}
          >
            {msg}
          </p>
        )}
        <p
          className="font-mono text-[10px] uppercase text-faint"
          style={{ letterSpacing: "0.06em" }}
        >
          Otomatik: full sync saatte bir · canlı kontrol 15 dakikada bir
        </p>
      </section>

      <section>
        <div
          className="font-mono text-[10px] uppercase text-muted mb-3"
          style={{ letterSpacing: "0.12em" }}
        >
          Son sync'ler
        </div>
        {log.length === 0 ? (
          <p className="font-mono text-[12px] text-muted">
            Henüz log girişi yok.
          </p>
        ) : (
          <ul className="divide-y divide-hair border-y border-hair">
            {log.map((e, i) => (
              <li
                key={i}
                className="py-3 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4"
              >
                <div
                  className="font-mono text-[11px] uppercase tabular shrink-0 w-32"
                  style={{
                    letterSpacing: "0.04em",
                    color: e.ok ? "var(--color-text)" : "var(--color-red)",
                  }}
                >
                  {new Date(e.startedAt).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">
                    <span className="font-medium">
                      {e.kind === "full"
                        ? "Full sync"
                        : e.kind === "live-check"
                          ? "Canlı kontrol"
                          : "Manuel"}
                    </span>
                    {" · "}
                    <span className="text-muted">{e.message}</span>
                    {e.error && (
                      <span className="ml-2 text-red">— {e.error}</span>
                    )}
                  </div>
                  {e.counts && (
                    <div
                      className="mt-0.5 font-mono text-[10px] uppercase text-faint"
                      style={{ letterSpacing: "0.04em" }}
                    >
                      {Object.entries(e.counts)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <div
                  className="font-mono text-[10px] uppercase text-faint shrink-0"
                  style={{ letterSpacing: "0.04em" }}
                >
                  {Math.round(e.durationMs / 1000)}s
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── Form helpers ───────────────────────────────────────────────────────────

const inputCls =
  "border border-hair px-3 py-2 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text w-full";

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={(full ? "md:col-span-2 " : "") + "flex flex-col gap-1"}>
      <span
        className="font-mono text-[10px] uppercase text-muted"
        style={{ letterSpacing: "0.08em" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function FormCard({
  title,
  onSubmit,
  onCancel,
  err,
  busy,
  submitLabel,
  children,
}: {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  err: string | null;
  busy: boolean;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="border border-hair p-4 md:p-5 rounded-[2px] mb-6"
    >
      <div className="flex items-baseline justify-between mb-4">
        <div
          className="font-mono text-[10px] uppercase text-muted"
          style={{ letterSpacing: "0.08em" }}
        >
          {title}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[11px] uppercase text-muted hover:text-text"
          style={{ letterSpacing: "0.08em" }}
        >
          Vazgeç
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-[2px] disabled:opacity-50"
        >
          {busy ? "Çalışıyor…" : submitLabel}
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
  );
}
