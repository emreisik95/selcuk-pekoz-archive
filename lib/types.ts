export type StreamKind = "upcoming" | "live" | "completed";

export type Stream = {
  id: string;
  kind: StreamKind;
  title: string;
  scheduledAt: string;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  durationSec?: number | null;
  viewCount?: number | null;
  concurrentViewers?: number | null;
  palette: [string, string, string];
  episodeNo: number;
  thumbnailUrl?: string;
  description?: string;
};

export type Countdown = {
  d: number;
  h: number;
  m: number;
  s: number;
  past: boolean;
};

export type Short = {
  id: string;
  title: string;
  publishedAt: string;
  durationSec: number | null;
  viewCount: number | null;
  thumbnailUrl: string;
  description?: string;
};

export type ManualEvent = {
  id: string;
  title: string;
  scheduledAt: string;
  description?: string;
  durationMin?: number;
  createdAt: string;
  // Filled by sync when a YouTube video is found that matches this manual entry.
  youtubeId?: string;
  matchedAt?: string;
};
