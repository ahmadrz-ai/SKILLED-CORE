/**
 * Canonical plan definitions — the single source of truth for pricing, feature flags,
 * and monthly quotas. Read by the landing pricing, the in-app plans page, the recruiter
 * gate, and (Round A cont.) quota enforcement. Keep this pure (no server-only imports)
 * so it can be used on the client too.
 *
 * Billing note: no real charging yet — plans are modelled and gated; Stripe is Round C.
 * Credits are hybrid top-ups consumed for overage once a plan's monthly quota is spent.
 */

export type Audience = "candidate" | "recruiter";
export type PlanCode =
  | "FREE"
  | "ELITE"
  | "CANDIDATE_CUSTOM"
  | "RECRUITER_PRO"
  | "RECRUITER_UNLIMITED";

export type QuotaKey =
  | "interviews"        // AI interviews / month (candidate)
  | "profileBuilds"     // resume → profile builder runs / month (candidate)
  | "talentSearches"    // talent searches / month (recruiter)
  | "interviewBookings"; // interview bookings / month (recruiter)

/** A numeric monthly limit, or "unlimited". Absent key = feature not applicable. */
export type Quota = Partial<Record<QuotaKey, number | "unlimited">>;

export interface PlanFlags {
  verifiedBadge?: boolean;
  advancedAnalytics?: boolean;
  directMessaging?: boolean;
  prioritySupport?: boolean;
  recruiterBadge?: boolean;
  recruiterFeedBadge?: boolean;
  advancedAts?: boolean;
  advancedAiAts?: boolean;
  crossCandidateEval?: boolean;
}

export interface PlanDef {
  code: PlanCode;
  audience: Audience;
  name: string;
  /** Display price, e.g. "$12" or "Let's talk". */
  price: string;
  /** Numeric monthly price for logic/sorting. 0 = free, -1 = custom/contact. */
  priceMonthly: number;
  cadence?: string;
  tag?: string;
  highlight?: boolean;
  features: string[];
  quota: Quota;
  flags: PlanFlags;
  cta: string;
  ctaHref: string;
}

export const PLANS: Record<PlanCode, PlanDef> = {
  FREE: {
    code: "FREE",
    audience: "candidate",
    name: "Free",
    price: "$0",
    priceMonthly: 0,
    cadence: "forever",
    features: [
      "AI Resume → Profile builder (3× / month)",
      "3 AI interviews / month",
      "Standard analytics",
      "Standard support",
      "Unlimited job applications",
    ],
    quota: { interviews: 3, profileBuilds: 3 },
    flags: {},
    cta: "Start free",
    ctaHref: "/register?role=candidate",
  },
  ELITE: {
    code: "ELITE",
    audience: "candidate",
    name: "Elite",
    price: "$12",
    priceMonthly: 12,
    cadence: "/ month",
    tag: "Most popular",
    highlight: true,
    features: [
      "Verified skill badge",
      "10 AI interviews / month",
      "10× profile builder / month",
      "Advanced analytics",
      "Priority visibility — reach more people",
      "Direct messaging",
      "Priority support",
      "Unlimited job applications",
    ],
    quota: { interviews: 10, profileBuilds: 10 },
    flags: { verifiedBadge: true, advancedAnalytics: true, directMessaging: true, prioritySupport: true },
    cta: "Get Elite",
    ctaHref: "/register?role=candidate",
  },
  CANDIDATE_CUSTOM: {
    code: "CANDIDATE_CUSTOM",
    audience: "candidate",
    name: "Custom",
    price: "Let's talk",
    priceMonthly: -1,
    features: [
      "Everything in Elite",
      "Custom interview & builder volume",
      "Cohort / bootcamp options",
      "Dedicated support",
    ],
    quota: { interviews: "unlimited", profileBuilds: "unlimited" },
    flags: { verifiedBadge: true, advancedAnalytics: true, directMessaging: true, prioritySupport: true },
    cta: "Contact us",
    ctaHref: "/support",
  },
  RECRUITER_PRO: {
    code: "RECRUITER_PRO",
    audience: "recruiter",
    name: "Recruiter Pro",
    price: "$79",
    priceMonthly: 79,
    cadence: "/ month",
    features: [
      "Recruiter badge",
      "500 talent searches / month",
      "Unlimited job posts",
      "Advanced ATS",
      "20 interview bookings / month",
      "Priority support",
    ],
    quota: { talentSearches: 500, interviewBookings: 20 },
    flags: { recruiterBadge: true, advancedAts: true, prioritySupport: true },
    cta: "Start hiring",
    ctaHref: "/register?role=recruiter",
  },
  RECRUITER_UNLIMITED: {
    code: "RECRUITER_UNLIMITED",
    audience: "recruiter",
    name: "Recruiter Unlimited",
    price: "$199",
    priceMonthly: 199,
    cadence: "/ month",
    tag: "Best value",
    highlight: true,
    features: [
      "Recruiter badge on profile & feed",
      "Unlimited talent search",
      "Automated cross-candidate AI evaluations",
      "Unlimited job posts",
      "Advanced AI ATS",
      "Unlimited interview bookings",
      "Priority support",
    ],
    quota: { talentSearches: "unlimited", interviewBookings: "unlimited" },
    flags: { recruiterBadge: true, recruiterFeedBadge: true, advancedAiAts: true, crossCandidateEval: true, prioritySupport: true },
    cta: "Go Unlimited",
    ctaHref: "/register?role=recruiter",
  },
};

export const CANDIDATE_PLANS: PlanDef[] = [PLANS.FREE, PLANS.ELITE, PLANS.CANDIDATE_CUSTOM];
export const RECRUITER_PLANS: PlanDef[] = [PLANS.RECRUITER_PRO, PLANS.RECRUITER_UNLIMITED];

export function plansFor(audience: Audience): PlanDef[] {
  return audience === "candidate" ? CANDIDATE_PLANS : RECRUITER_PLANS;
}

/** The monthly limit for a quota key on a plan, or undefined if not applicable. */
export function getQuota(code: PlanCode, key: QuotaKey): number | "unlimited" | undefined {
  return PLANS[code]?.quota[key];
}

export function hasFlag(code: PlanCode, flag: keyof PlanFlags): boolean {
  return !!PLANS[code]?.flags[flag];
}

/** Map a legacy/db plan string to a PlanCode (defaults to FREE for candidates). */
export function normalizePlanCode(raw?: string | null): PlanCode {
  const v = (raw || "").toUpperCase();
  if (v in PLANS) return v as PlanCode;
  // Legacy mappings from the old BASIC/PRO/ULTRA scheme.
  if (v === "ULTRA") return "ELITE";
  if (v === "PRO") return "ELITE";
  return "FREE";
}

/**
 * Friendly, user-facing plan name for ANY raw/legacy/db plan string. Use this
 * everywhere a plan code is shown to a user so internal codes (e.g. "ULTRA")
 * never leak into the UI — "ULTRA" is the legacy code for the "Elite" plan.
 */
export function planDisplayName(raw?: string | null): string {
  switch ((raw || "").toUpperCase()) {
    case "ULTRA":
    case "ELITE": return "Elite";
    case "RECRUITER_UNLIMITED": return "Recruiter Unlimited";
    case "RECRUITER_PRO": return "Recruiter Pro";
    case "PRO": return "Pro";
    case "BASIC":
    case "FREE": return "Free";
    default: return raw || "—";
  }
}

/**
 * Internal tier compatibility layer.
 *
 * The whole app still gates on the legacy plan strings (BASIC/PRO/ULTRA) in ~20 places.
 * To show the new landing plans WITHOUT rewriting all that gating, the Plans page
 * displays plans.ts but stores the mapped legacy tier in user.plan. These helpers map
 * between the two.
 */
export type LegacyTier = "BASIC" | "PRO" | "ULTRA";

const LEGACY_TIER: Partial<Record<PlanCode, LegacyTier>> = {
  FREE: "BASIC",
  ELITE: "ULTRA",          // premium candidate tier
  RECRUITER_PRO: "PRO",
  RECRUITER_UNLIMITED: "ULTRA",
  // CANDIDATE_CUSTOM has no self-serve tier (contact sales).
};

/** The legacy tier to store when a user subscribes to a given plan (undefined = contact-only). */
export function legacyTierFor(code: PlanCode): LegacyTier | undefined {
  return LEGACY_TIER[code];
}

/** Given the user's stored legacy plan + audience, which displayed plan is current. */
export function currentPlanCode(legacyPlan: string | null | undefined, audience: Audience): PlanCode | null {
  const p = (legacyPlan || "BASIC").toUpperCase();
  if (audience === "candidate") {
    if (p === "ELITE" || p === "CANDIDATE_CUSTOM") return p as PlanCode;
    if (p === "PRO" || p === "ULTRA") return "ELITE";
    return "FREE";
  }
  // recruiter
  if (p === "RECRUITER_UNLIMITED" || p === "ULTRA") return "RECRUITER_UNLIMITED";
  if (p === "RECRUITER_PRO" || p === "PRO") return "RECRUITER_PRO";
  return null; // on free / no recruiter plan
}
