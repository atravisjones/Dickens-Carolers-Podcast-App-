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

const PlaylistHeader: React.FC<{ isBookLayout?: boolean }> = ({ isBookLayout = true }) => {
    const gridClass = isBookLayout
        ? "md:grid-cols-[50px_60px_110px_1fr_180px_60px_60px_86px]"
        : "md:grid-cols-[50px_60px_110px_1fr_180px_86px]";
    
    return (
        <div className={`hidden md:grid ${gridClass} gap-2 px-3 py-2 text-xs text-brand-muted border-b border-brand-border items-center`}>
            <div className="text-center text-lg text-brand-accent-red" title="Favorite">♥</div>
            <div>Plays</div>
            <div>Confidence</div>
            <div>Title</div>
            <div className="text-center">Choreo</div>
            {isBookLayout && <div className="text-center">Key</div>}
            {isBookLayout && <div className="text-center">Page</div>}
            <div>Length</div>
        </div>
    );
};

const EpisodeRow: React.FC<{
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
}> = React.memo(({ episode, playCount, confidence, isFavorite, isCurrent, isBookLayout = true, onPlayEpisode, onOpenNotes, onOpenConfidenceModal, onOpenPlaysModal, onToggleFavorite, durationCache }) => {
    const { log } = useDebugLog();
    const durationSeconds = episode.durationSeconds ?? durationCache[episode.audioUrl];
    const durationText = (durationSeconds && isFinite(durationSeconds)) ? formatTime(durationSeconds) : '...';

    const gridClass = isBookLayout
        ? "md:grid-cols-[50px_60px_110px_1fr_180px_60px_60px_86px]"
        : "md:grid-cols-[50px_60px_110px_1fr_180px_86px]";

    return (
        <li className={`border-b border-brand-border/70 ${isCurrent ? 'bg-blue-500/10' : ''}`}>
            <button
                onClick={() => {
                    log('DEBUG', 'User clicked playlist row to play', { title: episode.title, id: episode.id });
                    onPlayEpisode(episode.id);
                }}
                className={`w-full text-left p-3 grid grid-cols-1 ${gridClass} gap-x-2 gap-y-1 items-center hover:bg-black/5 transition-colors`}
            >
                <div className="hidden md:flex justify-center items-center">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(episode.audioUrl); }}
                        className="text-2xl text-brand-accent-red p-1 -m-1 rounded-full hover:bg-red-500/10 w-8 h-8 flex items-center justify-center"
                        title={isFavorite ? "Unfavorite song" : "Favorite song"}
                     >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                </div>

                <div className="hidden md:block">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenPlaysModal(episode); }}
                        className="w-full text-center font-bold text-brand-accent rounded hover:bg-black/5 p-1 -m-1"
                        title="Edit play count"
                     >
                        {playCount}
                    </button>
                </div>
                
                <div className="hidden md:block">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onOpenConfidenceModal(episode); }}
                        className="px-3 py-1.5 text-sm font-bold bg-white border border-brand-border rounded-full hover:shadow-md transition-shadow"
                     >
                        {confidence}%
                    </button>
                </div>

                <div className="min-w-0 flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${isCurrent ? 'text-brand-accent' : 'text-brand-text'}`}>{episode.title}</div>
                      <div className="text-xs text-brand-muted truncate hidden sm:block">{episode.description.replace(/<[^>]+>/g, '')}</div>
                    </div>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(episode.audioUrl); }}
                        className="md:hidden text-2xl text-brand-accent-red p-1 w-8 h-8 flex items-center justify-center"
                        title={isFavorite ? "Unfavorite song" : "Favorite song"}
                     >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                </div>


                <div className="hidden md:flex justify-center items-center">
                    <div className="flex items-center gap-1.5">
                        {episode.choreo.front && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.front!, episode.title, 'Front'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Front</button>}
                        {episode.choreo.back && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.back!, episode.title, 'Back'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Back</button>}
                        {episode.choreo.notes && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.notes!, episode.title, 'Notes'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Notes</button>}
                    </div>
                </div>
                
                {isBookLayout && <div className="hidden md:block text-sm text-brand-muted text-center">{episode.songKey || '-'}</div>}
                
                {isBookLayout && <div className="hidden md:block text-sm text-brand-muted text-center">{episode.songPage || '-'}</div>}
                
                <div className="hidden md:block text-sm text-brand-muted">{durationText}</div>

                {/* --- MOBILE DETAILS (flows to next row on mobile) --- */}
                <div className="md:hidden flex flex-col items-start gap-2">
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpenPlaysModal(episode); }}
                            className="rounded hover:bg-black/5 p-1 -m-1"
                            title="Edit play count"
                        >
                            <span className="font-semibold text-brand-accent">{playCount}</span> Plays
                        </button>
                         <span>Confidence:
                            <button 
                                onClick={(e) => { e.stopPropagation(); onOpenConfidenceModal(episode); }}
                                className="ml-1 px-2 py-0.5 text-xs font-bold bg-white border border-brand-border rounded-full"
                            >
                                {confidence}%
                            </button>
                        </span>
                        {isBookLayout && <span>Key: <span className="font-semibold text-brand-text">{episode.songKey || '-'}</span></span>}
                        {isBookLayout && <span>Page: <span className="font-semibold text-brand-text">{episode.songPage || '-'}</span></span>}
                        <span>Length: <span className="font-semibold text-brand-text">{durationText}</span></span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        {episode.choreo.front && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.front!, episode.title, 'Front'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Front</button>}
                        {episode.choreo.back && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.back!, episode.title, 'Back'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Back</button>}
                        {episode.choreo.notes && <button onClick={(e) => { e.stopPropagation(); onOpenNotes(episode.choreo.notes!, episode.title, 'Notes'); }} className="px-3 py-1 text-xs font-bold bg-white border border-brand-border rounded-full hover:shadow-sm">Notes</button>}
                    </div>
                </div>
            </button>
        </li>
    );
});


const Playlist: React.FC<PlaylistProps> = ({ episodes, playCounts, songConfidence, favorites, isLoading, error, currentEpisodeId, onPlayEpisode, onOpenNotes, onOpenConfidenceModal, onOpenPlaysModal, onToggleFavorite, durationCache }) => {
    
    const missingFromPodcast = useMemo(() => getMissingSongs(episodes), [episodes]);

    if (isLoading) {
        return <LoadingIndicator puns={LOADING_PUNS} />;
    }
    if (error) {
        return <div className="p-7 my-3 text-center text-red-600 border-2 border-dashed border-red-200 rounded-xl bg-red-50">Failed to load feed: {error}</div>;
    }
    
    if (episodes.length === 0 && missingFromPodcast.length === 0) {
        return <div className="p-7 my-3 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-xl bg-amber-50/20">No episodes found.</div>;
    }

    return (
        <section>
            {episodes.length > 0 && (
                <div>
                    <h3 className="mt-6 mb-2 px-3 text-base font-bold text-brand-muted">Songs</h3>
                    <PlaylistHeader isBookLayout={true} />
                    <ul aria-live="polite">
                        {episodes.map((ep) => (
                            <EpisodeRow
                                key={ep.id}
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
                <div className="mt-8">
                    <details className="p-3 rounded-lg bg-amber-50/30 border border-brand-border">
                        <summary className="font-bold text-brand-muted cursor-pointer select-none">
                            Songs in Book (Not in this Feed)
                        </summary>
                        <ul className="mt-3 pl-1 space-y-1.5 text-sm text-brand-text columns-1 sm:columns-2 md:columns-3">
                            {missingFromPodcast.map(song => (
                                <li key={song.name} className="break-inside-avoid">
                                    {song.name} - <span className="text-brand-muted">Key: {song.key}, Page: {song.page}</span>
                                </li>
                            ))}
                        </ul>
                    </details>
                </div>
            )}
        </section>
    );
};

export default Playlist;