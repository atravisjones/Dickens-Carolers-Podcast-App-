import React, { useMemo } from 'react';
import { Episode, ChoreoItem } from '../types';
import { LOADING_PUNS } from '../constants';
import { formatTime, getMissingSongs } from '../utils';
import LoadingIndicator from './LoadingIndicator';
import { useDebugLog } from '../hooks/useDebugLog';

interface PlaylistProps {
    episodes: Episode[];
    playCounts: Record<string, number>;
    songConfidence: Record<string, number>;
    favorites: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
    currentEpisodeId?: string;
    onPlayEpisode: (id: string) => void;
    onOpenNotes: (item: ChoreoItem, episodeTitle: string, label: string) => void;
    onOpenConfidenceModal: (episode: Episode) => void;
    onOpenPlaysModal: (episode: Episode) => void;
    onToggleFavorite: (url: string) => void;
    durationCache: Record<string, number>;
}

// Define the grid columns once to ensure perfect alignment
// #, Favorite, Plays, Conf, Title, Choreo, Key, Page, Length
const GET_GRID_CLASS = (isBookLayout: boolean) => 
    isBookLayout 
        ? "grid-cols-[30px_40px_50px_70px_1fr_140px_45px_45px_60px]"
        : "grid-cols-[30px_40px_50px_70px_1fr_140px_60px]";

const PlaylistHeader: React.FC<{ isBookLayout?: boolean }> = ({ isBookLayout = true }) => {
    const gridClass = GET_GRID_CLASS(isBookLayout);
    
    return (
        <div className={`sticky top-0 z-20 hidden sm:grid ${gridClass} gap-2 px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-brand-muted border-b border-brand-border bg-brand-bg/95 backdrop-blur-md items-center`}>
            <div className="text-center">#</div>
            <div className="text-center text-brand-accent-red">♥</div>
            <div className="text-center">Plays</div>
            <div className="text-center">Conf.</div>
            <div>Title</div>
            <div className="text-center">Choreo</div>
            {isBookLayout && <div className="text-center">Key</div>}
            {isBookLayout && <div className="text-center">Page</div>}
            <div className="text-right pr-2">Len.</div>
        </div>
    );
};

const EpisodeRow: React.FC<{
    index: number;
    episode: Episode;
    playCount: number;
    confidence: number;
    isFavorite: boolean;
    isCurrent: boolean;
    isBookLayout?: boolean;
    onPlayEpisode: (id: string) => void;
    onOpenNotes: (item: ChoreoItem, episodeTitle: string, label: string) => void;
    onOpenConfidenceModal: (episode: Episode) => void;
    onOpenPlaysModal: (episode: Episode) => void;
    onToggleFavorite: (url: string) => void;
    durationCache: Record<string, number>;
}> = React.memo(({ index, episode, playCount, confidence, isFavorite, isCurrent, isBookLayout = true, onPlayEpisode, onOpenNotes, onOpenConfidenceModal, onOpenPlaysModal, onToggleFavorite, durationCache }) => {
    const { log } = useDebugLog();
    const durationSeconds = episode.durationSeconds ?? durationCache[episode.audioUrl];
    const durationText = (durationSeconds && isFinite(durationSeconds)) ? formatTime(durationSeconds) : '...';

    const gridClass = GET_GRID_CLASS(isBookLayout);

    return (
        <li className={`group border-b border-brand-border/40 transition-colors ${isCurrent ? 'bg-brand-accent/10' : 'hover:bg-black/[0.02]'}`}>
            <div className={`w-full p-3 sm:px-4 flex flex-col sm:grid ${gridClass} sm:gap-2 sm:items-center text-sm`}>
                
                {/* 1. Index (#) */}
                <div className="hidden sm:flex justify-center items-center text-xs text-brand-muted font-mono">
                    {index + 1}
                </div>

                {/* 2. Favorite */}
                <div className="hidden sm:flex justify-center items-center">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(episode.audioUrl); }}
                        className={`text-xl p-1 rounded-full hover:bg-red-500/10 transition-colors ${isFavorite ? 'text-brand-accent-red' : 'text-brand-border'}`}
                        title={isFavorite ? "Unfavorite song" : "Favorite song"}
                     >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                </div>

                {/* 3. Plays */}
                <div className="hidden sm:block">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenPlaysModal(episode); }}
                        className="w-full text-center font-bold text-brand-accent hover:underline decoration-brand-accent/30 underline-offset-4"
                        title="Edit play count"
                     >
                        {playCount}
                    </button>
                </div>
                
                {/* 4. Confidence */}
                <div className="hidden sm:flex justify-center">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenConfidenceModal(episode); }}
                        className={`px-2 py-0.5 text-[10px] font-black rounded-full border transition-all hover:shadow-sm ${
                            confidence > 80 ? 'bg-green-100 text-green-700 border-green-200' :
                            confidence > 40 ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                     >
                        {confidence}%
                    </button>
                </div>

                {/* 5. Title Area (Main Clickable Area) */}
                {/* On mobile: full width, flex row for title + heart */}
                <div 
                    className="w-full sm:w-auto min-w-0 flex items-center justify-between sm:justify-start gap-2 cursor-pointer sm:py-3 sm:px-1"
                    onClick={() => {
                        log('DEBUG', 'User clicked title to play', { title: episode.title, id: episode.id });
                        onPlayEpisode(episode.id);
                    }}
                >
                    <div className="min-w-0 flex-grow">
                      <div className={`font-bold text-base sm:text-sm truncate ${isCurrent ? 'text-brand-accent' : 'text-brand-text'}`}>{episode.title}</div>
                      <div className="text-[11px] text-brand-muted truncate opacity-80 sm:hidden">
                          {episode.description.replace(/<[^>]+>/g, '').slice(0, 80)}...
                      </div>
                      <div className="text-[11px] text-brand-muted truncate hidden md:block opacity-70">
                          {episode.description.replace(/<[^>]+>/g, '').slice(0, 100)}
                      </div>
                    </div>
                    {/* Mobile Favorite button inside title area */}
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(episode.audioUrl); }}
                        className="sm:hidden text-2xl text-brand-accent-red p-2 -mr-2"
                     >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                </div>

                {/* 6. Choreo */}
                <div className="hidden sm:flex justify-center items-center">
                    <div className="flex items-center gap-1">
                        {episode.choreo.front && (
                            <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.front!, episode.title, 'Front'); }} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold bg-white border border-brand-border rounded-full hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all" title="Front Choreography">F</button>
                        )}
                        {episode.choreo.back && (
                            <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.back!, episode.title, 'Back'); }} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold bg-white border border-brand-border rounded-full hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all" title="Back Choreography">B</button>
                        )}
                        {episode.choreo.notes && (
                            <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.notes!, episode.title, 'Notes'); }} className="w-8 h-8 flex items-center justify-center text-[10px] font-bold bg-white border border-brand-border rounded-full hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all" title="Rehearsal Notes">N</button>
                        )}
                    </div>
                </div>
                
                {/* 7. Key */}
                {isBookLayout && <div className="hidden sm:block text-xs font-semibold text-brand-muted text-center">{episode.songKey || '-'}</div>}
                
                {/* 8. Page */}
                {isBookLayout && <div className="hidden sm:block text-xs font-semibold text-brand-muted text-center">{episode.songPage || '-'}</div>}
                
                {/* 9. Length */}
                <div className="hidden sm:block text-[11px] text-brand-muted text-right pr-2 font-mono">{durationText}</div>

                {/* --- MOBILE COMPACT METADATA (only shows on small screens) --- */}
                <div className="w-full sm:hidden flex flex-col gap-3 mt-1 pt-2 border-t border-brand-border/20">
                     <div className="flex flex-wrap items-center justify-between text-xs text-brand-muted font-medium">
                        <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); onOpenPlaysModal(episode); }} className="flex items-center gap-1 bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full">
                                <span className="text-brand-accent font-bold">{playCount}</span> plays
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onOpenConfidenceModal(episode); }} className="flex items-center gap-1 bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full">
                                Conf: <span className="text-brand-text font-bold">{confidence}%</span>
                            </button>
                        </div>
                        <span className="font-mono text-[10px] bg-brand-bg px-1 rounded">{durationText}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-xs text-brand-muted">
                            {isBookLayout && <span className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border/50">Key: <span className="font-bold text-brand-text">{episode.songKey || '-'}</span></span>}
                            {isBookLayout && <span className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border/50">Pg: <span className="font-bold text-brand-text">{episode.songPage || '-'}</span></span>}
                        </div>
                         <div className="flex items-center gap-2">
                            {episode.choreo.front && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.front!, episode.title, 'Front'); }} className="px-3 py-1 text-[10px] font-bold bg-white border border-brand-border rounded-full shadow-sm">Front</button>}
                            {episode.choreo.back && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.back!, episode.title, 'Back'); }} className="px-3 py-1 text-[10px] font-bold bg-white border border-brand-border rounded-full shadow-sm">Back</button>}
                            {episode.choreo.notes && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.notes!, episode.title, 'Notes'); }} className="px-3 py-1 text-[10px] font-bold bg-white border border-brand-border rounded-full shadow-sm">Notes</button>}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
});


const Playlist: React.FC<PlaylistProps> = ({ episodes, playCounts, songConfidence, favorites, isLoading, error, currentEpisodeId, onPlayEpisode, onOpenNotes, onOpenConfidenceModal, onOpenPlaysModal, onToggleFavorite, durationCache }) => {
    
    const missingFromPodcast = useMemo(() => getMissingSongs(episodes), [episodes]);

    if (isLoading) {
        return <LoadingIndicator puns={LOADING_PUNS} />;
    }
    if (error) {
        return (
            <div className="p-10 my-6 text-center text-red-700 bg-red-50 border-2 border-dashed border-red-200 rounded-2xl">
                <div className="text-2xl mb-2">⚠️</div>
                <h4 className="font-bold mb-1">Failed to load feed</h4>
                <p className="text-sm opacity-80">{error}</p>
            </div>
        );
    }
    
    if (episodes.length === 0 && missingFromPodcast.length === 0) {
        return <div className="p-10 my-6 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-2xl bg-amber-50/10 italic">No episodes found matching your criteria.</div>;
    }

    return (
        <section className="bg-brand-card rounded-xl shadow-sm border border-brand-border overflow-hidden">
            {episodes.length > 0 && (
                <div className="flex flex-col">
                    <div className="bg-brand-accent/5 px-4 py-3 border-b border-brand-border flex justify-between items-center">
                        <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest">Episode List</h3>
                        <span className="text-xs text-brand-muted font-bold">{episodes.length} Tracks</span>
                    </div>
                    <PlaylistHeader isBookLayout={true} />
                    <ul aria-live="polite" className="divide-y divide-brand-border/20">
                        {episodes.map((ep, idx) => (
                            <EpisodeRow
                                key={ep.id}
                                index={idx}
                                episode={ep}
                                playCount={playCounts[ep.audioUrl] || 0}
                                confidence={songConfidence[ep.audioUrl] || 0}
                                isFavorite={!!favorites[ep.audioUrl]}
                                isCurrent={ep.id === currentEpisodeId}
                                onPlayEpisode={onPlayEpisode}
                                onOpenNotes={onOpenNotes}
                                onOpenConfidenceModal={onOpenConfidenceModal}
                                onOpenPlaysModal={onOpenPlaysModal}
                                onToggleFavorite={onToggleFavorite}
                                durationCache={durationCache}
                                isBookLayout={true}
                            />
                        ))}
                    </ul>
                </div>
            )}
             {missingFromPodcast.length > 0 && (
                <div className="m-4">
                    <details className="p-4 rounded-xl bg-amber-50/40 border border-brand-border group transition-all">
                        <summary className="font-black text-xs text-brand-muted cursor-pointer select-none uppercase tracking-widest list-none flex items-center gap-2">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            Songs in Book (Not in this Feed)
                            <span className="ml-auto text-[10px] bg-amber-200/50 px-2 py-0.5 rounded-full">{missingFromPodcast.length} missing</span>
                        </summary>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                            {missingFromPodcast.map(song => (
                                <div key={song.name} className="text-xs py-1 border-b border-brand-border/30 flex justify-between gap-2">
                                    <span className="font-semibold text-brand-text truncate">{song.name}</span>
                                    <span className="text-brand-muted flex-shrink-0">P.{song.page} ({song.key})</span>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </section>
    );
};

export default Playlist;