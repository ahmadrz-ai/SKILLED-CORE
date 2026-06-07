"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ShieldCheck, Search, ArrowRight, CheckCircle2, XCircle,
  BadgeCheck, Brain, Target, Zap, TrendingUp,
} from "lucide-react";
import { LandingNavbar } from "./LandingNavbar";
import { LandingFooter } from "./LandingFooter";

type Audience = "candidate" | "recruiter";

/* ────────────────────────────────────────────────────────────────────────────
   Audience content — "What / Why / How" + pain points, per audience.
   ──────────────────────────────────────────────────────────────────────────── */
const CONTENT: Record<Audience, {
  badge: string;
  headline: string;
  sub: string;
  ctaHref: string;
  ctaLabel: string;
  pains: { icon: any; title: string; body: string }[];
  what: string;
  why: { icon: any; title: string; body: string }[];
  how: { step: string; title: string; body: string }[];
}> = {
  candidate: {
    badge: "For Candidates",
    headline: "Prove you're a god at your skill — and get discovered.",
    sub: "No more sending resumes into the void and paying to travel to interviews that end in rejection. Take one AI interview, earn a verified skill badge, and let recruiters come to you.",
    ctaHref: "/register?role=candidate",
    ctaLabel: "Get your verified badge — free",
    pains: [
      { icon: XCircle, title: "Resumes get filtered out", body: "80% of resumes are killed by keyword filters before a human ever sees them. Real skill stays invisible." },
      { icon: XCircle, title: "Travel, expense, rejection", body: "You spend money to reach a walk-in interview, only to hear one rejection. The hope breaks every time." },
      { icon: XCircle, title: "No way to prove ability", body: "A PDF can't show what you can actually build. Talk is cheap; you have no badge that says 'I can execute.'" },
    ],
    what: "SkilledCore is an ATS-less talent platform. Instead of applying, you build a verified profile and take a powerful AI interview that issues a skill badge — proof, in your words, that you're elite at a skill you choose.",
    why: [
      { icon: BadgeCheck, title: "A badge that means hired", body: "A verified skill badge increases your chance of getting hired dramatically — recruiters trust evidence over keywords." },
      { icon: Zap, title: "Zero cost, zero travel", body: "Your seat is free. Interviews are online. No expense, no false hope — just real opportunities." },
      { icon: TrendingUp, title: "Recruiters find you", body: "Top talent surfaces on the recruiter dashboard. You don't chase jobs; the right roles find you." },
    ],
    how: [
      { step: "1", title: "Build your profile", body: "Upload your resume — AI structures every skill, project, and experience in seconds." },
      { step: "2", title: "Take the AI interview", body: "A structured technical interview scores your depth across 5 dimensions and issues your badge." },
      { step: "3", title: "Get discovered & hired", body: "Your verified badge makes you visible to recruiters searching for exactly what you can do." },
    ],
  },
  recruiter: {
    badge: "For Recruiters",
    headline: "Find who can build — not who applied.",
    sub: "Stop posting jobs and drowning in hundreds of resumes. Describe who you need in plain language, discover verified talent from a dashboard, and run online interviews. Hire the one — without the noise.",
    ctaHref: "/register?role=recruiter",
    ctaLabel: "Start finding talent",
    pains: [
      { icon: XCircle, title: "Hundreds of resumes, little signal", body: "You filter again and again just to reach a minimum bar — and still can't tell who can actually execute." },
      { icon: XCircle, title: "Bad hires are expensive", body: "The average bad senior engineering hire costs $30,000+. Resume keywords and gut feeling aren't enough." },
      { icon: XCircle, title: "ATS tracks applicants, not ability", body: "Greenhouse and Workday tell you who applied. They can't tell you who can build." },
    ],
    what: "SkilledCore replaces resume screening with execution evidence. You search a dashboard of candidates whose skills are verified by AI interviews, then interview and hire the right person — no ATS, no resume stacks.",
    why: [
      { icon: Search, title: "Search in plain language", body: "“Senior React developer with Python who can design interfaces.” AI ranks candidates by real, verified skill." },
      { icon: ShieldCheck, title: "Evidence, not claims", body: "Every candidate carries dimension-by-dimension AI interview scores — proof of capability before you talk." },
      { icon: Target, title: "Hire the one", body: "Priority-ranked results — Perfect Match, Slight Match, per-skill rows. Reach the right person fast." },
    ],
    how: [
      { step: "1", title: "Describe who you need", body: "Type the role and skills in plain English — no boolean queries, no job posts." },
      { step: "2", title: "Review ranked talent", body: "See verified candidates ranked by match, each with AI interview evidence." },
      { step: "3", title: "Interview & hire", body: "Run an online interview and hire the one person who fits — no travel, no waste." },
    ],
  },
};

/* ────────────────────────────────────────────────────────────────────────────
   Audience toggle (segmented control) — switches content with no page refresh.
   ──────────────────────────────────────────────────────────────────────────── */
function AudienceToggle({ audience, onChange }: { audience: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="inline-flex items-center p-1 rounded-full bg-sc-gray-100 border border-border-default">
      {(["candidate", "recruiter"] as Audience[]).map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          className="relative px-5 sm:px-7 py-2.5 rounded-full text-sm font-semibold transition-colors"
          aria-pressed={audience === a}
        >
          {audience === a && (
            <motion.span
              layoutId="audiencePill"
              className="absolute inset-0 rounded-full bg-sc-purple-600 shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className={audience === a ? "relative text-white" : "relative text-text-secondary hover:text-text-heading"}>
            {a === "candidate" ? "I'm a Candidate" : "I'm a Recruiter"}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Candidate interactive demo — type a skill, generate a verified badge.
   ──────────────────────────────────────────────────────────────────────────── */
function CandidateDemo() {
  const [skill, setSkill] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border-default bg-bg-card p-6 sm:p-8 shadow-sc-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-sc-purple-700 mb-4">
        <Sparkles className="w-4 h-4" /> Try it — claim a skill you're a god at
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && skill.trim()) setIssued(skill.trim()); }}
          placeholder="e.g. React, System Design, Python…"
          className="flex-1 rounded-lg border border-border-input bg-bg-input px-4 py-3 text-sm text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none"
        />
        <button
          onClick={() => skill.trim() && setIssued(skill.trim())}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors"
        >
          Generate badge <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {issued && (
          <motion.div
            key={issued}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mt-6 rounded-xl border border-sc-purple-200 bg-gradient-to-br from-sc-purple-50 to-white p-5"
          >
            <div className="flex items-start gap-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-sc-purple-600 text-white flex-shrink-0">
                <BadgeCheck className="w-7 h-7" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-text-heading">{issued}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-sc-green-100 text-sc-green-700 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  AI-Interview verified · issued by SkilledCore. A verified badge can dramatically increase your chance of getting hired.
                </p>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-4">This is a preview. Take the real AI interview to earn a badge that recruiters can trust.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Recruiter interactive demo — plain-language search → ranked candidates.
   ──────────────────────────────────────────────────────────────────────────── */
const DEMO_CANDIDATES = [
  { name: "Aisha N.", title: "Senior Frontend Engineer", skills: ["react", "typescript", "design", "next.js"], score: 96 },
  { name: "Daniel K.", title: "Full Stack Developer", skills: ["react", "python", "django", "postgres"], score: 91 },
  { name: "Priya S.", title: "ML Engineer", skills: ["python", "pytorch", "ml", "data"], score: 88 },
  { name: "Omar R.", title: "Backend Engineer", skills: ["node", "python", "aws", "api"], score: 84 },
  { name: "Lena M.", title: "Product Designer", skills: ["design", "figma", "ux", "react"], score: 80 },
];
const EXAMPLE_QUERIES = ["Senior React dev with Python", "ML engineer", "Designer who codes"];

function RecruiterDemo() {
  const [query, setQuery] = useState("Senior React dev with Python");
  const [results, setResults] = useState<typeof DEMO_CANDIDATES | null>(null);

  const run = (q: string) => {
    const terms = q.toLowerCase().split(/[^a-z.]+/).filter(t => t.length > 1);
    const scored = DEMO_CANDIDATES
      .map(c => {
        const matches = c.skills.filter(s => terms.some(t => s.includes(t) || t.includes(s))).length;
        return { ...c, _m: matches };
      })
      .filter(c => c._m > 0)
      .sort((a, b) => b._m - a._m || b.score - a.score);
    setResults(scored.length ? scored : DEMO_CANDIDATES.slice(0, 3));
  };

  return (
    <div className="rounded-2xl border border-border-default bg-bg-card p-6 sm:p-8 shadow-sc-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-sc-purple-700 mb-4">
        <Search className="w-4 h-4" /> Try it — describe who you need
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) run(query); }}
          placeholder="e.g. Senior React developer with Python…"
          className="flex-1 rounded-lg border border-border-input bg-bg-input px-4 py-3 text-sm text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none"
        />
        <button
          onClick={() => query.trim() && run(query)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sc-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors"
        >
          Find talent <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {EXAMPLE_QUERIES.map(q => (
          <button key={q} onClick={() => { setQuery(q); run(q); }} className="text-xs font-medium text-text-secondary bg-sc-gray-100 hover:bg-sc-purple-50 hover:text-sc-purple-700 border border-border-default rounded-full px-3 py-1 transition-colors">
            {q}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Ranked matches</div>
            {results.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border-default p-3 hover:border-sc-purple-300 transition-colors"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-sc-purple-100 text-sc-purple-700 font-bold text-sm flex-shrink-0">
                  {c.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-heading truncate">{c.name}</div>
                  <div className="text-xs text-text-secondary truncate">{c.title}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${i === 0 ? "bg-sc-green-100 text-sc-green-700" : "bg-sc-purple-50 text-sc-purple-700"}`}>
                  {i === 0 ? "Perfect match" : "Strong match"}
                </span>
              </motion.div>
            ))}
            <p className="text-xs text-text-tertiary pt-1">A preview of AI Talent Search. The real dashboard ranks verified candidates by actual interview evidence.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────────── */
export default function LandingContent() {
  const [audience, setAudience] = useState<Audience>("candidate");

  // Allow shareable deep-links like /?for=recruiter without a refresh.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("for");
    if (param === "recruiter" || param === "candidate") setAudience(param);
  }, []);

  const changeAudience = (a: Audience) => {
    setAudience(a);
    const url = new URL(window.location.href);
    url.searchParams.set("for", a);
    window.history.replaceState(null, "", url.toString());
  };

  const c = CONTENT[audience];

  return (
    <div className="min-h-screen bg-bg-page text-text-body">
      <LandingNavbar />

      <main className="pt-[72px]">
        {/* HERO + toggle */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
          <div className="flex justify-center mb-8">
            <AudienceToggle audience={audience} onChange={changeAudience} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={audience}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sc-purple-700 bg-sc-purple-50 border border-sc-purple-200 rounded-full px-3 py-1 mb-5">
                <Sparkles className="w-3.5 h-3.5" /> {c.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-heading max-w-3xl mx-auto leading-[1.1]">
                {c.headline}
              </h1>
              <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mt-5 leading-relaxed">
                {c.sub}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <Link href={c.ctaHref} className="inline-flex items-center gap-1.5 rounded-lg bg-sc-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sc-purple-700 transition-colors shadow-sm">
                  {c.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#demo" className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-bg-page px-6 py-3 text-sm font-semibold text-text-heading hover:bg-sc-purple-50 hover:text-sc-purple-800 transition-colors">
                  Try the live demo
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* PAIN POINTS (the problem) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-center text-2xl font-bold text-text-heading mb-2">The problem today</h2>
          <p className="text-center text-sm text-text-secondary mb-8 max-w-xl mx-auto">Why the current way is broken for {audience === "candidate" ? "candidates" : "recruiters"}.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.pains.map((p) => (
              <div key={p.title} className="rounded-xl border border-border-default bg-bg-card p-5">
                <p.icon className="w-5 h-5 text-sc-red-500 mb-3" />
                <h3 className="font-semibold text-text-heading text-sm">{p.title}</h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sc-purple-700"><Brain className="w-4 h-4" /> What is SkilledCore</span>
          <p className="text-xl sm:text-2xl font-semibold text-text-heading mt-3 leading-snug">{c.what}</p>
        </section>

        {/* WHY */}
        <section id="why" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
          <h2 className="text-center text-2xl font-bold text-text-heading mb-8">Why join</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.why.map((w) => (
              <div key={w.title} className="rounded-xl border border-border-default bg-bg-card p-6">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-sc-purple-50 text-sc-purple-600 mb-4"><w.icon className="w-5 h-5" /></span>
                <h3 className="font-semibold text-text-heading">{w.title}</h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
          <h2 className="text-center text-2xl font-bold text-text-heading mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.how.map((h) => (
              <div key={h.step} className="relative rounded-xl border border-border-default bg-bg-card p-6">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-sc-purple-600 text-white font-bold text-sm mb-4">{h.step}</span>
                <h3 className="font-semibold text-text-heading">{h.title}</h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTERACTIVE DEMO */}
        <section id="demo" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sc-purple-700"><Zap className="w-4 h-4" /> Interactive demo</span>
            <h2 className="text-2xl font-bold text-text-heading mt-3">
              {audience === "candidate" ? "See your verified badge in action" : "See AI Talent Search in action"}
            </h2>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={audience} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {audience === "candidate" ? <CandidateDemo /> : <RecruiterDemo />}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl bg-sc-purple-600 px-8 py-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {audience === "candidate" ? "Show the world what you can build." : "Hire the one who can build."}
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-3 max-w-xl mx-auto">
              {audience === "candidate"
                ? "Free seat. AI-verified badge. Get discovered by recruiters who value real skill."
                : "Skip the resume stacks. Search verified talent and hire with confidence."}
            </p>
            <Link href={c.ctaHref} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-sc-purple-700 hover:bg-sc-purple-50 transition-colors mt-6">
              {c.ctaLabel} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
