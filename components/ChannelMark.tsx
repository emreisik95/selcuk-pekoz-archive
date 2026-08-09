export function ChannelMark() {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-text/20 bg-text text-bg"
        aria-hidden="true"
      >
        <span className="absolute inset-x-1.5 top-[9px] h-px bg-bg/50" />
        <span className="absolute inset-x-2 bottom-[9px] h-px bg-bg/50" />
        <span className="font-mono text-[9px] font-semibold tracking-[-0.08em]">SP</span>
        <span className="absolute right-[3px] top-[3px] size-1.5 rounded-full bg-on-air" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="font-display block truncate text-[16px] font-bold tracking-[-0.04em] md:text-[18px]">
          Selçuk Peköz
        </span>
        <span className="mt-1 block font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-muted">
          Channel HQ
        </span>
      </span>
    </span>
  );
}
