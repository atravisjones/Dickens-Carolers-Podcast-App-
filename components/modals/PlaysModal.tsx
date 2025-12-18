import React, { useState, useEffect } from 'react';
import { Episode } from '../../types';

interface PlaysModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (plays: number) => void;
    episode: Episode;
    initialPlays: number;
}

const PlaysModal: React.FC<PlaysModalProps> = ({ isOpen, onClose, onSave, episode, initialPlays }) => {
    const [value, setValue] = useState(initialPlays);

    useEffect(() => {
        setValue(initialPlays);
    }, [initialPlays, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        const newPlays = Math.max(0, Math.floor(Number(value) || 0));
        onSave(newPlays);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/25 flex items-center justify-center z-[100] backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full max-w-md bg-brand-bg border border-brand-border rounded-2xl p-5 shadow-2xl m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold font-display">Edit Play Count</h3>
                <p className="mt-1 text-sm text-brand-muted truncate">For "{episode.title}"</p>
                
                <div className="my-6">
                    <label htmlFor="play-count-input" className="block text-sm font-medium text-brand-text mb-2">
                        Number of plays
                    </label>
                    <input 
                        id="play-count-input"
                        type="number"
                        min="0"
                        step="1"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full px-3 py-2 text-lg border border-brand-border rounded-lg bg-white text-brand-text placeholder-brand-muted focus:border-brand-accent focus:ring-4 focus:ring-blue-500/10 outline-none"
                    />
                </div>

                <div className="flex gap-2 justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white border border-brand-border rounded-lg hover:shadow-sm">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-brand-accent rounded-lg hover:brightness-90">Save Plays</button>
                </div>
            </div>
        </div>
    );
};

export default PlaysModal;
