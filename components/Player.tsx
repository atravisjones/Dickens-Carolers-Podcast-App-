import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Episode, ChoreoItem } from '../types';
import { PLAYBACK_SPEEDS } from '../constants';
import { formatTime } from '../utils';
import { useDebugLog } from '../hooks/useDebugLog';

interface PlayerProps {
    episode: Episode;
    onNext: () => void;
    onPrev: () => void;
    onEnded: (url: string) => void;
    onOpenNotes: (item: ChoreoItem, episodeTitle: string, label: string) => void;
    lastPlayRequest?: number;
    bookmarks: Record<string, number[]>;
    onAddBookmark: (url: string, timestamp: number) => void;
    onRemoveBookmark: (url: string, timestamp: number) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    onToggleSheetMusic: () => void;
    hasSheetMusic: boolean;
}

const Player: React.FC<PlayerProps> = ({ 
    episode, onNext, onPrev, onEnded, onOpenNotes, lastPlayRequest,
    bookmarks, onAddBookmark, onRemoveBookmark,
    audioRef, onToggleSheetMusic, hasSheetMusic,
}) => {
    const { log } = useDebugLog();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speedIndex, setSpeedIndex] = useState(0);
    const [repeatMode, setRepeatMode] = useState<'one' | 'all' | 'none'>('one');
    const [activeLoop, setActiveLoop] = useState<number | null>(null);
    
    const episodeBookmarks = useMemo(() => (bookmarks[episode.audioUrl] || []).sort((a,b)=> a-b), [bookmarks, episode.audioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.playbackRate = PLAYBACK_SPEEDS[speedIndex];
            if (audio.src !== episode.audioUrl) {
                audio.src = episode.audioUrl;
                audio.load();
                if (lastPlayRequest && lastPlayRequest > 0) {
                  log('DEBUG', 'Autoplaying new episode due to lastPlayRequest');
                  audio.play().catch(e => log('WARN', 'Autoplay failed', { error: e }));
                }
            }
            setCurrentTime(0);
            setActiveLoop(null);
        }
    }, [episode, lastPlayRequest, audioRef, speedIndex, log]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);

            if (activeLoop !== null) {
                const loopStartIndex = episodeBookmarks.indexOf(activeLoop);
                if (loopStartIndex === -1) { 
                    setActiveLoop(null);
                    return;
                }
                const loopEnd = (loopStartIndex < episodeBookmarks.length - 1)
                    ? episodeBookmarks[loopStartIndex + 1]
                    : audio.duration;
                
                if (isFinite(loopEnd) && audio.currentTime >= loopEnd - 0.1) {
                    audio.currentTime = activeLoop;
                }
            }
        };
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            log('DEBUG', 'Audio metadata loaded', { duration: audio.duration });
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            log('DEBUG', 'Episode ended', { title: episode.title });
            onEnded(episode.audioUrl);
            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else if (repeatMode === 'all') {
                onNext();
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [episode.audioUrl, onEnded, onNext, repeatMode, activeLoop, episodeBookmarks, audioRef, log, episode.title]);

    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            if (audio.paused) {
                log('DEBUG', 'User action: play');
                audio.play().catch(e => log('ERROR', 'Play action failed', { error: e }));
            } else {
                log('DEBUG', 'User action: pause');
                audio.pause();
            }
        }
    }, [audioRef, log]);
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (audio) {
            const newTime = (Number(e.target.value) / 100) * duration;
            audio.currentTime = newTime;
            log('DEBUG', 'User action: seek', { time: newTime });
        }
    };

    const handleSeekTo = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            log('DEBUG', 'User action: seek to bookmark', { time });
        }
    };
    
    const cycleSpeed = () => {
        setSpeedIndex(prev => {
            const nextIndex = (prev + 1) % PLAYBACK_SPEEDS.length;
            if(audioRef.current) audioRef.current.playbackRate = PLAYBACK_SPEEDS[nextIndex];
            log('DEBUG', 'User action: cycle speed', { newSpeed: PLAYBACK_SPEEDS[nextIndex] });
            return nextIndex;
        });
    };

    const cycleRepeat = () => {
        setRepeatMode(prev => {
            const nextMode = prev === 'one' ? 'all' : prev === 'all' ? 'none' : 'one';
            log('DEBUG', 'User action: cycle repeat mode', { newMode: nextMode });
            return nextMode;
        });
    };

    const handleRewind = (seconds: number) => {
        if (audioRef.current) {
            const newTime = Math.max(0, audioRef.current.currentTime - seconds);
            audioRef.current.currentTime = newTime;
            log('DEBUG', `User action: rewind ${seconds}s`, { newTime });
        }
    };
    
    const handleAddCurrentTimeBookmark = () => {
        if (audioRef.current) {
            const timestamp = audioRef.current.currentTime;
            log('DEBUG', 'User action: add bookmark', { timestamp });
            onAddBookmark(episode.audioUrl, timestamp);
        }
    };

    const handleToggleLoop = (timestamp: number) => {
        const newLoop = activeLoop === timestamp ? null : timestamp;
        setActiveLoop(newLoop);
        log('DEBUG', 'User action: toggle loop', { from: newLoop });
    };

    return (
        <div className="p-2 pb-14 sm:p-3 sm:pb-14 border-t border-brand-border bg-brand-bg/90 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 md:grid-rows-1 gap-2 items-center">
            <audio ref={audioRef} hidden />

            <div className="flex items-center gap-3 min-w-0">
                <img src={episode.image} alt={episode.title} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-brand-border object-cover flex-shrink-0" />
                <div className="min-w-0">
                    <div className="font-bold truncate">{episode.title}</div>
                    <div className="text-sm text-brand-muted truncate">{episode.description.replace(/<[^>]+>/g, '')}</div>
                </div>
            </div>

            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                    <button onClick={onPrev} className="p-2 rounded-lg hover:bg-black/5" title="Previous">⏮</button>
                    <button onClick={togglePlayPause} className="w-14 h-12 text-white font-bold rounded-lg bg-brand-accent hover:brightness-90 transition-transform" title="Play/Pause">
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={onNext} className="p-2 rounded-lg hover:bg-black/5" title="Next">⏭</button>
                </div>
                 <div className="w-full max-w-sm flex flex-wrap items-center justify-center gap-2">
                    {episodeBookmarks.map(ts => (
                        <div key={ts} className="flex items-center bg-amber-50 border border-brand-accent-red rounded-full shadow-lg overflow-hidden">
                            <button
                                onClick={() => handleSeekTo(ts)}
                                className="pl-3 pr-2 py-1 text-xs font-bold text-brand-accent hover:bg-red-100 transition-colors"
                                title={`Jump to ${formatTime(ts)}`}
                            >
                                {formatTime(ts)}
                            </button>
                            <div className="w-px h-4 bg-brand-accent-red/30"></div>
                            <button
                                onClick={() => handleToggleLoop(ts)}
                                className={`px-2 py-1 text-sm transition-colors ${activeLoop === ts ? 'bg-brand-accent text-white animate-spin' : 'text-blue-500 hover:bg-blue-100'}`}
                                title="Loop from this bookmark"
                            >
                                ❄️
                            </button>
                            <div className="w-px h-4 bg-brand-accent-red/30"></div>
                            <button
                                onClick={() => onRemoveBookmark(episode.audioUrl, ts)}
                                className="px-2.5 py-1 text-base font-bold text-brand-accent-red hover:bg-red-100 transition-colors"
                                title="Remove bookmark"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <div className="w-full max-w-sm flex items-center gap-2 text-xs text-brand-muted mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <input type="range" min="0" max="100" value={(currentTime / duration) * 100 || 0} onChange={handleSeek} className="w-full h-1.5 bg-brand-border/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent"/>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
                 <button onClick={() => handleRewind(10)} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm" title="Rewind 10 seconds">⟲ 10s</button>
                 <button onClick={() => handleRewind(30)} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm" title="Rewind 30 seconds">⟲ 30s</button>
                 <button onClick={cycleSpeed} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm" title="Playback speed">{PLAYBACK_SPEEDS[speedIndex]}x</button>
                 <button onClick={cycleRepeat} className={`px-3 py-1.5 text-sm font-bold border rounded-full hover:shadow-sm ${repeatMode !== 'none' ? 'bg-brand-accent-red text-white border-brand-accent-red' : 'bg-white border-brand-border'}`} title="Repeat mode">
                   {repeatMode === 'one' ? '1' : repeatMode === 'all' ? 'All' : 'Off'}
                 </button>
                 {hasSheetMusic && <button onClick={onToggleSheetMusic} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Sheet Music</button>}
                 <button onClick={handleAddCurrentTimeBookmark} className="px-4 py-1.5 text-sm font-bold bg-green-700 text-amber-50 border border-green-900 rounded-full hover:bg-green-600 transition-colors shadow-lg" title="Add bookmark at current time">🎄 Add</button>
                {episode.choreo.front && <button onClick={() => onOpenNotes(episode.choreo.front!, episode.title, 'Front')} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm hidden md:inline-block">Front</button>}
                {episode.choreo.back && <button onClick={() => onOpenNotes(episode.choreo.back!, episode.title, 'Back')} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm hidden md:inline-block">Back</button>}
                {episode.choreo.notes && <button onClick={() => onOpenNotes(episode.choreo.notes!, episode.title, 'Notes')} className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-sm hidden md:inline-block">Notes</button>}
            </div>
        </div>
    );
};

export default Player;