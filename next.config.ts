import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["bcryptjs", "pdf-parse"],

    // FIX-015: Enable WebP image optimization
    images: {
        formats: ["image/webp", "image/avif"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
        remotePatterns: [
            { protocol: "https", hostname: "**.uploadthing.com" },
            { protocol: "https", hostname: "utfs.io" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "avatars.githubusercontent.com" },
            { protocol: "https", hostname: "res.cloudinary.com" },
        ],
    },

    // FIX-016: Security headers on all responses
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    // FIX-016: Prevent clickjacking
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    // FIX-016: Prevent MIME-type sniffing
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    // FIX-016: Control referrer information
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    // FIX-016: HSTS — force HTTPS for 1 year, include subdomains
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains; preload",
                    },
                    // FIX-016: Limit browser API access (no location, no camera except interview)
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(self), geolocation=(), payment=()",
                    },
                    // FIX-016: Content Security Policy
                    // NOTE: 'unsafe-inline' for styles is required by Tailwind CSS v4 + shadcn
                    // Tighten nonces when moving to production CSP enforcement
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https: http:",
                            "media-src 'self' blob:",
                            "connect-src 'self' https://*.uploadthing.com https://utfs.io https://challenges.cloudflare.com https://*.cloudinary.com",
                            "frame-src https://challenges.cloudflare.com",
                            "worker-src 'self' blob:",
                        ].join("; "),
                    },
                ],
            },
        ];
    },

    // FIX-015: Reduce bundle size — enable experimental optimizations
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "framer-motion",
        ],
    },
};

export default nextConfig;
