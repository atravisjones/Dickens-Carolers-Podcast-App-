import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

interface DebugLogContextType {
    logs: LogEntry[];
    log: (level: LogLevel, message: string, data?: any) => void;
    clearLogs: () => void;
    errorCount: number;
}

const DebugLogContext = createContext<DebugLogContextType | undefined>(undefined);

const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

export const DebugLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [errorCount, setErrorCount] = useState(0);

    const log = useCallback((level: LogLevel, message: string, data?: any) => {
        const newEntry: LogEntry = {
            timestamp: formatTimestamp(new Date()),
            level,
            message,
            data,
        };
        setLogs(prev => [...prev, newEntry]);
        if (level === 'ERROR') {
            setErrorCount(prev => prev + 1);
        }
    }, []);
    
    const clearLogs = useCallback(() => {
        setLogs([]);
        setErrorCount(0);
    }, []);

    return (
        <DebugLogContext.Provider value={{ logs, log, clearLogs, errorCount }}>
            {children}
        </DebugLogContext.Provider>
    );
};

export const useDebugLog = (): DebugLogContextType => {
    const context = useContext(DebugLogContext);
    if (!context) {
        // Provide a dummy implementation if context is not available
        // This is useful for testing components in isolation.
        return {
            logs: [],
            log: (level, message, data) => console.log(`[NO CONTEXT][${level}] ${message}`, data),
            clearLogs: () => {},
            errorCount: 0,
        };
    }
    return context;
};
