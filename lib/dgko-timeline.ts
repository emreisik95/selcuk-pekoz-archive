export const FILM_DURATION = 75;
export const REDUCED_FILM_DURATION = 24;
export const MAX_TRAVEL = 520;

export type ChapterId = "signal" | "year" | "nintendo" | "orbit" | "finale";

export type Chapter = {
  id: ChapterId;
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  note: string;
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: "signal",
    start: 0,
    end: 7,
    eyebrow: "23.07.2025 — 23.07.2026",
    title: "SON 365 GÜN",
    note: "Selçuk'un bir yıllık özeti başlıyor",
  },
  {
    id: "year",
    start: 7,
    end: 27,
    eyebrow: "YILLIK ÖZET · YAYINLAR",
    title: "YAYINLAR",
    note: "Bir yılın canlı yayın kaydı",
  },
  {
    id: "nintendo",
    start: 27,
    end: 45,
    eyebrow: "YILLIK ÖZET · SHORTS",
    title: "SHORTS",
    note: "Bir yılın kısa videoları",
  },
  {
    id: "orbit",
    start: 45,
    end: 60,
    eyebrow: "YILLIK ÖZET · TOPLAM",
    title: "İZLENMELER",
    note: "Yayınlar ve Shorts birlikte",
  },
  {
    id: "finale",
    start: 60,
    end: FILM_DURATION,
    eyebrow: "23 TEMMUZ 2026",
    title: "İyi Ki Doğdun\nSelçuk Peköz",
    note: "Yeni yaşın; yeni oyunlar, bol kahkaha ve efsane kayıtlarla dolsun.",
  },
] as const;

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function easeInOutCubic(value: number) {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getRenderProfile(viewportWidth: number, devicePixelRatio: number) {
  const compact = viewportWidth < 720;

  return {
    compact,
    pixelRatio: Math.min(Math.max(2.25, devicePixelRatio), compact ? 2.5 : 2.25),
    frameCount: compact ? 26 : 52,
    confettiCount: compact ? 420 : 680,
  };
}

export function getChapter(seconds: number): Chapter {
  const time = Math.min(FILM_DURATION, Math.max(0, seconds));
  return (
    CHAPTERS.find((chapter) => time >= chapter.start && time < chapter.end) ??
    CHAPTERS[CHAPTERS.length - 1]
  );
}

export function getPanelActivity(activeIndex: number, panelIndex: number) {
  const distance = Math.abs(activeIndex - panelIndex);
  return {
    visible: distance <= 2,
    active: distance < 0.75,
  };
}

export function getPanelProjection(
  panelIndex: number,
  journeyPosition: number,
  loopLength = 0,
) {
  const rawDelta = panelIndex - journeyPosition;
  const delta = loopLength > 0
    ? ((((rawDelta + 1.65) % loopLength) + loopLength) % loopLength) - 1.65
    : rawDelta;
  const side = panelIndex % 2 === 0 ? -1 : 1;
  const arrival = clamp01(1 - Math.max(0, delta) / 2.4);
  const passed = clamp01(Math.max(0, -delta) / 1.5);
  const lateral = 3 + arrival * 22 + passed * 34;
  const visible = delta >= -1.65 && delta <= 3.4;

  return {
    visible,
    leftPercent: 50 + side * lateral,
    topPercent: 50 + Math.sin(panelIndex * 1.71) * 5 * arrival - passed * 2,
    depth: -delta * 300,
    scale: 0.26 + arrival * 0.8 + passed * 0.18,
    rotateY: side * -31 * arrival,
    opacity: visible ? 1 : 0,
    blur: 0,
  };
}

export function getTunnelPanelDepth(
  panelIndex: number,
  travel: number,
  panelCount: number,
) {
  const spacing = 24;
  const nearZ = 12;
  const loopDepth = Math.max(spacing * 2, (panelCount + 1) * spacing);
  const raw = -30 - panelIndex * spacing + travel;
  return ((((raw - nearZ) % loopDepth) + loopDepth) % loopDepth) - loopDepth + nearZ;
}

export function getFilmFrame(elapsedSeconds: number, reducedMotion: boolean) {
  const duration = reducedMotion ? REDUCED_FILM_DURATION : FILM_DURATION;
  const progress = clamp01(elapsedSeconds / duration);
  const virtualSeconds = progress * FILM_DURATION;
  const chapter = getChapter(virtualSeconds);
  const chapterProgress = clamp01(
    (virtualSeconds - chapter.start) / Math.max(0.001, chapter.end - chapter.start),
  );

  return {
    progress,
    virtualSeconds,
    chapter,
    chapterProgress,
    travel: easeInOutCubic(progress) * MAX_TRAVEL,
    finished: progress >= 1,
  };
}
