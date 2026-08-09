import shortsJson from "../data/shorts.json";
import streamsJson from "../data/streams.json";
import syncLogJson from "../data/sync-log.json";
import type { Short, Stream } from "./types";

export type BundledStreamsFile = {
  syncedAt: string;
  channelId: string;
  channelTitle: string;
  handle: string;
  streams: Stream[];
};

export type BundledShortsFile = {
  syncedAt: string;
  channelId: string;
  channelTitle: string;
  handle: string;
  shorts: Short[];
};

const bundledStreams = streamsJson as unknown as BundledStreamsFile;
const bundledShorts = shortsJson as unknown as BundledShortsFile;

export function getBundledStreamsFile(): BundledStreamsFile {
  return structuredClone(bundledStreams);
}

export function getBundledShortsFile(): BundledShortsFile {
  return structuredClone(bundledShorts);
}

export function getBundledSyncLogFile(): typeof syncLogJson {
  return structuredClone(syncLogJson);
}
