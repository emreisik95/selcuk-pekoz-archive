"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => confirmRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative bg-bg border border-hair rounded-[2px] max-w-md w-full p-5 md:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
      >
        <h3
          id="confirm-title"
          className="font-serif text-[18px] md:text-[20px] font-semibold mb-2"
          style={{ letterSpacing: "-0.015em" }}
        >
          {title}
        </h3>
        {message && (
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            {message}
          </p>
        )}
        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-hair text-[13px] px-4 py-2 rounded-[2px] hover:border-text"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={
              "text-[13px] font-medium px-4 py-2 rounded-[2px] " +
              (destructive
                ? "bg-red text-white hover:opacity-90"
                : "bg-ink text-bg hover:opacity-90")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
