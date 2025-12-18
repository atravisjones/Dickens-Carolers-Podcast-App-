import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Episode, VoicePart, SortMode, ChoreoFilters, ChoreoItem } from './types';
import { FEEDS, FEED_KEY, COUNT_KEY, DUR_KEY, CONFIDENCE_KEY, FAVORITES_KEY, BOOKMARKS_KEY } from './constants';
import { getMergedEpisodes } from './utils';

import Header from './components/Header';
import Playlist from './components/Playlist';
import Player from './components/Player';
import VoiceModal from './components/modals/VoiceModal';
import NotesModal from './components/modals/NotesModal';
import ConfidenceModal from './components/modals/ConfidenceModal';
import PlaysModal from './components/modals/PlaysModal';
import SheetMusicViewer from './components/SheetMusicViewer';
import { useDebugLog } from './hooks/useDebugLog';
import DebugLog from './components/DebugLog';


const App: React.FC = () => {
    const { log } = useDebugLog();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [podcastTitle, setPodcastTitle] = useState('Dickens Carolers Podcast');
    const [podcastImage, setPodcastImage] = useState('https://picsum.photos/100/100');

    const [currentVoice, setCurrentVoice] = useState<VoicePart | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('bookOrder');
    const [choreoFilters, setChoreoFilters] = useState<ChoreoFilters>({ any: false, front: false, back: false, notes: false });
    const [favoritesFilter, setFavoritesFilter] = useState(false);
    
    const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
    const [songConfidence, setSongConfidence] = useState<Record<string, number>>({});
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [bookmarks, setBookmarks] = useState<Record<string, number[]>>({});
    const [durationCache, setDurationCache] = useState<Record<string, number>>({});

    const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
    const [lastPlayRequest, setLastPlayRequest] = useState(0);
    const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
    const [notesModalData, setNotesModalData] = useState<{ item: ChoreoItem, episodeTitle: string, label: string } | null>(null);
    const [confidenceModalData, setConfidenceModalData] = useState<Episode | null>(null);
    const [playsModalData, setPlaysModalData] = useState<Episode | null>(null);
    const [isSheetMusicOpen, setSheetMusicOpen] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);


    const loadFromStorage = useCallback(() => {
        log('INFO', 'Attempting to load data from localStorage.');
        try {
            const savedVoice = localStorage.getItem(FEED_KEY) as VoicePart | null;
            if (savedVoice && FEEDS[savedVoice]) {
                setCurrentVoice(savedVoice);
            } else {
                log('WARN', 'No saved voice found, opening modal.');
                setVoiceModalOpen(true);
                setIsLoading(false);
            }
            setPlayCounts(JSON.parse(localStorage.getItem(COUNT_KEY) || '{}'));
            setDurationCache(JSON.parse(localStorage.getItem(DUR_KEY) || '{}'));
            setSongConfidence(JSON.parse(localStorage.getItem(CONFIDENCE_KEY) || '{}'));
            setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '{}'));
            setBookmarks(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}'));
            log('INFO', 'Successfully loaded data from localStorage.');
        } catch (e) {
            log('ERROR', 'Failed to load from local storage', { error: e });
            setVoiceModalOpen(true);
            setIsLoading(false);
        }
    }, [log]);
    
    useEffect(() => {
        loadFromStorage();
        log('INFO', 'Debug Logger Initialized.');
    }, [loadFromStorage, log]);

    const loadFeed = useCallback(async (voice: VoicePart) => {
        setIsLoading(true);
        setError(null);
        log('INFO', `Loading feed for: ${voice}`);
        try {
            const { episodes: mergedEpisodes, podcastTitle: newTitle, podcastImage: newImage } = await getMergedEpisodes(FEEDS[voice], log);
            setEpisodes(mergedEpisodes);
            setPodcastTitle(newTitle);
            setPodcastImage(newImage);
            document.title = `${newTitle} — Dickens Carolers Podcast`;
            log('INFO', 'Successfully loaded and merged episodes.', { count: mergedEpisodes.length, title: newTitle });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(message);
            log('ERROR', 'Failed to load feed', { error: err });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        if (currentVoice) {
            loadFeed(currentVoice);
        }
    }, [currentVoice, loadFeed]);
    
    const saveDurationToCache = useCallback((url: string, duration: number) => {
        if (!url || !isFinite(duration)) return;
        setDurationCache(prev => {
            if (prev[url] === duration) return prev;
            log('DEBUG', 'Caching new audio duration', { url, duration });
            const newCache = { ...prev, [url]: duration };
            try {
                localStorage.setItem(DUR_KEY, JSON.stringify(newCache));
            } catch (e) { 
                log('ERROR', 'Failed to save durations', { error: e });
                console.error("Failed to save durations", e); 
            }
            return newCache;
        });
    }, [log]);

    useEffect(() => {
        if (episodes.length === 0) return;

        const probeAndCacheDuration = (episode: Episode) => {
            if (episode.durationSeconds || durationCache[episode.audioUrl]) {
                return;
            }

            const audio = document.createElement('audio');
            audio.preload = 'metadata';

            const onLoadedMetadata = () => {
                if (audio.duration && isFinite(audio.duration)) {
                    saveDurationToCache(episode.audioUrl, audio.duration);
                }
                cleanup();
            };
            const onError = () => cleanup();
            const cleanup = () => {
                audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                audio.removeEventListener('error', onError);
                audio.src = '';
            };

            audio.addEventListener('loadedmetadata', onLoadedMetadata);
            audio.addEventListener('error', onError);
            audio.src = episode.audioUrl;
        };
        
        episodes.forEach(probeAndCacheDuration);

    }, [episodes, durationCache, saveDurationToCache]);

    const handleSaveVoice = (voice: VoicePart) => {
        log('INFO', 'Saving new voice part', voice);
        localStorage.setItem(FEED_KEY, voice);
        setCurrentVoice(voice);
        setVoiceModalOpen(false);
        setEpisodes([]); // Clear old episodes
        setCurrentEpisodeIndex(0);
    };

    const calculateConfidenceFromPlays = useCallback((plays: number) => Math.min(70, Math.floor(Math.sqrt(plays) * 10)), []);

    const handleBumpCount = useCallback((url: string) => {
        setPlayCounts(prev => {
            const newCounts = { ...prev, [url]: (prev[url] || 0) + 1 };
            try {
                localStorage.setItem(COUNT_KEY, JSON.stringify(newCounts));
            } catch (e) {
                log('ERROR', "Failed to save play counts", { error: e });
                console.error("Failed to save play counts", e); 
            }

            const newPlayCount = newCounts[url];
            const autoConfidence = calculateConfidenceFromPlays(newPlayCount);
            
            setSongConfidence(prevConf => {
                const currentConfidence = prevConf[url] || 0;
                if (autoConfidence > currentConfidence) {
                    const newConfidenceState = { ...prevConf, [url]: autoConfidence };
                    try {
                        localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(newConfidenceState));
                    } catch (e) { 
                        log('ERROR', "Failed to save confidence levels", { error: e });
                        console.error("Failed to save confidence levels", e); 
                    }
                    return newConfidenceState;
                }
                return prevConf;
            });
            return newCounts;
        });
    }, [calculateConfidenceFromPlays, log]);
    
    const handleSaveConfidence = useCallback((url: string, confidence: number) => {
        setSongConfidence(prev => {
            const newState = { ...prev, [url]: confidence };
            try {
                localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(newState));
            } catch (e) {
                log('ERROR', "Failed to save confidence levels", { error: e });
                console.error("Failed to save confidence levels", e); 
            }
            return newState;
        });
        setConfidenceModalData(null);
    }, [log]);

    const handleSavePlayCount = useCallback((url: string, count: number) => {
        setPlayCounts(prev => {
            const newCounts = { ...prev, [url]: count };
            try {
                localStorage.setItem(COUNT_KEY, JSON.stringify(newCounts));
            } catch (e) { 
                log('ERROR', "Failed to save play counts", { error: e });
                console.error("Failed to save play counts", e); 
            }

            const autoConfidence = calculateConfidenceFromPlays(count);
            setSongConfidence(prevConf => {
                const currentConfidence = prevConf[url] || 0;
                if (autoConfidence > currentConfidence) {
                    const newConfidenceState = { ...prevConf, [url]: autoConfidence };
                     try {
                        localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(newConfidenceState));
                    } catch (e) {
                        log('ERROR', "Failed to save confidence levels", { error: e });
                        console.error("Failed to save confidence levels", e); 
                    }
                    return newConfidenceState;
                }
                return prevConf;
            });

            return newCounts;
        });
        setPlaysModalData(null);
    }, [calculateConfidenceFromPlays, log]);

    const handleToggleFavorite = useCallback((url: string) => {
        setFavorites(prev => {
            const newFavorites = { ...prev };
            if (newFavorites[url]) {
                delete newFavorites[url];
            } else {
                newFavorites[url] = true;
            }
            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            } catch (e) {
                log('ERROR', "Failed to save favorites", { error: e });
                console.error("Failed to save favorites", e);
            }
            return newFavorites;
        });
    }, [log]);

    const handleAddBookmark = useCallback((url: string, timestamp: number) => {
        setBookmarks(prev => {
            const existing = prev[url] || [];
            if (existing.some(t => Math.abs(t - timestamp) < 0.5)) {
                return prev; 
            }
            const newBookmarksForUrl = [...existing, timestamp].sort((a, b) => a - b);
            const newBookmarks = { ...prev, [url]: newBookmarksForUrl };
            try {
                localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
            } catch (e) {
                log('ERROR', "Failed to save bookmarks", { error: e });
                console.error("Failed to save bookmarks", e);
            }
            return newBookmarks;
        });
    }, [log]);

    const handleRemoveBookmark = useCallback((url: string, timestamp: number) => {
        setBookmarks(prev => {
            const existing = prev[url] || [];
            const newBookmarksForUrl = existing.filter(t => t !== timestamp);
            const newBookmarks = { ...prev };
            if (newBookmarksForUrl.length > 0) {
                newBookmarks[url] = newBookmarksForUrl;
            } else {
                delete newBookmarks[url];
            }
            try {
                localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
            } catch (e) {
                log('ERROR', "Failed to save bookmarks", { error: e });
                console.error("Failed to save bookmarks", e);
            }
            return newBookmarks;
        });
    }, [log]);

    const handleOpenPlaysModal = useCallback((episode: Episode) => {
        setPlaysModalData(episode);
    }, []);

    const filteredEpisodes = useMemo(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const passesChoreo = (ep: Episode) => {
            if (!choreoFilters.any && !choreoFilters.front && !choreoFilters.back && !choreoFilters.notes) return true;
            const hasFront = !!ep.choreo?.front;
            const hasBack = !!ep.choreo?.back;
            const hasNotes = !!ep.choreo?.notes;
            if (choreoFilters.any && !(hasFront || hasBack || hasNotes)) return false;
            if (choreoFilters.front && !hasFront) return false;
            if (choreoFilters.back && !hasBack) return false;
            if (choreoFilters.notes && !hasNotes) return false;
            return true;
        };

        const passesFavorites = (ep: Episode) => {
            if (!favoritesFilter) return true;
            return !!favorites[ep.audioUrl];
        };

        let filtered = episodes
            .filter(ep => (ep.title.toLowerCase().includes(lowerCaseQuery) || ep.description.toLowerCase().includes(lowerCaseQuery)))
            .filter(passesChoreo)
            .filter(passesFavorites);

        const getDuration = (ep: Episode) => ep.durationSeconds ?? durationCache[ep.audioUrl] ?? Infinity;

        switch (sortMode) {
            case 'bookOrder':
                return filtered.sort((a, b) => {
                    const pageA = parseInt(a.songPage || '999', 10);
                    const pageB = parseInt(b.songPage || '999', 10);
                    if (pageA !== pageB) {
                        return pageA - pageB;
                    }
                    return a.title.localeCompare(b.title);
                });
            case 'alpha':
                return filtered.sort((a, b) => a.title.localeCompare(b.title));
            case 'confidenceHigh':
                return filtered.sort((a, b) => (songConfidence[b.audioUrl] || 0) - (songConfidence[a.audioUrl] || 0));
            case 'confidenceLow':
                return filtered.sort((a, b) => (songConfidence[a.audioUrl] || 0) - (songConfidence[b.audioUrl] || 0));
            case 'mostPlayed':
                return filtered.sort((a, b) => (playCounts[b.audioUrl] || 0) - (playCounts[a.audioUrl] || 0));
            case 'leastPlayed':
                return filtered.sort((a, b) => (playCounts[a.audioUrl] || 0) - (playCounts[b.audioUrl] || 0));
            case 'shortest':
                return filtered.sort((a, b) => getDuration(a) - getDuration(b));
            case 'longest':
                return filtered.sort((a, b) => getDuration(b) - getDuration(a));
            default:
                return filtered;
        }
    }, [episodes, searchQuery, sortMode, playCounts, durationCache, choreoFilters, songConfidence, favorites, favoritesFilter]);
    
    useEffect(() => {
        const currentId = episodes[currentEpisodeIndex]?.id;
        if (currentId) {
            const newIndex = filteredEpisodes.findIndex(e => e.id === currentId);
            if (newIndex === -1) {
                const firstEpisode = filteredEpisodes[0];
                if (firstEpisode) {
                    const originalIndex = episodes.findIndex(e => e.id === firstEpisode.id);
                     if (originalIndex !== -1) {
                        setCurrentEpisodeIndex(originalIndex);
                     }
                }
            }
        }
    }, [filteredEpisodes, episodes, currentEpisodeIndex]);

    const currentEpisode = useMemo(() => {
        const current = episodes[currentEpisodeIndex];
        if (current && filteredEpisodes.some(e => e.id === current.id)) {
            return current;
        }
        return filteredEpisodes[0];
    }, [episodes, currentEpisodeIndex, filteredEpisodes]);

    const [prevEpisodeId, setPrevEpisodeId] = useState<string | null>(null);
    useEffect(() => {
        if (currentEpisode && currentEpisode.id !== prevEpisodeId) {
            log('DEBUG', 'Player received new episode', { title: currentEpisode.title, url: currentEpisode.audioUrl });
            setPrevEpisodeId(currentEpisode.id);
        }
    }, [currentEpisode, prevEpisodeId, log]);

    const handleNext = useCallback(() => {
        if (!currentEpisode || filteredEpisodes.length === 0) return;
        const currentIndexInFiltered = filteredEpisodes.findIndex(e => e.id === currentEpisode.id);
        const nextIndexInFiltered = (currentIndexInFiltered + 1) % filteredEpisodes.length;
        const nextEpisode = filteredEpisodes[nextIndexInFiltered];
        const originalIndex = episodes.findIndex(e => e.id === nextEpisode.id);
        if (originalIndex !== -1) setCurrentEpisodeIndex(originalIndex);
    }, [currentEpisode, filteredEpisodes, episodes]);

    const handlePrev = useCallback(() => {
        if (!currentEpisode || filteredEpisodes.length === 0) return;
        const currentIndexInFiltered = filteredEpisodes.findIndex(e => e.id === currentEpisode.id);
        const prevIndexInFiltered = (currentIndexInFiltered - 1 + filteredEpisodes.length) % filteredEpisodes.length;
        const prevEpisode = filteredEpisodes[prevIndexInFiltered];
        const originalIndex = episodes.findIndex(e => e.id === prevEpisode.id);
        if (originalIndex !== -1) setCurrentEpisodeIndex(originalIndex);
    }, [currentEpisode, filteredEpisodes, episodes]);

    const handleOpenNotes = useCallback((item: ChoreoItem, episodeTitle: string, label: string) => {
      setNotesModalData({ item, episodeTitle, label });
    }, []);

    const handleOpenConfidenceModal = useCallback((episode: Episode) => {
        setConfidenceModalData(episode);
    }, []);

    return (
        <div className="h-screen bg-brand-bg flex flex-col overflow-hidden">
            {!isSheetMusicOpen && (
                <Header 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortMode={sortMode}
                    onSortChange={setSortMode}
                    currentVoice={currentVoice}
                    onOpenVoiceModal={() => setVoiceModalOpen(true)}
                    choreoFilters={choreoFilters}
                    onChoreoFiltersChange={setChoreoFilters}
                    favoritesFilter={favoritesFilter}
                    onFavoritesFilterChange={setFavoritesFilter}
                />
            )}

            <main className={`flex-grow ${isSheetMusicOpen ? 'overflow-hidden' : 'p-3 z-10 overflow-y-auto'}`}>
                {isSheetMusicOpen && currentEpisode?.sheetMusicUrl ? (
                    <SheetMusicViewer 
                        isOpen={isSheetMusicOpen}
                        onClose={() => setSheetMusicOpen(false)}
                        sheetMusicUrl={currentEpisode.sheetMusicUrl}
                        audioRef={audioRef}
                        episodeTitle={currentEpisode.title}
                    />
                ) : (
                    <Playlist
                        episodes={filteredEpisodes}
                        playCounts={playCounts}
                        songConfidence={songConfidence}
                        favorites={favorites}
                        isLoading={isLoading}
                        error={error}
                        currentEpisodeId={currentEpisode?.id}
                        onPlayEpisode={(id) => {
                            const ep = episodes.find(e => e.id === id);
                            log('INFO', 'User requested to play episode', { title: ep?.title, id: ep?.id });
                            const originalIndex = episodes.findIndex(e => e.id === id);
                            if (originalIndex !== -1) {
                                setCurrentEpisodeIndex(originalIndex);
                                setLastPlayRequest(Date.now());
                            }
                        }}
                        onOpenNotes={handleOpenNotes}
                        onOpenConfidenceModal={handleOpenConfidenceModal}
                        onOpenPlaysModal={handleOpenPlaysModal}
                        onToggleFavorite={handleToggleFavorite}
                        durationCache={durationCache}
                    />
                )}
            </main>
            
            <footer className="sticky bottom-0 z-50 flex-shrink-0">
                {currentEpisode && (
                  <Player
                      episode={currentEpisode}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      onEnded={handleBumpCount}
                      onOpenNotes={handleOpenNotes}
                      lastPlayRequest={lastPlayRequest}
                      bookmarks={bookmarks}
                      onAddBookmark={handleAddBookmark}
                      onRemoveBookmark={handleRemoveBookmark}
                      audioRef={audioRef}
                      onToggleSheetMusic={() => setSheetMusicOpen(prev => !prev)}
                      hasSheetMusic={!!currentEpisode.sheetMusicUrl}
                  />
                )}
            </footer>


            <VoiceModal 
                isOpen={isVoiceModalOpen}
                onClose={() => { if (currentVoice) setVoiceModalOpen(false); }}
                onSave={handleSaveVoice}
                currentVoice={currentVoice}
            />
            
            {notesModalData && (
                <NotesModal 
                    isOpen={!!notesModalData}
                    onClose={() => setNotesModalData(null)}
                    item={notesModalData.item}
                    episodeTitle={notesModalData.episodeTitle}
                    label={notesModalData.label}
                />
            )}

            {playsModalData && (
                <PlaysModal
                    isOpen={!!playsModalData}
                    onClose={() => setPlaysModalData(null)}
                    episode={playsModalData}
                    initialPlays={playCounts[playsModalData.audioUrl] || 0}
                    onSave={(count) => handleSavePlayCount(playsModalData.audioUrl, count)}
                />
            )}

            {confidenceModalData && (
                <ConfidenceModal
                    isOpen={!!confidenceModalData}
                    onClose={() => setConfidenceModalData(null)}
                    episode={confidenceModalData}
                    initialConfidence={songConfidence[confidenceModalData.audioUrl] || 0}
                    onSave={(confidence) => handleSaveConfidence(confidenceModalData.audioUrl, confidence)}
                />
            )}
            
            <DebugLog />
        </div>
    );
};

export default App;
