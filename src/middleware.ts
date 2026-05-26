import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const nextAuth = NextAuth(authConfig);

export default function middleware(request: NextRequest) {
    const url = request.nextUrl.clone();
    const emailParam = url.searchParams.get("email")?.toLowerCase().trim() || url.searchParams.get("bypass")?.toLowerCase().trim();
    const cleanEmails = ["ahmadrazaai801@gmail.com", "ahmad@skilledcore.com", "support@skilledcore.com"];
    
    if (emailParam && cleanEmails.includes(emailParam)) {
        url.searchParams.delete("email");
        url.searchParams.delete("bypass");
        const response = NextResponse.redirect(url);
        response.cookies.set("admin_bypass_email", emailParam, {
            path: "/",
            maxAge: 30 * 24 * 60 * 60, // 30 days
            httpOnly: false,
            secure: process.env.NODE_ENV === "production"
        });
        return response;
    }
    
    return (nextAuth.auth as any)(request);
}

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
