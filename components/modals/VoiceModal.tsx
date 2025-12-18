import React, { useState, useEffect } from 'react';
import { VoicePart } from '../../types';

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (voice: VoicePart) => void;
    currentVoice: VoicePart | null;
}

const VOICE_PARTS: VoicePart[] = ["SOPRANO", "ALTO", "TENOR", "BASS"];
const voiceDesc: Record<VoicePart, string> = {
    SOPRANO: 'High voice',
    ALTO: 'Lower treble',
    TENOR: 'High male',
    BASS: 'Low male',
};

const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onSave, currentVoice }) => {
    const [selectedVoice, setSelectedVoice] = useState<VoicePart | null>(currentVoice);

    useEffect(() => {
        setSelectedVoice(currentVoice);
    }, [currentVoice, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (selectedVoice) {
            onSave(selectedVoice);
        }
    };

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
                <h3 className="text-xl font-bold font-display">Choose your part</h3>
                <p className="mt-1 text-sm text-brand-muted">Pick the RSS feed to load. You can change this anytime.</p>
                <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VOICE_PARTS.map(part => (
                        <label key={part} className="cursor-pointer">
                            <input
                                type="radio"
                                name="voice"
                                value={part}
                                checked={selectedVoice === part}
                                onChange={() => setSelectedVoice(part)}
                                className="sr-only"
                            />
                            <div className={`p-4 border rounded-xl transition-all bg-brand-bg hover:bg-black/5 ${selectedVoice === part ? 'border-brand-accent ring-2 ring-brand-accent/30' : 'border-brand-border'}`}>
                                <div className="font-extrabold text-lg">{part.charAt(0) + part.slice(1).toLowerCase()}</div>
                                <div className="text-xs text-brand-muted">{voiceDesc[part]}</div>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={handleSave} disabled={!selectedVoice} className="px-4 py-2 text-sm font-bold text-white bg-brand-accent rounded-lg hover:brightness-90 disabled:bg-gray-400 disabled:border-gray-400">Use feed</button>
                </div>
            </div>
        </div>
    );
};

export default VoiceModal;
