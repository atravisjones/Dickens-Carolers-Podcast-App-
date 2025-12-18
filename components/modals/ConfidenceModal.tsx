import React, { useState, useEffect } from 'react';
import { Episode } from '../../types';
import { CONFIDENCE_LEVELS } from '../../constants';


interface ConfidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (confidence: number) => void;
    episode: Episode;
    initialConfidence: number;
}

const getConfidenceDetails = (percentage: number) => {
    return [...CONFIDENCE_LEVELS].reverse().find(level => percentage >= level.threshold) || CONFIDENCE_LEVELS[0];
};

const ConfidenceModal: React.FC<ConfidenceModalProps> = ({ isOpen, onClose, onSave, episode, initialConfidence }) => {
    const [value, setValue] = useState(initialConfidence);
    const details = getConfidenceDetails(value);

    useEffect(() => {
        setValue(initialConfidence);
    }, [initialConfidence, isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/25 flex items-center justify-center z-[100] backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-full max-w-2xl bg-brand-bg border border-brand-border rounded-2xl p-5 shadow-2xl m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold font-display">Singing Confidence</h3>
                <p className="mt-1 text-sm text-brand-muted truncate">How well do you know "{episode.title}"?</p>
                
                <div className="my-6 text-center">
                    <div className="text-2xl font-bold text-brand-accent-red">{details.title}</div>
                    <div className="mt-1 text-sm text-brand-muted max-w-md mx-auto">{details.desc}</div>
                </div>

                <div className="flex items-center gap-4">
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-full h-2 bg-brand-border/50 rounded-full appearance-none cursor-pointer accent-brand-accent-red"
                    />
                    <div className="text-xl font-bold w-16 text-right">{value}%</div>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white border border-brand-border rounded-lg hover:shadow-sm">Cancel</button>
                    <button onClick={() => onSave(value)} className="px-4 py-2 text-sm font-bold text-white bg-brand-accent-red rounded-lg hover:brightness-90">Save Confidence</button>
                </div>
            </div>
        </div>
    );
};

export default ConfidenceModal;
