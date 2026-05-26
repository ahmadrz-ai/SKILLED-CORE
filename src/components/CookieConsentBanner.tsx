"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Consent preference shape ────────────────────────────────────────────────
type ConsentChoice = "granted" | "denied";

interface ConsentPreferences {
    analytics_storage: ConsentChoice;
    ad_storage: ConsentChoice;
    ad_user_data: ConsentChoice;
    ad_personalization: ConsentChoice;
}

const STORAGE_KEY = "skilledcore_consent_v2";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function saveConsent(prefs: ConsentPreferences) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, savedAt: Date.now() }));
    } catch (_) {}
}

function loadSavedConsent(): ConsentPreferences | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Re-ask every 12 months
        if (Date.now() - parsed.savedAt > 365 * 24 * 60 * 60 * 1000) return null;
        return parsed as ConsentPreferences;
    } catch (_) {
        return null;
    }
}

function pushConsent(prefs: ConsentPreferences) {
    if (typeof window === "undefined" || !(window as any).gtag) return;
    (window as any).gtag("consent", "update", prefs);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [prefs, setPrefs] = useState<ConsentPreferences>({
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
    });

    // On mount: check if user has already consented
    useEffect(() => {
        const saved = loadSavedConsent();
        if (saved) {
            // Restore previous consent silently
            pushConsent(saved);
        } else {
            // Show banner after a short delay (feels less abrupt)
            const t = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(t);
        }
    }, []);

    const acceptAll = () => {
        const all: ConsentPreferences = {
            analytics_storage: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
        };
        pushConsent(all);
        saveConsent(all);
        setVisible(false);
    };

    const rejectAll = () => {
        const none: ConsentPreferences = {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
        };
        pushConsent(none);
        saveConsent(none);
        setVisible(false);
    };

    const saveCustom = () => {
        pushConsent(prefs);
        saveConsent(prefs);
        setVisible(false);
    };

    const toggle = (key: keyof ConsentPreferences) => {
        setPrefs((prev) => ({
            ...prev,
            [key]: prev[key] === "granted" ? "denied" : "granted",
        }));
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            aria-modal="true"
            className={cn(
                "fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-2xl px-4",
                "animate-in slide-in-from-bottom-4 fade-in duration-300"
            )}
        >
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mt-0.5">
                        <Cookie className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 leading-snug">
                            We use cookies to improve your experience
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                            SkilledCore uses cookies for analytics and personalisation. You can accept all, reject
                            non-essential cookies, or customise your preferences. Your choice is saved for 12 months.{" "}
                            <a
                                href="/legal/privacy-policy"
                                className="text-indigo-600 hover:underline font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Privacy Policy
                            </a>
                        </p>
                    </div>
                    <button
                        onClick={rejectAll}
                        aria-label="Close and reject all"
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Expandable custom preferences ── */}
                {showDetails && (
                    <div className="px-5 pb-3 border-t border-zinc-100 pt-4 space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                            Customise Preferences
                        </p>

                        {/* Always on */}
                        <ConsentRow
                            label="Essential Cookies"
                            description="Required for the site to function — login sessions, security. Cannot be disabled."
                            enabled={true}
                            locked
                        />
                        {/* Analytics */}
                        <ConsentRow
                            label="Analytics & Performance"
                            description="Helps us understand how you use SkilledCore so we can improve it (Google Analytics)."
                            enabled={prefs.analytics_storage === "granted"}
                            onToggle={() => toggle("analytics_storage")}
                        />
                        {/* Advertising */}
                        <ConsentRow
                            label="Advertising & Personalisation"
                            description="Allows ads to be personalised based on your interests and measures ad effectiveness."
                            enabled={prefs.ad_storage === "granted"}
                            onToggle={() => {
                                const next = prefs.ad_storage === "granted" ? "denied" : "granted";
                                setPrefs((p) => ({
                                    ...p,
                                    ad_storage: next,
                                    ad_user_data: next,
                                    ad_personalization: next,
                                }));
                            }}
                        />
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex flex-wrap items-center gap-2 px-5 pb-5 pt-3">
                    {/* Customise toggle */}
                    <button
                        onClick={() => setShowDetails((v) => !v)}
                        className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-indigo-600 transition-colors mr-auto"
                    >
                        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showDetails ? "Hide" : "Customise"}
                    </button>

                    {/* Reject all */}
                    <button
                        onClick={rejectAll}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150"
                    >
                        Reject All
                    </button>

                    {/* Save custom (only when expanded) */}
                    {showDetails && (
                        <button
                            onClick={saveCustom}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all duration-150"
                        >
                            Save Preferences
                        </button>
                    )}

                    {/* Accept all */}
                    <button
                        onClick={acceptAll}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all duration-150 shadow-sm shadow-indigo-200"
                    >
                        Accept All
                    </button>
                </div>

            </div>
        </div>
    );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ConsentRow({
    label,
    description,
    enabled,
    onToggle,
    locked,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onToggle?: () => void;
    locked?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800">{label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <button
                onClick={locked ? undefined : onToggle}
                disabled={locked}
                aria-checked={enabled}
                role="switch"
                className={cn(
                    "shrink-0 mt-0.5 w-9 h-5 rounded-full transition-all duration-200 relative",
                    enabled
                        ? "bg-indigo-600"
                        : "bg-zinc-200",
                    locked && "opacity-60 cursor-not-allowed"
                )}
            >
                <span
                    className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                        enabled && "translate-x-4"
                    )}
                />
            </button>
        </div>
    );
}
