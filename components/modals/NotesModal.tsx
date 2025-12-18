import React, { useRef, useEffect } from 'react';
import { ChoreoItem } from '../../types';

interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ChoreoItem;
    episodeTitle: string;
    label: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, item, episodeTitle, label }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.pause();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isPdf = item.mediaType === 'application/pdf' || item.mediaUrl.endsWith('.pdf');
    const isVideo = item.mediaType.startsWith('video/');

    return (
        <div
            className="fixed inset-0 bg-black/25 flex items-center justify-center z-[100] backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-3xl bg-brand-bg border border-brand-border rounded-2xl p-5 shadow-2xl m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold font-display">{episodeTitle} — {label}</h3>
                <div className="my-4 overflow-auto max-h-[70vh]">
                    {isVideo && (
                        <video ref={videoRef} controls className="w-full rounded-lg" autoPlay>
                            <source src={item.mediaUrl} type={item.mediaType} />
                            Your browser does not support the video tag.
                        </video>
                    )}
                    {isPdf && (
                        <iframe src={item.mediaUrl} className="w-full h-[60vh] border rounded-lg" title={`${episodeTitle} - ${label}`}></iframe>
                    )}
                    <p className="mt-3 text-sm text-brand-muted">{item.description}</p>
                </div>
                <div className="flex gap-2 justify-end mt-auto pt-4">
                    <a href={item.link || item.mediaUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-bold text-white bg-brand-accent rounded-lg hover:brightness-90">
                        Open source
                    </a>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white border border-brand-border rounded-lg hover:shadow-sm">Close</button>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
