import React, { useState } from 'react';
import { useDebugLog, LogEntry } from '../hooks/useDebugLog';

const DebugLog: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { logs, clearLogs, errorCount } = useDebugLog();

    const copyLogs = () => {
        const logText = logs.map(entry => {
            const dataStr = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
            return `[${entry.timestamp}] [${entry.level}] ${entry.message}${dataStr}`;
        }).join('\n\n');
        navigator.clipboard.writeText(logText).catch(err => console.error('Failed to copy logs:', err));
    };

    const getLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'ERROR': return 'text-red-500';
            case 'WARN': return 'text-yellow-500';
            case 'INFO': return 'text-blue-500';
            case 'DEBUG': return 'text-gray-500';
            default: return 'text-gray-700';
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 left-4 z-[9999] w-12 h-12 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                aria-label="Open Debug Log"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
                        {errorCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9998] bg-black/30" onClick={() => setIsOpen(false)}>
                    <div
                        className="fixed bottom-4 left-20 right-4 h-1/2 bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-2 flex-shrink-0">
                            <h2 className="text-lg font-bold">Debug Log</h2>
                            <div>
                                <button onClick={copyLogs} className="px-3 py-1 text-sm bg-gray-200 rounded mr-2 hover:bg-gray-300">Copy</button>
                                <button onClick={clearLogs} className="px-3 py-1 text-sm bg-red-200 rounded hover:bg-red-300">Clear</button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto bg-gray-50 p-2 border rounded font-mono text-xs">
                            {logs.length === 0 ? <div className="text-gray-400">No logs yet...</div> :
                                logs.map((entry, index) => (
                                <div key={index} className="border-b border-gray-200 py-1">
                                    <span className="text-gray-400 mr-2">{entry.timestamp}</span>
                                    <span className={`font-bold mr-2 ${getLevelColor(entry.level)}`}>[{entry.level}]</span>
                                    <span>{entry.message}</span>
                                    {entry.data && (
                                        <pre className="text-gray-600 bg-gray-100 p-2 mt-1 rounded text-[11px] whitespace-pre-wrap break-all">
                                            {JSON.stringify(entry.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DebugLog;
