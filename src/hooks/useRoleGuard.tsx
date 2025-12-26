'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useRoleMock } from './useRoleMock';
import React from 'react'; // Import React for createElement if needed, though Lucide icons are components

export function useRoleGuard(requiredRole: 'RECRUITER' | 'ADMIN') {
    const { role } = useRoleMock();
    const router = useRouter();

    const isAuthorized = role === requiredRole || role === 'ADMIN'; // Admin accesses all

    const triggerDenial = () => {
        // Custom Sci-Fi Toast
        toast.custom((t) => (
            <div className= "flex items-center gap-4 w-full p-4 rounded-lg border-l-4 border-red-600 bg-zinc-900 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] font-mono animate-in slide-in-from-top-2" >
            <div className="p-2 bg-red-500/10 rounded-full" >
        <ShieldAlert className="w-6 h-6 text-red-500" />
        </div>
        < div >
        <h3 className="text-sm font-bold text-red-500 tracking-widest uppercase" > ACCESS DENIED </h3>
        < p className = "text-xs text-zinc-400 mt-1" > Clearance Level Insufficient.Authorization: { requiredRole } Required.</p>
        </div>
        </div>
        ), { duration: 4000 });

        // Optional: Play Sound (not implemented in browser standard without user interaction, usually skipped)
    };

    return { isAuthorized, triggerDenial };
}
