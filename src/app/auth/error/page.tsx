'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let errorMessage = 'An unexpected authentication error occurred.';

    if (error === 'Configuration') {
        errorMessage = 'There is a problem with the server configuration. Please check if your AUTH_SECRET and Provider credentials are set correctly.';
    } else if (error === 'AccessDenied') {
        errorMessage = 'Access denied. You do not have permission to sign in.';
    } else if (error === 'Verification') {
        errorMessage = 'The verification token has expired or has already been used.';
    } else if (error) {
        errorMessage = `Error details: ${error}`;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-[var(--shadow-modal)] max-w-md w-full mx-auto">
            <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center border border-red-100 mb-4">
                <AlertCircle className="w-7 h-7 text-[var(--text-error)] animate-pulse" />
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-heading)] mb-2 font-heading tracking-tight">Authentication Error</h1>
            <p className="text-[var(--text-secondary)] text-center text-sm leading-relaxed mb-6">{errorMessage}</p>

            <div className="bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] p-4 rounded-lg text-xs font-mono text-[var(--text-body)] w-full overflow-auto max-h-32">
                <span className="font-bold text-[var(--text-heading)] block mb-1">Raw Protocol Error:</span>
                {error || 'Unknown'}
            </div>

            <Link
                href="/login"
                className="mt-6 w-full text-center py-3 bg-[var(--btn-danger-bg)] text-[var(--btn-danger-text)] font-semibold rounded-lg hover:bg-red-750 transition-colors shadow-sm cursor-pointer select-none border-none text-sm"
            >
                Try Again
            </Link>
            
            <Link
                href="/support"
                className="mt-4 text-xs font-bold text-[var(--text-brand)] hover:text-[var(--text-brand-hover)] transition-colors select-none"
            >
                Contact Support
            </Link>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-body)] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-sm font-mono animate-pulse text-[var(--text-secondary)]">Loading error details...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
