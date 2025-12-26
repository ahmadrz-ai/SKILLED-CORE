'use client';

import { useSession } from "next-auth/react";

// now matches real session role or defaults to CANDIDATE
export function useRoleMock() {
    const { data: session, status } = useSession();

    // @ts-ignore
    const role = session?.user?.role || "CANDIDATE";

    // We can't easily update role client-side without a server action in real auth, 
    // so we mock the update or just log it.
    const updateRole = (newRole: string) => {
        console.warn("Role update requested:", newRole, "- This requires Admin intervention in real mode.");
    };

    return { role, updateRole, isLoading: status === "loading" };
}
