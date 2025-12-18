import React, { useState, useEffect } from 'react';

interface LoadingIndicatorProps {
    puns: string[];
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ puns }) => {
    const [punIndex, setPunIndex] = useState(() => Math.floor(Math.random() * puns.length));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setPunIndex(prevIndex => (prevIndex + 1) % puns.length);
        }, 2000); 

        return () => clearInterval(intervalId);
    }, [puns.length]);

    return (
        <div className="p-7 my-3 text-center text-brand-muted border-2 border-dashed border-brand-border rounded-xl bg-amber-50/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mx-auto mb-3"></div>
            <p>{puns[punIndex]}</p>
        </div>
    );
};

export default LoadingIndicator;
