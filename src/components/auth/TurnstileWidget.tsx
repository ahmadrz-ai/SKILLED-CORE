"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // test key fallback

/** Cloudflare Turnstile widget. Calls onVerify with the token (or '' when it expires). */
export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!document.querySelector('script[src*="turnstile"]')) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const renderWidget = () => {
            if (containerRef.current && (window as any).turnstile && !widgetIdRef.current) {
                widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: (token: string) => onVerify(token),
                    'expired-callback': () => onVerify(''),
                    theme: 'light',
                    size: 'flexible',
                });
            }
        };

        const interval = setInterval(() => {
            if ((window as any).turnstile) {
                clearInterval(interval);
                renderWidget();
            }
        }, 200);

        return () => {
            clearInterval(interval);
            if (widgetIdRef.current && (window as any).turnstile) {
                try { (window as any).turnstile.remove(widgetIdRef.current); } catch {}
                widgetIdRef.current = null;
            }
        };
    }, [onVerify]);

    return <div ref={containerRef} className="mt-1" />;
}
