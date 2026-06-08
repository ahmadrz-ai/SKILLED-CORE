import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

export default function SessionWrapper({ children, session }: { children: React.ReactNode; session?: Session | null }) {
    // Bug 6/15: the server-resolved session is passed in as the initial value, so the
    // client provider doesn't need to re-fetch /api/auth/session on mount or on every
    // window focus (the audit saw it fire 2-4x per page). Disable the automatic
    // refetches — session updates still propagate via the explicit update() trigger.
    return (
        <SessionProvider
            session={session}
            refetchOnWindowFocus={false}
            refetchInterval={0}
        >
            {children}
        </SessionProvider>
    );
}
