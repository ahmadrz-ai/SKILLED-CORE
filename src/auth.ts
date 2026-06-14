import 'server-only'
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./lib/prisma"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs";

// Validation/Debug
const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const hasGoogle = googleId && googleSecret && !googleId.includes("placeholder");

if (!process.env.AUTH_SECRET) {
    console.error("FATAL: AUTH_SECRET is missing. Login will fail.");
}

const nextAuth = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    debug: false,
    trustHost: true,
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            if (account?.provider === 'google' || account?.provider === 'github') {
                try {
                    const { cookies } = await import("next/headers");
                    const cookieStore = await cookies();
                    const signupRole = cookieStore.get("skilledcore_signup_role")?.value;

                    const email = user.email || "";
                    const cleanEmail = email.toLowerCase().trim();
                    const emailDomain = cleanEmail.split("@")[1];

                    const PUBLIC_EMAIL_DOMAINS = new Set([
                        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
                        'icloud.com', 'zoho.com', 'protonmail.com', 'mail.com', 'yandex.com',
                        'gmx.com', 'live.com', 'msn.com', 'rocketmail.com', 'fastmail.com'
                    ]);

                    if (signupRole === "RECRUITER" && emailDomain && PUBLIC_EMAIL_DOMAINS.has(emailDomain)) {
                        console.log(`[OAuth Block] Blocked recruiter signup for email: ${cleanEmail} (Public domain not allowed)`);
                        return "/register?error=RecruiterEmailDomainRequired";
                    }

                    if (signupRole) {
                        user.role = signupRole.toUpperCase();
                    }
                } catch (err) {
                    console.error("Error in signIn callback:", err);
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // On sign-in: attach user data to token
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.plan = user.plan;
                token.username = user.username;
                token.isVerified = user.isVerified;
                token.twoFactorEnabled = user.twoFactorEnabled;
                token.lastSync = Date.now();
                // 2FA pending state
                if (user.twoFactorEnabled) {
                    token.twoFactorPending = true;
                }
            }

            // On session update trigger
            if (trigger === 'update' && session) {
                return { ...token, ...session };
            }

            // Keep mutable fields (role, plan, verification) FRESH from the DB so an
            // admin role change or a direct DB edit takes effect within seconds — the
            // JWT used to cache the sign-in role forever, requiring a re-login. We
            // re-read at most every 10s to avoid a DB hit on every request.
            if (token.id) {
                const SYNC_INTERVAL_MS = 10_000;
                const last = (token.lastSync as number) || 0;
                if (Date.now() - last > SYNC_INTERVAL_MS) {
                    try {
                        const fresh = await prisma.user.findUnique({
                            where: { id: token.id as string },
                            select: { role: true, plan: true },
                        });
                        if (fresh) {
                            token.role = fresh.role;
                            token.plan = fresh.plan;
                        }
                        token.lastSync = Date.now();
                    } catch (e) {
                        // Never block auth on a DB hiccup — keep the existing token.
                        console.error("[auth] jwt role refresh failed:", e);
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            // Defensive check — if no token, return session as-is
            if (!token) return session;

            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.plan = token.plan as string;
                session.user.username = token.username as string;
                session.user.isVerified = token.isVerified as boolean;
                session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
                session.user.twoFactorPending = token.twoFactorPending as boolean;
            }

            return session;
        }
    },
    events: {
        async signIn({ user }) {
            try {
                // Safely extract request headers to parse device and location details
                const { headers } = await import("next/headers");
                const headersList = await headers();
                const userAgent = headersList.get("user-agent") || "";
                const xForwardedFor = headersList.get("x-forwarded-for");
                const xRealIp = headersList.get("x-real-ip");
                const ip = xForwardedFor?.split(",")[0]?.trim() || xRealIp || "127.0.0.1";

                // Vercel Geolocation headers
                const city = headersList.get("x-vercel-ip-city");
                const region = headersList.get("x-vercel-ip-country-region");
                const country = headersList.get("x-vercel-ip-country");

                // Parse Device details
                const { parseUserAgent } = await import("@/app/actions/sendLoginAlertEmail");
                const { device } = await parseUserAgent(userAgent);

                // Format location
                let location = "Unknown Location";
                if (city || country) {
                    const parts = [];
                    if (city) parts.push(city);
                    if (region) parts.push(region);
                    if (country) parts.push(country);
                    location = parts.join(", ");
                } else if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
                    location = "Localhost (Development)";
                }

                const email = user.email;
                if (email) {
                    // Fetch full user details from DB to ensure we have the correct username
                    const dbUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { username: true }
                    });
                    const username = dbUser?.username || email.split("@")[0];

                    const { sendLoginAlertEmail } = await import("@/app/actions/sendLoginAlertEmail");
                    
                    // Dispatch asynchronously in background to ensure it is non-blocking
                    sendLoginAlertEmail({
                        email,
                        username,
                        device,
                        location,
                        ipAddress: ip
                    }).catch(err => {
                        console.error("Background Login Alert Email dispatch failed:", err);
                    });
                }

                // Security: in-app new sign-in alert.
                try {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: "NEW_LOGIN",
                            message: `🔐 New sign-in from <strong>${device}</strong> · ${location}. If this wasn't you, secure your account.`,
                            resourcePath: "/settings",
                            read: false,
                        },
                    });
                } catch (e) {
                    console.error("NEW_LOGIN notify failed:", e);
                }
            } catch (err) {
                console.error("Failed to parse headers or dispatch Login Alert Email:", err);
            }
        },
        async createUser({ user }) {
            try {
                if (!user.username && user.email) {
                    const baseName = user.email.split('@')[0];
                    let uniqueName = baseName;
                    let counter = 1;

                    // Simple collision check loop
                    while (await prisma.user.findUnique({ where: { username: uniqueName } })) {
                        uniqueName = `${baseName}${counter}`;
                        counter++;
                    }

                    // Retrieve signup role from cookies
                    let roleToSave = 'CANDIDATE';
                    try {
                        const { cookies } = await import("next/headers");
                        const cookieStore = await cookies();
                        const signupRole = cookieStore.get("skilledcore_signup_role")?.value;
                        if (signupRole === 'RECRUITER' || signupRole === 'CANDIDATE') {
                            roleToSave = signupRole;
                        }
                    } catch (e) {
                        console.error("Failed to read signup role cookie:", e);
                    }

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { 
                            username: uniqueName,
                            role: roleToSave
                        }
                    });
                    console.log(`[OAuth Registration] Created user: ${user.email} with username: ${uniqueName} and role: ${roleToSave}`);
                }

                // Welcome the new account.
                try {
                    if (user.id) {
                        await prisma.notification.create({
                            data: {
                                userId: user.id,
                                type: "WELCOME",
                                message: "👋 Welcome to SkilledCore! Complete your profile and earn your first verified skill badge.",
                                resourcePath: "/feed",
                                read: false,
                            },
                        });
                    }
                } catch (e) {
                    console.error("WELCOME notify failed:", e);
                }
            } catch (err) {
                console.error("Failed inside createUser event callback:", err);
            }
        }
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otp: { label: "One-time code", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                try {
                    const email = credentials.email as string;
                    const cleanEmail = email.toLowerCase().trim();

                    // ── 2FA COMPLETION PATH (passwordless) ───────────────────────────
                    // After the password + TOTP steps, verify2FAAndLogin() mints a
                    // single-use VerificationToken and the client calls signIn with
                    // { email, otp } and NO password. Consume that token here. Without
                    // this branch the credentials provider rejects the passwordless 2FA
                    // login, so signIn always errors and the user can never get past
                    // /verify-2fa (Bug 3).
                    if (credentials.otp && !credentials.password) {
                        const otp = (credentials.otp as string).trim();

                        const vt = await prisma.verificationToken.findFirst({
                            where: { identifier: cleanEmail, token: otp },
                        });

                        // One-time use: delete the token as soon as it's looked up,
                        // regardless of whether it turns out to be expired.
                        if (vt) {
                            await prisma.verificationToken.deleteMany({
                                where: { identifier: cleanEmail, token: otp },
                            });
                        }

                        if (!vt || vt.expires < new Date()) return null;

                        const otpUser = await prisma.user.findFirst({
                            where: {
                                OR: [
                                    { email: { equals: cleanEmail, mode: 'insensitive' } },
                                    { username: { equals: cleanEmail, mode: 'insensitive' } }
                                ]
                            },
                            select: {
                                id: true, email: true, name: true, role: true, plan: true,
                                image: true, username: true, emailVerified: true, twoFactorEnabled: true,
                            }
                        });
                        if (!otpUser) return null;

                        return {
                            id: otpUser.id,
                            email: otpUser.email,
                            name: otpUser.name,
                            role: otpUser.role,
                            plan: otpUser.plan,
                            image: otpUser.image,
                            username: otpUser.username,
                            isVerified: !!otpUser.emailVerified,
                            twoFactorEnabled: otpUser.twoFactorEnabled,
                        };
                    }

                    // ── STANDARD EMAIL + PASSWORD PATH ───────────────────────────────
                    if (!credentials.password) return null;

                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: { equals: cleanEmail, mode: 'insensitive' } },
                                { username: { equals: cleanEmail, mode: 'insensitive' } }
                            ]
                        },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            password: true,
                            role: true,
                            plan: true,
                            image: true,
                            username: true,
                            emailVerified: true,
                            twoFactorEnabled: true,
                        }
                    });

                    if (!user || !user.password) return null;

                    const isValid = await bcrypt.compare(credentials.password as string, user.password);
                    if (!isValid) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        plan: user.plan,
                        image: user.image,
                        username: user.username,
                        isVerified: !!user.emailVerified,
                        twoFactorEnabled: user.twoFactorEnabled,
                    };
                } catch (err) {
                    console.error('[auth] authorize error:', err);
                    return null;
                }
            }
        }),
        ...(hasGoogle ? [Google({
            clientId: googleId,
            clientSecret: googleSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })] : []),
        ...(process.env.AUTH_GITHUB_ID && !process.env.AUTH_GITHUB_ID.includes("placeholder") ? [GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
        })] : []),
    ],
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export async function auth() {
    try {
        return await (nextAuth.auth as any)();
    } catch (err) {
        console.warn("auth() helper caught unhandled crash:", err);
        return null;
    }
}