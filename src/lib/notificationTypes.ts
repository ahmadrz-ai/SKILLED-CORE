import type { LucideIcon } from "lucide-react";
import {
    Bell, Star, Heart, MessageSquare, MessageCircle, AtSign, UserPlus, UserCheck, UserSearch,
    Mail, Briefcase, Eye, CalendarClock, CalendarCheck, CalendarX, Clock, Award, ClipboardCheck,
    ThumbsUp, Repeat, ShieldCheck, ShieldAlert, BadgeCheck, CreditCard, Coins, Sparkles, Crown,
    LifeBuoy, CheckCircle2, Megaphone, PartyPopper, Trophy,
} from "lucide-react";

/**
 * Single source of truth for notification types — icon, accent color, human
 * label, logical group, and a default deep-link. Both the topbar bell and the
 * /notifications page render from this map, so a type looks identical
 * everywhere and new types only need to be added in ONE place.
 *
 * `group` powers the inbox filter tabs. `defaultPath` is a fallback used when a
 * notification row has no explicit resourcePath.
 */
export type NotifGroup = "social" | "network" | "messages" | "jobs" | "interview" | "billing" | "system";

export interface NotifMeta {
    label: string;
    Icon: LucideIcon;
    /** CSS custom-property color token, e.g. "var(--sc-red-600)". */
    color: string;
    group: NotifGroup;
    defaultPath?: string;
}

const GOLD = "var(--verified-gold, #d4af37)";

export const NOTIFICATION_TYPES: Record<string, NotifMeta> = {
    // ── Social / feed ────────────────────────────────────────────────
    LIKE:             { label: "Like",              Icon: Heart,         color: "var(--sc-red-600)",    group: "social",   defaultPath: "/feed" },
    POST_LIKE:        { label: "Like",              Icon: Heart,         color: "var(--sc-red-600)",    group: "social",   defaultPath: "/feed" },
    COMMENT:          { label: "Comment",           Icon: MessageSquare, color: "var(--sc-green-700)",  group: "social",   defaultPath: "/feed" },
    COMMENT_REPLY:    { label: "Reply",             Icon: MessageCircle, color: "var(--sc-green-700)",  group: "social",   defaultPath: "/feed" },
    MENTION:          { label: "Mention",           Icon: AtSign,        color: "var(--sc-purple-650)", group: "social",   defaultPath: "/feed" },
    REPOST:           { label: "Repost",            Icon: Repeat,        color: "var(--sc-green-700)",  group: "social",   defaultPath: "/feed" },
    ENDORSEMENT:      { label: "Endorsement",       Icon: ThumbsUp,      color: GOLD,                   group: "social",   defaultPath: "/profile/me" },

    // ── Network ──────────────────────────────────────────────────────
    FOLLOW:             { label: "New follower",       Icon: UserPlus,  color: "var(--sc-blue-700)",   group: "network", defaultPath: "/network" },
    NEW_FOLLOWER:       { label: "New follower",       Icon: UserPlus,  color: "var(--sc-blue-700)",   group: "network", defaultPath: "/network" },
    CONNECTION_REQUEST: { label: "Connection request", Icon: UserPlus,  color: "var(--sc-blue-700)",   group: "network", defaultPath: "/network" },
    CONNECTION_ACCEPTED:{ label: "Connection accepted",Icon: UserCheck, color: "var(--sc-green-700)",  group: "network", defaultPath: "/network" },
    PROFILE_VIEW:       { label: "Profile view",       Icon: Eye,       color: "var(--sc-blue-700)",   group: "network", defaultPath: "/analytics" },

    // ── Messages ─────────────────────────────────────────────────────
    MESSAGE:         { label: "Message",         Icon: MessageSquare, color: "var(--sc-purple-650)", group: "messages", defaultPath: "/messages" },
    MESSAGE_REQUEST: { label: "Message request", Icon: Mail,          color: "var(--sc-purple-650)", group: "messages", defaultPath: "/messages" },

    // ── Jobs ─────────────────────────────────────────────────────────
    APPLICATION:        { label: "Application",        Icon: Briefcase, color: "var(--sc-purple-650)", group: "jobs", defaultPath: "/applications" },
    APPLICATION_VIEWED: { label: "Application viewed", Icon: Eye,       color: "var(--sc-purple-650)", group: "jobs", defaultPath: "/applications" },
    JOB_ALERT:          { label: "Job alert",          Icon: Briefcase, color: "var(--sc-purple-650)", group: "jobs", defaultPath: "/jobs" },
    JOB_MATCH:          { label: "Job match",          Icon: Briefcase, color: "var(--sc-purple-650)", group: "jobs", defaultPath: "/jobs" },

    // ── Interviews / bookings / badges ───────────────────────────────
    BOOKING_REQUEST:   { label: "Interview request",   Icon: CalendarClock, color: "var(--sc-amber-700)",  group: "interview", defaultPath: "/bookings" },
    BOOKING_CONFIRMED: { label: "Interview confirmed", Icon: CalendarCheck, color: "var(--sc-green-700)",  group: "interview", defaultPath: "/bookings" },
    BOOKING_DECLINED:  { label: "Interview declined",  Icon: CalendarX,     color: "var(--sc-red-600)",    group: "interview", defaultPath: "/bookings" },
    BOOKING_CANCELLED: { label: "Interview cancelled", Icon: CalendarX,     color: "var(--sc-gray-500)",   group: "interview", defaultPath: "/bookings" },
    BOOKING_REMINDER:  { label: "Interview reminder",  Icon: CalendarClock, color: "var(--sc-amber-700)",  group: "interview", defaultPath: "/bookings" },
    BOOKING_EXPIRED:   { label: "Request expired",     Icon: CalendarX,     color: "var(--sc-gray-500)",   group: "interview", defaultPath: "/bookings" },
    INTERVIEW_GRADED:  { label: "Interview graded",    Icon: ClipboardCheck,color: "var(--sc-purple-650)", group: "interview", defaultPath: "/profile/me" },
    INTERVIEW_REMINDER:{ label: "Interview reminder",  Icon: Clock,         color: "var(--sc-amber-700)",  group: "interview", defaultPath: "/interview" },
    BADGE_EARNED:      { label: "Badge earned",        Icon: Award,         color: GOLD,                   group: "interview", defaultPath: "/profile/me" },
    HIRED:             { label: "Hired",               Icon: PartyPopper,   color: GOLD,                   group: "interview", defaultPath: "/bookings" },
    SAVED_SEARCH_MATCH:{ label: "New candidate match", Icon: UserSearch,    color: "var(--sc-purple-650)", group: "interview", defaultPath: "/hire" },

    // ── Billing / credits / plan ─────────────────────────────────────
    CREDITS_GRANTED:  { label: "Credits added",     Icon: Coins,      color: "var(--sc-green-700)",  group: "billing", defaultPath: "/credits" },
    CREDITS_LOW:      { label: "Credits low",       Icon: Coins,      color: "var(--sc-amber-700)",  group: "billing", defaultPath: "/credits" },
    PAYMENT_RECEIVED: { label: "Payment received",  Icon: CreditCard, color: "var(--sc-green-700)",  group: "billing", defaultPath: "/billing" },
    PAYMENT_FAILED:   { label: "Payment failed",    Icon: CreditCard, color: "var(--sc-red-600)",    group: "billing", defaultPath: "/billing" },
    PLAN_UPGRADED:    { label: "Plan upgraded",     Icon: Crown,      color: GOLD,                   group: "billing", defaultPath: "/billing" },
    TROPHY:           { label: "Milestone",         Icon: Trophy,     color: GOLD,                   group: "billing", defaultPath: "/profile/me" },

    // ── System / account / security / support ────────────────────────
    SYSTEM:               { label: "System",            Icon: Bell,        color: "var(--sc-amber-700)",  group: "system", defaultPath: "/notifications" },
    ANNOUNCEMENT:         { label: "Announcement",      Icon: Megaphone,   color: "var(--sc-amber-700)",  group: "system", defaultPath: "/notifications" },
    WELCOME:              { label: "Welcome",           Icon: Sparkles,    color: "var(--sc-purple-650)", group: "system", defaultPath: "/feed" },
    ROLE_CHANGE:          { label: "Role change",       Icon: ShieldCheck, color: "var(--sc-amber-700)",  group: "system", defaultPath: "/settings" },
    ACCOUNT_REVIEW:       { label: "Account review",    Icon: ShieldAlert, color: "var(--sc-amber-700)",  group: "system", defaultPath: "/settings" },
    EMAIL_VERIFIED:       { label: "Email verified",    Icon: BadgeCheck,  color: "var(--sc-green-700)",  group: "system", defaultPath: "/settings" },
    VERIFICATION_APPROVED:{ label: "Verification approved", Icon: BadgeCheck, color: "var(--sc-green-700)", group: "system", defaultPath: "/settings" },
    SECURITY_ALERT:       { label: "Security alert",    Icon: ShieldAlert, color: "var(--sc-red-600)",    group: "system", defaultPath: "/settings" },
    NEW_LOGIN:            { label: "New sign-in",       Icon: ShieldAlert, color: "var(--sc-red-600)",    group: "system", defaultPath: "/settings" },
    REPORT_REPLY:         { label: "Support reply",     Icon: LifeBuoy,    color: "var(--sc-red-600)",    group: "system", defaultPath: "/support" },
    REPORT_RESOLVED:      { label: "Report resolved",   Icon: CheckCircle2,color: "var(--sc-green-700)",  group: "system", defaultPath: "/support" },
};

/** Fallback for any unknown/legacy type so the UI never breaks. */
export const FALLBACK_NOTIF_META: NotifMeta = {
    label: "Notification",
    Icon: Star,
    color: "var(--sc-gray-500)",
    group: "system",
};

export function getNotifMeta(type: string): NotifMeta {
    return NOTIFICATION_TYPES[type] ?? FALLBACK_NOTIF_META;
}

/** All registered type keys (handy for admin tooling / docs). */
export const NOTIFICATION_TYPE_KEYS = Object.keys(NOTIFICATION_TYPES);
