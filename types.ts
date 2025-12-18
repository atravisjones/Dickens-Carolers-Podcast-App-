export interface ChoreoItem {
  title: string;
  link: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
}

export interface ChoreoMap {
  front: ChoreoItem | null;
  back: ChoreoItem | null;
  notes: ChoreoItem | null;
}

export interface Episode {
  id: string;
  title: string;
  pubDate: string;
  duration: string;
  durationSeconds: number | null;
  audioUrl: string;
  image: string;
  description: string;
  choreo: ChoreoMap;
  songKey?: string;
  songPage?: string;
  sheetMusicUrl?: string;
}

export type VoicePart = "SOPRANO" | "ALTO" | "TENOR" | "BASS";

export type SortMode = "bookOrder" | "alpha" | "mostPlayed" | "leastPlayed" | "shortest" | "longest" | "confidenceHigh" | "confidenceLow";

export interface ChoreoFilters {
  any: boolean;
  front: boolean;
  back: boolean;
  notes: boolean;
}

export interface SongInfo {
    name: string;
    key: string;
    page: string;
}

// This type is only used internally by the parsing logic
export interface ParsedChoreoItem extends ChoreoItem {
    baseKey: string;
    fileKey: string;
    isFront: boolean;
    isBack: boolean;
    isNotes: boolean;
}
