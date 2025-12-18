import { Episode, ChoreoMap, ParsedChoreoItem, ChoreoItem, SongInfo } from './types';
import { SONG_LIST_RAW, CHOREO_FEED } from './constants';
import { LogEntry } from './hooks/useDebugLog';

type LogFunction = (level: LogEntry['level'], message: string, data?: any) => void;

// =================================================================================
// TIME FORMATTERS
// =================================================================================

export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export function parseDurationString(str: string): number | null {
  if (!str) return null;
  const parts = str.trim().split(":").map((x) => parseInt(x, 10));
  if (parts.some((x) => Number.isNaN(x))) return null;
  let s = 0;
  if (parts.length === 3) s = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) s = parts[0] * 60 + parts[1];
  else if (parts.length === 1) s = parts[0];
  return isFinite(s) ? s : null;
}

// =================================================================================
// DATA FETCHING & PARSING
// =================================================================================

export function httpsify(url: string = ""): string {
  return url.replace(/^http:\/\//i, "https://");
}

async function fetchWithFallback(url: string, log: LogFunction): Promise<string> {
  log('INFO', 'Fetching URL with fallback proxies', { url });
  const corsProxies = [
    { name: "Proxy: https://api.allorigins.win/raw", url: "https://api.allorigins.win/raw?url=" },
    { name: "Proxy: https://corsproxy.io/", url: "https://corsproxy.io/?" },
  ];
  const attempts = [
    { name: 'Direct', attempt: () => fetch(url, { mode: 'cors' }) },
    ...corsProxies.map(proxy => ({ name: proxy.name, attempt: () => fetch(proxy.url + encodeURIComponent(url)) }))
  ];
  
  for (const { name, attempt } of attempts) {
    log('DEBUG', `Attempting fetch via ${name}`);
    try {
      const res = await attempt();
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
            log('DEBUG', `Fetch successful via ${name}`);
            return text;
        }
      }
    } catch (error) {
       log('WARN', `Fetch attempt threw an error via ${name}`, { error: error instanceof Error ? error.message : error });
    }
  }

  log('ERROR', 'Unable to load RSS feed after all attempts', { url });
  throw new Error(`Unable to load RSS feed from ${url}.`);
}

function parseAudioRSS(xmlText: string): { episodes: Episode[], podcastTitle: string, podcastImage: string } {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const podcastTitle = doc.querySelector("channel > title")?.textContent?.trim() || "Dickens Carolers Podcast";
    const channelImg = doc.querySelector("channel > image > url")?.textContent || doc.querySelector("channel > itunes\\:image")?.getAttribute("href") || "";
    const podcastImage = httpsify(channelImg);

    const episodes: Episode[] = Array.from(doc.querySelectorAll("item")).map((item, i) => {
        const title = (item.querySelector("title")?.textContent?.trim() || `Episode ${i + 1}`).replace(/^\d+[ab]?\s*/i, '');
        const audioUrl = httpsify(item.querySelector("enclosure")?.getAttribute("url") || "");
        const durationStr = item.querySelector("itunes\\:duration")?.textContent || "";
        const durationSeconds = parseDurationString(durationStr);
        return {
            id: audioUrl || `${title}-${i}`,
            title,
            pubDate: item.querySelector("pubDate")?.textContent || "",
            duration: durationSeconds ? formatTime(durationSeconds) : "...",
            durationSeconds,
            audioUrl,
            image: httpsify(item.querySelector("itunes\\:image")?.getAttribute("href") || channelImg),
            description: item.querySelector("description")?.textContent || "",
            choreo: { front: null, back: null, notes: null },
        };
    }).filter(it => it.audioUrl);
    return { episodes, podcastTitle, podcastImage };
}

function parseChoreoRSS(xmlText: string): Map<string, ChoreoMap> {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const items: ParsedChoreoItem[] = Array.from(doc.querySelectorAll("item")).map((item) => {
        const title = item.querySelector("title")?.textContent?.trim() || "";
        const enclosure = item.querySelector("enclosure");
        const mediaUrl = httpsify(enclosure?.getAttribute("url") || "");
        const mediaType = (enclosure?.getAttribute("type") || "").toLowerCase();
        
        const fieldText = `${title} ${item.querySelector("description")?.textContent || ""}`;
        const fileName = (mediaUrl.split('/').pop() || '').toLowerCase();

        const isFront = /\bfront\b/i.test(fieldText) || /\bfront\b/i.test(fileName);
        const isBack = /\bback\b/i.test(fieldText) || /\bback\b/i.test(fileName);
        const isNotes = /\bnotes?\b/i.test(fieldText) || /\bnotes?\b/i.test(fileName) || mediaType === "application/pdf";
        
        return {
            title,
            baseKey: baseKeyFromTitle(title),
            fileKey: baseKeyFromFilename(mediaUrl),
            link: item.querySelector("link")?.textContent?.trim() || "",
            description: item.querySelector("description")?.textContent || "",
            mediaUrl,
            mediaType,
            isFront, isBack, isNotes
        };
    });

    const map = new Map<string, ChoreoMap>();
    const ensureGroup = (key: string): ChoreoMap => {
        if (!key) return { front: null, back: null, notes: null };
        if (!map.has(key)) map.set(key, { front: null, back: null, notes: null });
        return map.get(key)!;
    };

    for (const it of items) {
        const keys = [it.baseKey, it.fileKey].filter(Boolean);
        for (const k of keys) {
            const group = ensureGroup(k);
            const choreoItem: ChoreoItem = { title: it.title, link: it.link, description: it.description, mediaUrl: it.mediaUrl, mediaType: it.mediaType };
            if (it.isFront && !group.front) group.front = choreoItem;
            if (it.isBack && !group.back) group.back = choreoItem;
            if (it.isNotes && !group.notes) group.notes = choreoItem;
            if (!group.front && !group.back && it.mediaType.startsWith("video/")) group.front = choreoItem;
        }
    }
    return map;
}

// =================================================================================
// TITLE MATCHING & DATA MERGING
// =================================================================================

function normalizeTitle(t: string): string {
  return (t || "").toLowerCase().replace(/\(.*?\)|\[.*?\]|feat\..*$/g, " ").replace(/[^a-z0-9']+/g, " ").trim();
}

function baseKeyFromTitle(t: string): string {
  let k = normalizeTitle(t);
  k = k.replace(/\b(video|podcast|choreo|notes?|front|back|from)\b/g, " ");
  k = k.replace(/^\d{1,3}\b/, " ");
  return k.replace(/[^a-z0-9]+/g, " ").trim();
}

function baseKeyFromFilename(u: string): string {
  const name = (u.split('/').pop() || "").replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").toLowerCase();
  return baseKeyFromTitle(name.replace(/\b(front|back|video|notes?)\b/g, " "));
}

const baseKeyFromTitleForMatching = (t: string): string => {
    return (t || "").toLowerCase()
        .replace(/^\d+\s*/, '')
        .replace(/\(.*?\)|\/.*$/g, " ")
        .replace(/’/g, "'")
        .replace(/[^a-z0-9']+/g, " ")
        .trim();
};

const STOPWORDS = new Set(["video", "podcast", "choreo", "notes", "front", "back", "from", "the", "a", "is", "to"]);
function tokenSet(t: string): Set<string> {
    const base = baseKeyFromTitle(t);
    const extra = t && /[_-]/.test(t) ? baseKeyFromFilename(t) : "";
    const all = (base + " " + extra).trim();
    return new Set(all.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)));
}

export function similarity(a: string, b: string): number {
    const A = tokenSet(a);
    const B = tokenSet(b);
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    return inter / (A.size + B.size - inter);
}

// Create derived data maps from constants
export const SONG_DATA = new Map<string, { key: string; page: string }>();
SONG_LIST_RAW.forEach(song => {
    SONG_DATA.set(baseKeyFromTitleForMatching(song.name), { key: song.key, page: song.page });
});

export const SHEET_MUSIC_DATA: Map<string, string> = new Map([
    [baseKeyFromTitleForMatching("An Old-Fashioned Christmas"), "https://32mw84.csb.app/scores/old-fashioned-christmas/old-fashioned-christmas.mxl"],
]);

export async function getMergedEpisodes(audioFeedUrl: string, log: LogFunction): Promise<{ episodes: Episode[], podcastTitle: string, podcastImage: string }> {
    log('DEBUG', 'Fetching audio and choreo feeds in parallel');
    const [audioXml, choreoXml] = await Promise.all([
        fetchWithFallback(audioFeedUrl, log),
        fetchWithFallback(CHOREO_FEED, log),
    ]);
    
    log('DEBUG', 'Parsing audio feed');
    const { episodes: audioEpisodes, podcastTitle, podcastImage } = parseAudioRSS(audioXml);
    log('DEBUG', 'Parsing choreo feed');
    const choreoMap = parseChoreoRSS(choreoXml);
    const choreoArr = [...choreoMap.entries()];
    
    log('DEBUG', 'Finished parsing. Starting data merge.');
    for (const ep of audioEpisodes) {
        const aKey = baseKeyFromTitle(ep.title);
        const aUrlKey = baseKeyFromFilename(ep.audioUrl);
        let bestChoreo: ChoreoMap | null = null;
        let bestChoreoScore = -1;

        for (const [key, group] of choreoArr) {
            const s1 = similarity(aKey, key);
            const s2 = similarity(ep.title, key);
            const s3 = aUrlKey ? similarity(aUrlKey, key) : 0;
            const score = Math.max(s1, s2, s3);
            if (score > bestChoreoScore) {
                bestChoreoScore = score;
                bestChoreo = group;
            }
        }
        if (bestChoreo && bestChoreoScore >= 0.5) {
            ep.choreo = bestChoreo;
        }

        const epKey = baseKeyFromTitleForMatching(ep.title);
        const songInfo = SONG_DATA.get(epKey);
        if (songInfo) {
            ep.songKey = songInfo.key;
            ep.songPage = songInfo.page;
        } else {
            let bestSongScore = 0.4;
            let bestSongMatch = null;
            for (const [songKey, songInfo] of SONG_DATA.entries()) {
                const score = similarity(epKey, songKey);
                if (score > bestSongScore) {
                    bestSongScore = score;
                    bestSongMatch = songInfo;
                }
            }
            if (bestSongMatch) {
                ep.songKey = bestSongMatch.key;
                ep.songPage = bestSongMatch.page;
            }
        }
        
        const epSheetKey = baseKeyFromTitleForMatching(ep.title);
        const sheetMusicUrl = SHEET_MUSIC_DATA.get(epSheetKey);
        if (sheetMusicUrl) {
            ep.sheetMusicUrl = sheetMusicUrl;
        }
    }
    log('DEBUG', 'Finished merging data.');

    return { episodes: audioEpisodes, podcastTitle, podcastImage };
}

export function getMissingSongs(episodes: Episode[]): SongInfo[] {
    const podcastSongBaseKeys = episodes.map(ep => baseKeyFromTitleForMatching(ep.title));
    return SONG_LIST_RAW.filter(songInBook => {
        const songInBookKey = baseKeyFromTitleForMatching(songInBook.name);
        const hasMatch = podcastSongBaseKeys.some(podcastKey => similarity(songInBookKey, podcastKey) > 0.7);
        return !hasMatch;
    }).sort((a,b) => a.name.localeCompare(b.name));
}