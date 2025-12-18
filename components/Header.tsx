import React from 'react';
import { SortMode, VoicePart, ChoreoFilters } from '../types';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortMode: SortMode;
    onSortChange: (mode: SortMode) => void;
    currentVoice: VoicePart | null;
    onOpenVoiceModal: () => void;
    choreoFilters: ChoreoFilters;
    onChoreoFiltersChange: (filters: ChoreoFilters) => void;
    favoritesFilter: boolean;
    onFavoritesFilterChange: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    searchQuery, onSearchChange,
    sortMode, onSortChange,
    currentVoice, onOpenVoiceModal,
    choreoFilters, onChoreoFiltersChange,
    favoritesFilter, onFavoritesFilterChange
 }) => {

    const handleFilterChange = (filter: keyof ChoreoFilters) => {
        onChoreoFiltersChange({ ...choreoFilters, [filter]: !choreoFilters[filter] });
    };
    
    const clearFilters = () => {
        onChoreoFiltersChange({ any: false, front: false, back: false, notes: false });
    };

    return (
        <header className="sticky top-0 z-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 border-b border-black/20 bg-gradient-to-b from-brand-header-start to-brand-header-end text-amber-50 shadow-lg">
            <div className="flex items-center gap-2 self-center">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display">Dickens Carolers Podcast</h1>
            </div>
            <div className="w-full sm:w-auto flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <input
                    type="text"
                    placeholder="Search episodes..."
                    aria-label="Search episodes"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-grow sm:flex-grow-0 w-full sm:w-48 px-3 py-1.5 text-sm border border-brand-header-start rounded-full bg-amber-50 text-brand-text placeholder-brand-muted focus:border-brand-accent focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
                <select 
                    id="sortSelect"
                    value={sortMode}
                    onChange={(e) => onSortChange(e.target.value as SortMode)}
                    className="flex-grow sm:flex-grow-0 px-3 py-1.5 text-sm border border-brand-header-start rounded-full bg-amber-50 text-brand-text appearance-none"
                >
                    <option value="bookOrder">Book Order</option>
                    <option value="alpha">Alphabetical (Title)</option>
                    <option value="confidenceHigh">Highest Confidence</option>
                    <option value="confidenceLow">Lowest Confidence</option>
                    <option value="mostPlayed">Most Played</option>
                    <option value="leastPlayed">Least Played</option>
                    <option value="shortest">Shortest</option>
                    <option value="longest">Longest</option>
                </select>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={onOpenVoiceModal} className="px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-bold bg-amber-50 text-brand-text border border-brand-header-start rounded-full hover:bg-amber-100 transition-shadow">
                        {currentVoice || 'Choose voice'}
                    </button>
                    <a href="https://app.slack.com/client/T07KSLNTJE7/C07KPTDES6R" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-bold bg-amber-50 text-brand-text border border-brand-header-start rounded-full hover:bg-amber-100 transition-shadow" title="Open Slack Channel">
                        Slack
                    </a>
                    <a href="https://azdickenscarolers.com/dci/" target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-bold bg-amber-50 text-brand-text border border-brand-header-start rounded-full hover:bg-amber-100 transition-shadow" title="Login to Dickens Carolers Site">
                        DCI Login
                    </a>
                </div>
                 <div className="flex items-center flex-wrap justify-center gap-1 p-1 bg-amber-50/20 border border-white/20 rounded-full">
                    <button
                        onClick={() => onFavoritesFilterChange(!favoritesFilter)}
                        aria-pressed={favoritesFilter}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${favoritesFilter ? 'bg-black/20 text-amber-50' : 'hover:bg-black/10'}`}
                    >
                        ♥ Favorites
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <button
                        onClick={() => handleFilterChange('any')}
                        aria-pressed={choreoFilters.any}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${choreoFilters.any ? 'bg-black/20 text-amber-50' : 'hover:bg-black/10'}`}
                    >
                        Any
                    </button>
                    <button
                        onClick={() => handleFilterChange('front')}
                        aria-pressed={choreoFilters.front}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${choreoFilters.front ? 'bg-black/20 text-amber-50' : 'hover:bg-black/10'}`}
                    >
                        Front
                    </button>
                    <button
                        onClick={() => handleFilterChange('back')}
                        aria-pressed={choreoFilters.back}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${choreoFilters.back ? 'bg-black/20 text-amber-50' : 'hover:bg-black/10'}`}
                    >
                        Back
                    </button>
                    <button
                        onClick={() => handleFilterChange('notes')}
                        aria-pressed={choreoFilters.notes}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${choreoFilters.notes ? 'bg-black/20 text-amber-50' : 'hover:bg-black/10'}`}
                    >
                        Notes
                    </button>
                    <button onClick={clearFilters} className="text-xs px-2 py-1 border border-amber-100/50 rounded-full hover:bg-black/20">Clear</button>
                </div>
            </div>
        </header>
    );
};

export default Header;
