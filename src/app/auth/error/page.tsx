
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let errorMessage = 'An unexpected authentication error occurred.';

    if (error === 'Configuration') {
        errorMessage = 'There is a problem with the server configuration. Check if your AUTH_SECRET and Provider credentials are set correctly.';
    } else if (error === 'AccessDenied') {
        errorMessage = 'Access denied. You do not have permission to sign in.';
    } else if (error === 'Verification') {
        errorMessage = 'The verification token has expired or has already been used.';
    } else if (error) {
        errorMessage = `Error: ${error}`;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/50 border border-red-500/30 rounded-lg backdrop-blur-sm max-w-md mx-auto mt-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
            <p className="text-zinc-400 text-center mb-6">{errorMessage}</p>

            <div className="bg-zinc-900/50 p-4 rounded text-xs font-mono text-zinc-500 w-full overflow-auto">
                Raw Error: {error || 'Unknown'}
            </div>

            <a
                href="/login"
                className="mt-6 px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded hover:opacity-90 transition-opacity"
            >
                Try Again
            </a>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <Suspense fallback={<div>Loading error details...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
