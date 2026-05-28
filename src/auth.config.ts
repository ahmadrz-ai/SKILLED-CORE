import type { NextAuthConfig } from "next-auth";

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

            // Redirect logged-in users away from login/register
            if (isLoggedIn && (path === '/login' || path === '/register')) {
                return Response.redirect(new URL('/feed', nextUrl));
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;

                // Elevate superusers to ADMIN dynamically
                const cleanEmails = ["ahmadrazaai801@gmail.com", "ahmad@skilledcore.com", "support@skilledcore.com"];
                if (user.email && cleanEmails.includes(user.email.toLowerCase().trim())) {
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

                // Elevate superusers to ADMIN dynamically
                const cleanEmails = ["ahmadrazaai801@gmail.com", "ahmad@skilledcore.com", "support@skilledcore.com"];
                if (session.user.email && cleanEmails.includes(session.user.email.toLowerCase().trim())) {
                    // @ts-ignore
                    session.user.role = "ADMIN";
                }
            }
            return session;
        }
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig;

