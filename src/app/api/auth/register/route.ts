import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit as checkDistributedRateLimit } from "@/lib/ratelimit";

// FIX-003: Disposable/temporary email domain blocklist
const BLOCKED_EMAIL_DOMAINS = new Set([
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'spam4.me', 'trashmail.com', 'dispostable.com', 'maildrop.cc',
    'fakeinbox.com', 'filzmail.com', 'throwam.com', 'example.com',
    'test.com', 'skilledcore-test.com', 'temp-mail.org', 'tmpmail.net',
    'mailnull.com', 'mailnesia.com', 'trashmail.at', 'trashmail.io',
    'getairmail.com', 'discard.email', 'spamgourmet.com', 'mytrashmail.com'
]);

// FIX-004: Test account name patterns
const TEST_NAME_PATTERNS = /^(test|testing|testings?|new\s*$|demo|sample|bot|fake|mock|admin\s*$)/i;

// In-memory rate limiter: { ip -> { count, windowStart } }
// In production, replace with Redis (e.g. Upstash) for multi-instance safety
const ipRateLimit = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;         // max attempts per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const existing = ipRateLimit.get(ip);

    if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
        // New window
        ipRateLimit.set(ip, { count: 1, windowStart: now });
        return true; // allowed
    }

    if (existing.count >= RATE_LIMIT_MAX) {
        return false; // blocked
    }

    existing.count++;
    return true;
}

// FIX-003: Validate Cloudflare Turnstile token server-side
async function validateTurnstile(token: string, remoteIp: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // If Turnstile is not configured (e.g., local dev or Vercel without keys), skip validation
    if (!secretKey || secretKey === 'YOUR_TURNSTILE_SECRET_KEY') {
        console.warn('WARN: Turnstile secret key (TURNSTILE_SECRET_KEY) is not configured — skipping validation');
        return true;
    }

    try {
        const formData = new FormData();
        formData.append('secret', secretKey);
        formData.append('response', token);
        formData.append('remoteip', remoteIp);

        const result = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            { method: 'POST', body: formData }
        );
        const data = await result.json();
        return data.success === true;
    } catch (err) {
        console.error('Turnstile validation error:', err);
        return false;
    }
}

export async function POST(req: Request) {
    // FIX-003: Extract client IP for rate limiting
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1';

    // V5: distributed (Upstash) rate limit — works across serverless instances,
    // unlike the in-memory map. Falls back to the in-memory check below if Upstash
    // isn't configured. 5 registrations / hour / IP.
    const dist = await checkDistributedRateLimit("register", ip, 5, 3600);
    if (!dist.success) {
        return NextResponse.json(
            { error: "Too many registration attempts. Please try again later." },
            { status: 429 }
        );
    }

    // FIX-003: in-memory fallback (per-instance) for when Upstash is unset.
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many registration attempts. Please try again later." },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { username, email, password, role, name, turnstileToken } = body;

        // Basic field validation
        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // FIX-003: Validate Turnstile CAPTCHA token
        const turnstileValid = await validateTurnstile(turnstileToken || '', ip);
        if (!turnstileValid) {
            return NextResponse.json(
                { error: "Bot detected. Please complete the security check." },
                { status: 400 }
            );
        }

        // FIX-003: Block disposable email domains
        const emailDomain = email.toLowerCase().split('@')[1];
        if (!emailDomain || BLOCKED_EMAIL_DOMAINS.has(emailDomain)) {
            return NextResponse.json(
                { error: "Please use a valid, non-disposable email address." },
                { status: 400 }
            );
        }

        // B2B: Enforce company email domains for recruiter accounts
        if (role === 'RECRUITER') {
            const PUBLIC_EMAIL_DOMAINS = new Set([
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
                'icloud.com', 'zoho.com', 'protonmail.com', 'mail.com', 'yandex.com',
                'gmx.com', 'live.com', 'msn.com', 'rocketmail.com', 'fastmail.com'
            ]);
            if (emailDomain && PUBLIC_EMAIL_DOMAINS.has(emailDomain)) {
                return NextResponse.json(
                    { error: "Recruiter accounts must register with a valid work/company email address (e.g., name@company.com). Public domains like gmail.com are not permitted." },
                    { status: 400 }
                );
            }
        }

        // FIX-004: Block obvious test/bot account names
        if (TEST_NAME_PATTERNS.test(name.trim())) {
            return NextResponse.json(
                { error: "Please enter your real full name." },
                { status: 400 }
            );
        }

        // Generate username if not provided
        const finalUsername = username?.trim() ||
            `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Check for existing account
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: email, mode: 'insensitive' } },
                    { username: { equals: finalUsername, mode: 'insensitive' } }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email?.toLowerCase() === email.toLowerCase()) {
                return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
            }
            if (existingUser.username?.toLowerCase() === finalUsername.toLowerCase()) {
                return NextResponse.json({ error: "Username already taken. Please choose another." }, { status: 400 });
            }
        }

        // Enforce minimum password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12); // cost factor 12 for production

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                username: finalUsername,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: role || 'CANDIDATE',
            }
        });

        // Welcome the new account (email/password path; OAuth gets it via the
        // createUser auth event).
        try {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: "WELCOME",
                    message: "👋 Welcome to SkilledCore! Complete your profile and earn your first verified skill badge.",
                    resourcePath: "/feed",
                    read: false,
                },
            });
        } catch (e) {
            console.error("WELCOME notify failed:", e);
        }

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, username: user.username }
        });

    } catch (error: any) {
        console.error("Registration error:", error);
        // Do NOT expose internal error messages to the client in production
        const isDev = process.env.NODE_ENV === 'development';
        return NextResponse.json(
            { error: isDev ? `Server Error: ${error.message}` : "Registration failed. Please try again." },
            { status: 500 }
        );
    }
}
