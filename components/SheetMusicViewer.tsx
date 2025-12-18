import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebugLog } from '../hooks/useDebugLog';

// @ts-ignore
declare const opensheetmusicdisplay: any;

interface SheetMusicViewerProps {
    isOpen: boolean;
    onClose: () => void;
    sheetMusicUrl: string;
    audioRef: React.RefObject<HTMLAudioElement>;
    episodeTitle: string;
}

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({ isOpen, onClose, sheetMusicUrl, audioRef, episodeTitle }) => {
    const { log } = useDebugLog();
    const osmdContainerRef = useRef<HTMLDivElement>(null);
    const osmdRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        log('DEBUG', `Toggling Sheet Music ON`);
        log('INFO', 'SheetMusicViewer is open. Preparing to render.');

        const osmdOptions = {
            autoResize: false, // Important for horizontal scroll
            renderSingleHorizontalStaffline: true, // The key option for horizontal layout
            backend: "svg",
            drawTitle: false,
            followCursor: true, // This will handle auto-scrolling
            cursorOptions: {
                type: 2, // Follow
                color: "rgba(250, 204, 21, 0.8)", // yellow-400 with opacity
                alpha: 0.8,
            }
        };

        const container = osmdContainerRef.current;
        if (container) {
            // Clear previous render
            container.innerHTML = "";
            const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, osmdOptions);
            osmdRef.current = osmd;
            setIsLoading(true);
            setError(null);

            log('DEBUG', 'Loading sheet music from URL', { url: sheetMusicUrl });
            osmd.load(sheetMusicUrl)
                .then(() => {
                    log('DEBUG', 'Sheet music XML loaded, now rendering...');
                    osmd.render();
                    osmd.cursor.show();
                    setIsLoading(false);
                    log('INFO', 'Sheet music rendered successfully.');
                })
                .catch((e: Error) => {
                    const errorMessage = "Could not load the sheet music.";
                    log('ERROR', `OSMD Error: ${errorMessage}`, { error: e.message, name: e.name, stack: e.stack });
                    setError(errorMessage);
                    setIsLoading(false);
                });
        }

        return () => {
            log('DEBUG', 'Closing Sheet Music');
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            osmdRef.current = null;
        };
    }, [isOpen, sheetMusicUrl, log]);

    const syncCursor = useCallback(() => {
        const osmd = osmdRef.current;
        const audio = audioRef.current;
        if (!osmd || !audio || !osmd.cursor || !osmd.IsReadyToRender) {
            return;
        }

        const cursor = osmd.cursor;
        const currentTime = audio.currentTime;

        cursor.reset();
        while (!cursor.endReached) {
            if (cursor.currentTimestamp && cursor.currentTimestamp.realValue >= currentTime) {
                break;
            }
            cursor.next();
        }

    }, [audioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!isOpen || !audio || isLoading || error) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const handleSeek = () => {
            log('DEBUG', 'Audio seeked, syncing sheet music cursor.');
            syncCursor();
        };
        audio.addEventListener('seeked', handleSeek);

        const loop = () => {
            syncCursor();
            animationFrameRef.current = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            audio?.removeEventListener('seeked', handleSeek);
        };
    }, [isOpen, isLoading, error, audioRef, syncCursor, log]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="w-full h-full bg-brand-card flex flex-col">
            <header className="p-2 border-b flex justify-between items-center flex-shrink-0 bg-brand-bg shadow-md">
                <h3 className="text-lg font-bold font-display truncate pr-4">{episodeTitle} - Sheet Music</h3>
                <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-white border border-brand-border rounded-lg hover:shadow-sm">Close</button>
            </header>
            <div className="flex-grow overflow-auto relative bg-white flex items-center justify-center p-4">
                {isLoading && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-muted">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent mx-auto mb-2"></div>
                       <p className="text-sm">Loading score...</p>
                   </div>
                )}
                {error && (
                     <div className="absolute inset-0 flex items-center justify-center text-red-600">
                         <p>{error}</p>
                     </div>
                )}
                <div ref={osmdContainerRef} className="osmd-container w-full h-full" />
            </div>
        </div>
    );
};

export default SheetMusicViewer;
