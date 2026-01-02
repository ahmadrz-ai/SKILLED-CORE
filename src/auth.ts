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

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    debug: false, // Enable debug logs
    trustHost: true, // Fix for localhost configuration error
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                // Fetch fresh role from DB to handle external updates
                try {
                    // console.log("Session Sync: Starting for user", token.sub);
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: { role: true, name: true, image: true, username: true, credits: true }
                    });
                    // console.log("Session Sync: DB Result", freshUser);

                    // @ts-ignore
                    session.user.role = freshUser?.role || token.role;
                    if (freshUser?.name) session.user.name = freshUser.name;
                    if (freshUser?.image) session.user.image = freshUser.image;
                    // @ts-ignore
                    if (freshUser?.username) session.user.username = freshUser.username;
                    // @ts-ignore
                    if (freshUser?.credits !== undefined) session.user.credits = freshUser.credits;
                } catch (error: any) {
                    const msg = error?.message || "Unknown error";
                    // Treat all DB errors in session sync as warnings to prevent console spam
                    console.warn("Session Sync WARN:", msg);

                    // Fallback to token values if DB fails
                    // @ts-ignore
                    session.user.role = token.role;
                }
            }
            return session;
        }
    },
    events: {
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

                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { username: uniqueName }
                });
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

                // --- OTP LOGIN FLOW ---
                if (credentials.otp) {
                    const otp = credentials.otp as string;

                    const token = await prisma.verificationToken.findFirst({
                        where: {
                            identifier: identifier,
                            token: otp
                        }
                    });

                    if (!token) {
                        throw new Error("Invalid code");
                    }

                    if (new Date() > token.expires) {
                        throw new Error("Code expired");
                    }

                    // Find User
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: identifier },
                                { username: identifier } // Handle username as identifier too if needed
                            ]
                        }
                    });

                    if (!user) return null;

                    // Verify User Email
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { emailVerified: new Date() },
                    });

                    // Consume Token
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
                    const user = await prisma.user.findFirst({
                        where: {
                            OR: [
                                { email: { equals: identifier, mode: 'insensitive' } },
                                { username: { equals: identifier, mode: 'insensitive' } }
                            ]
                        }
                    });

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
                    const errMessage = (e as any).message;
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
        })] : []),
        ...(process.env.AUTH_GITHUB_ID && !process.env.AUTH_GITHUB_ID.includes("placeholder") ? [GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        })] : []),
    ],
})