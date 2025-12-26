'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleGuard } from '@/hooks/useRoleGuard';

interface RoleGateProps {
    children: React.ReactNode;
    role: 'RECRUITER' | 'ADMIN';
}

export default function RoleGate({ children, role }: RoleGateProps) {
    const { isAuthorized, triggerDenial } = useRoleGuard(role);
    const router = useRouter();
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        // Build a small delay to simulate server check or just ensure hook is ready
        const timer = setTimeout(() => {
            if (!isAuthorized) {
                triggerDenial();
                setTimeout(() => router.push('/feed'), 100);
            }
            setIsChecked(true);
        }, 100);
        return () => clearTimeout(timer);
    }, [isAuthorized, router, triggerDenial]);

    if (!isChecked) return null; // Or a loading spinner
    if (!isAuthorized) return null; // Render nothing while redirecting

    return <>{children}</>;
}
