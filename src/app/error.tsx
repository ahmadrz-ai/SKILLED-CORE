'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Runtime Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 animate-pulse">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 font-cinzel">SYSTEM MALFUNCTION</h2>
            <p className="text-zinc-400 max-w-md mb-8">
                Critical error detected in the neural matrix. The requested operation could not be completed.
            </p>

            {/* Error Details */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-lg mb-8 max-w-lg w-full text-left font-mono text-xs text-red-400/80 overflow-auto max-h-40">
                <span className="opacity-50 select-none">$ error_log: </span>
                {error.message || "Unknown system error"}
            </div>

            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide shadow-lg shadow-red-900/20 gap-2"
            >
                <RefreshCcw className="w-4 h-4" />
                REBOOT SYSTEM
            </Button>
        </div>
    );
}
