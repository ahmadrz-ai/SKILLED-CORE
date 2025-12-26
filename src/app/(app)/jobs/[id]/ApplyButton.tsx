'use client';

import { useState } from 'react';
import { applyToJob } from '@/app/actions/jobs';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ApplyButtonProps {
    jobId: string;
    initialHasApplied: boolean;
}

export default function ApplyButton({ jobId, initialHasApplied }: ApplyButtonProps) {
    const [hasApplied, setHasApplied] = useState(initialHasApplied);
    const [isLoading, setIsLoading] = useState(false);

    const handleApply = async () => {
        setIsLoading(true);
        const result = await applyToJob(jobId);
        setIsLoading(false);

        if (result.success) {
            toast.success(result.message);
            setHasApplied(true);
        } else {
            toast.error(result.message);
        }
    };

    if (hasApplied) {
        return (
            <button disabled className="w-full md:w-auto bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold py-3 px-8 rounded-lg flex items-center justify-center cursor-not-allowed">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Application Sent
            </button>
        );
    }

    return (
        <button
            onClick={handleApply}
            disabled={isLoading}
            className="w-full md:w-auto bg-white text-black font-bold py-3 px-8 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-50"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transmitting...
                </>
            ) : (
                "Apply Now"
            )}
        </button>
    );
}
