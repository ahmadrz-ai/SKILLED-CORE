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
    debug: false, // Enable debug logs
    trustHost: true, // Fix for localhost configuration error
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            // Check if user is registering/logging in via OAuth
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

                    // Assign role if registering a new OAuth user
                    if (signupRole) {
                        // @ts-ignore
                        user.role = signupRole.toUpperCase();
                    }
                } catch (err) {
                    console.error("Error in signIn callback:", err);
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;

                // Create database session record for auditing and revocation
                try {
                    const crypto = await import("crypto");
                    const sessionToken = crypto.randomUUID();
                    const { headers } = await import("next/headers");
                    const headersList = await headers();
                    const userAgent = headersList.get("user-agent") || "";
                    const xForwardedFor = headersList.get("x-forwarded-for");
                    const xRealIp = headersList.get("x-real-ip");
                    const ip = xForwardedFor?.split(",")[0]?.trim() || xRealIp || "127.0.0.1";

                    let location = "Unknown Location";
                    // @ts-ignore
                    const geoip = (await import("geoip-lite")).default;
                    if (geoip && ip !== "127.0.0.1" && ip !== "::1" && !ip.startsWith("10.") && !ip.startsWith("192.168.")) {
                        const geo = geoip.lookup(ip);
                        if (geo) {
                            const parts = [];
                            if (geo.city) parts.push(geo.city);
                            if (geo.region) parts.push(geo.region);
                            if (geo.country) parts.push(geo.country);
                            location = parts.join(", ");
                        }
                    }

                    await prisma.session.create({
                        data: {
                            sessionToken,
                            userId: user.id,
                            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            userAgent,
                            ipAddress: ip,
                            location: location === "Unknown Location" ? null : location,
                        }
                    });

                    token.sessionToken = sessionToken;
                } catch (err) {
                    console.error("Failed to register active DB session record in JWT callback:", err);
                }

                // Elevate superusers to ADMIN dynamically
                const cleanEmails = ["ahmadrazaai801@gmail.com", "ahmad@skilledcore.com", "support@skilledcore.com"];
                const userEmail = user.email || "";
                if (userEmail && cleanEmails.includes(userEmail.toLowerCase().trim())) {
                    // @ts-ignore
                    token.role = "ADMIN";
                }
            } else if (token.sessionToken) {
                // Subsequent calls: check if the session was revoked in the DB
                try {
                    const dbSession = await prisma.session.findUnique({
                        where: { sessionToken: token.sessionToken as string },
                        select: { id: true }
                    });
                    if (!dbSession) {
                        return null; // Revoked session token -> force client logout
                    }
                } catch (err) {
                    // Fail-safe: don't block auth if the DB connection times out
                }
            }

            if (trigger === "update" && session) {
                token = { ...token, ...session.user };
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                // @ts-ignore
                session.user.sessionToken = token.sessionToken as string;

                // Elevate superusers to ADMIN dynamically
                const cleanEmails = ["ahmadrazaai801@gmail.com", "ahmad@skilledcore.com", "support@skilledcore.com"];
                const userEmail = session.user.email || "";

                if (userEmail && cleanEmails.includes(userEmail.toLowerCase().trim())) {
                    // @ts-ignore
                    session.user.role = "ADMIN";
                }

                // Fetch fresh role from DB to handle external updates
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: { role: true, name: true, image: true, username: true, credits: true, email: true }
                    });

                    const activeEmail = freshUser?.email || userEmail;
                    if (activeEmail && cleanEmails.includes(activeEmail.toLowerCase().trim())) {
                        // @ts-ignore
                        session.user.role = "ADMIN";
                    } else {
                        // @ts-ignore
                        session.user.role = freshUser?.role || token.role;
                    }

                    if (freshUser?.name) session.user.name = freshUser.name;
                    if (freshUser?.image) session.user.image = freshUser.image;
                    // @ts-ignore
                    if (freshUser?.username) session.user.username = freshUser.username;
                    // @ts-ignore
                    if (freshUser?.credits !== undefined) session.user.credits = freshUser.credits;
                } catch (error: any) {
                    const msg = error?.message || "Unknown error";
                    console.warn("Session Sync WARN:", msg);

                    if (userEmail && cleanEmails.includes(userEmail.toLowerCase().trim())) {
                        // @ts-ignore
                        session.user.role = "ADMIN";
                    } else {
                        // @ts-ignore
                        session.user.role = token.role;
                    }
                }
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
            } catch (err) {
                console.error("Failed to parse headers or dispatch Login Alert Email:", err);
            }
        },
        async createUser({ user }) {
            // Type assertion for user that may have username
            const dbUser = user as typeof user & { username?: string | null };
            if (!dbUser.username && dbUser.email) {
                const baseName = dbUser.email.split('@')[0];
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
                    where: { id: dbUser.id },
                    data: { 
                        username: uniqueName,
                        role: roleToSave
                    }
                });
                console.log(`[OAuth Registration] Created user: ${dbUser.email} with username: ${uniqueName} and role: ${roleToSave}`);
            }
        }
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                otp: { label: "OTP", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                const identifier = credentials.email as string;
                const cleanEmail = identifier.toLowerCase().trim();

                // --- OTP LOGIN FLOW ---
                if (credentials.otp) {
                    const otp = credentials.otp as string;

                    const token = await prisma.verificationToken.findFirst({
                        where: {
                            identifier: { equals: cleanEmail, mode: 'insensitive' },
                            token: otp
                        }
                    });

                    if (!token) {
                        throw new Error("Invalid code");
                    }

                    if (new Date() > token.expires) {
                        throw new Error("Code expired");
                    }

                    // Find User (Case-insensitive match on both email and username)
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: { equals: cleanEmail, mode: 'insensitive' } },
                                { username: { equals: cleanEmail, mode: 'insensitive' } }
                            ]
                        }
                    });

                    if (!user) return null;

                    // Verify User Email using their safe unique ID
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { emailVerified: new Date() },
                    });

                    // Consume Token using exact retrieved parameters
                    await prisma.verificationToken.delete({
                        where: {
                            identifier_token: {
                                identifier: token.identifier,
                                token: token.token
                            }
                        }
                    });

                    return user;
                }

                // --- PASSWORD LOGIN FLOW ---
                if (!credentials.password) return null;

                try {
                    const cleanEmail = identifier.toLowerCase().trim();
                    const isMockSocial = cleanEmail.includes("mock-google") || cleanEmail.includes("mock-github");

                    let user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: { equals: cleanEmail, mode: 'insensitive' } },
                                { username: { equals: cleanEmail, mode: 'insensitive' } }
                            ]
                        }
                    });

                    if (!user && isMockSocial) {
                        // Create mock social user on the fly in development
                        const provider = cleanEmail.includes("google") ? "Google" : "GitHub";
                        const parsedRole = cleanEmail.includes("recruiter") ? "RECRUITER" : "CANDIDATE";
                        const baseUsername = cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");
                        
                        // Ensure unique username
                        let uniqueUsername = baseUsername;
                        let counter = 1;
                        while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
                            uniqueUsername = `${baseUsername}_${counter}`;
                            counter++;
                        }

                        const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
                        user = await prisma.user.create({
                            data: {
                                email: cleanEmail,
                                name: `Mock ${provider} User`,
                                username: uniqueUsername,
                                password: hashedPassword,
                                role: parsedRole,
                                emailVerified: new Date(),
                                credits: 100, // Give them plenty of credits
                            }
                        });
                        console.log(`[DEV ONLY] Created mock social user: ${cleanEmail} with role: ${parsedRole}`);
                    }

                    if (!user || !user.password) {
                        return null;
                    }

                    // @ts-ignore
                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (isValid) {
                        try {
                            // Update last login
                            await prisma.user.update({
                                where: { id: user.id },
                                data: { lastLogin: new Date() }
                            });
                        } catch (err) {
                            console.error("Failed to update lastLogin:", err);
                            // Don't block login
                        }
                        return user;
                    }
                    return null;
                } catch (e) {
                    console.error("Authorize Error:", e);
                    const errMessage = (e as any)?.message || "";
                    const isDbConnectionError = errMessage.includes('Can\'t reach database server') || errMessage.includes('connect to database');

                    if (process.env.NODE_ENV === 'development' && isDbConnectionError && (identifier.includes('test') || identifier.includes('mock'))) {
                        console.warn("Using MOCK login success due to DB connection error for TEST user");
                        return {
                            id: 'mock-user-id-demo',
                            name: 'Mock User',
                            email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
                            role: 'CANDIDATE',
                            image: null,
                            username: identifier.includes('@') ? identifier.split('@')[0] : identifier
                        };
                    }
                    return null;
                }
            }
        }),
        ...(hasGoogle ? [Google({
            clientId: googleId,
            clientSecret: googleSecret,
            allowDangerousEmailAccountLinking: true,
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
    return (nextAuth.auth as any)();
}