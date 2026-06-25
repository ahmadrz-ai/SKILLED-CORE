import type { NextAuthConfig } from "next-auth";

/**
 * Admin allowlist — emails elevated to the ADMIN role on sign-in.
 *
 * Security: these used to be hardcoded in source. They now come from the
 * ADMIN_EMAILS env var (comma-separated) so no privileged account is baked into
 * the repo. Set ADMIN_EMAILS in .env (local) AND in Vercel (production), e.g.
 *   ADMIN_EMAILS=ahmad@skilledcore.com,support@skilledcore.com
 * If unset, NO email is auto-elevated (roles come from the DB only).
 */
const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/feed',
    '/hire',
    '/interview',
    '/messages',
    '/network',
    '/settings',
    '/analytics',
    '/notifications',
    '/profile',
    '/applications',
    '/billing',
    '/credits',
    '/salary',
    '/learning',
    '/assessments',
    '/company',
    '/project',
    '/search',
];

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const path = nextUrl.pathname;

            // Check if this is a protected route
            const isProtected = PROTECTED_ROUTES.some(route =>
                path === route || path.startsWith(route + '/')
            );

            if (isProtected) {
                if (isLoggedIn) return true;
                // Preserve the intended destination for post-login redirect
                const redirectUrl = encodeURIComponent(path + nextUrl.search);
                return Response.redirect(new URL(`/register?redirect=${redirectUrl}`, nextUrl));
            }

            // Redirect logged-in users away from login/register/verify-2fa
            if (isLoggedIn && (path === '/login' || path === '/register' || path === '/verify-2fa')) {
                return Response.redirect(new URL('/feed', nextUrl));
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;

                // Elevate allowlisted superusers to ADMIN dynamically (ADMIN_EMAILS env).
                if (isAdminEmail(user.email)) {
                    // @ts-ignore
                    token.role = "ADMIN";
                }
            }
            if (trigger === "update" && session) {
                token = { ...token, ...session.user };
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;

                // Elevate allowlisted superusers to ADMIN dynamically (ADMIN_EMAILS env).
                if (isAdminEmail(session.user.email)) {
                    // @ts-ignore
                    session.user.role = "ADMIN";
                }
            }
            return session;
        }
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;

