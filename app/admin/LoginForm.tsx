"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Giriş başarısız");
        setBusy(false);
        return;
      }
      router.push("/admin/panel");
      router.refresh();
    } catch {
      setErr("Bir hata oluştu");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Şifre"
        autoFocus
        className="border border-hair px-3 py-2.5 rounded-[2px] text-[14px] bg-transparent outline-none focus:border-text"
      />
      {err && (
        <p
          className="font-mono text-[11px] text-red"
          style={{ letterSpacing: "0.04em" }}
        >
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !pw}
        className="bg-ink text-bg text-[13px] font-medium px-4 py-2.5 rounded-[2px] disabled:opacity-50"
      >
        {busy ? "Giriliyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
