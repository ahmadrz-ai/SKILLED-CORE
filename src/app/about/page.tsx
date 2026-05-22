import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Users, Shield, Brain, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
    title: "About SkilledCore | AI-Native Talent Marketplace",
    description: "Learn about SkilledCore's mission to transform professional recruitment through AI-powered matching, immersive profiles, and a hiring process built for the modern era.",
    openGraph: {
        title: "About SkilledCore",
        description: "AI-native infrastructure for connecting exceptional talent with visionary companies.",
        type: "website",
        url: "https://skilledcore.com/about",
    },
};

// Real stats from database
async function getStats() {
    try {
        const [userCount, jobCount] = await Promise.all([
            prisma.user.count({
                where: {
                    emailVerified: { not: null },
                    role: { in: ['CANDIDATE', 'RECRUITER', 'OPEN_TO_WORK'] }
                }
            }),
            prisma.job.count({ where: { status: 'OPEN' } }),
        ]);
        return { userCount, jobCount };
    } catch {
        return { userCount: 0, jobCount: 0 };
    }
}

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Create Your Profile",
        description: "Build a rich professional profile with your skills, experience, and portfolio. Our AI analyzes your background to understand your unique strengths.",
        icon: Users,
        color: "from-violet-500 to-violet-700"
    },
    {
        step: "02",
        title: "AI Match Engine",
        description: "Our AI match engine surfaces the most relevant jobs and candidates, removing noise and surfacing real opportunities based on skill depth—not just keywords.",
        icon: Brain,
        color: "from-fuchsia-500 to-fuchsia-700"
    },
    {
        step: "03",
        title: "Get Hired or Hire",
        description: "Apply with a single click, complete AI-powered interview practice, or connect directly with verified recruiters and companies. No resume spam.",
        icon: Zap,
        color: "from-teal-500 to-teal-700"
    }
];

const TEAM = [
    {
        initials: "AZ",
        title: "Founder & CEO",
        bio: "Passionate about fixing the broken hiring process with AI-first tooling.",
        color: "from-violet-600 to-fuchsia-600"
    },
    {
        initials: "HE",
        title: "Head of Engineering",
        bio: "Building the systems that power AI-matched hiring at scale.",
        color: "from-teal-600 to-cyan-600"
    },
    {
        initials: "PR",
        title: "Head of Product",
        bio: "Crafting the recruiter and candidate experience from first click to hired.",
        color: "from-amber-600 to-orange-600"
    }
];

const VALUES = [
    { title: "Privacy First", desc: "Ghost Protocol and GDPR-compliant by design. Your data belongs to you.", icon: Shield },
    { title: "Real Matches", desc: "No fake connections or engagement bait. Every feature drives real hiring outcomes.", icon: CheckCircle },
    { title: "AI Augmented", desc: "AI amplifies human judgment — it never replaces the human decision to hire.", icon: Brain },
];

export default async function AboutPage() {
    const { userCount, jobCount } = await getStats();

    return (
        <div className="min-h-screen bg-transparent text-white">
            {/* Hero */}
            <section className="relative py-24 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                        Building the future of hiring
                    </div>
                    <h1 className="text-5xl md:text-7xl font-heading font-black text-white tracking-tight mb-6 leading-tight">
                        Where Talent Meets{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            Opportunity
                        </span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        SkilledCore is an AI-powered recruitment and talent marketplace built to eliminate the noise in hiring.
                        We connect exceptional professionals with companies that deserve them — with privacy, speed, and intelligence at the core.
                    </p>
                </div>
            </section>

            {/* FIX-011: Real stats — no fabricated numbers */}
            {(userCount > 0 || jobCount > 0) && (
                <section className="py-16 px-4 border-y border-white/5 bg-black/20">
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-heading font-black text-white mb-2">
                                {userCount > 0 ? `${userCount}+` : "Early"}
                            </div>
                            <div className="text-zinc-500 text-sm">Verified Members</div>
                        </div>
                        <div>
                            <div className="text-4xl font-heading font-black text-teal-400 mb-2">
                                {jobCount > 0 ? `${jobCount}` : "0"}
                            </div>
                            <div className="text-zinc-500 text-sm">Open Positions</div>
                        </div>
                        <div>
                            <div className="text-4xl font-heading font-black text-violet-400 mb-2">AI</div>
                            <div className="text-zinc-500 text-sm">Powered Matching</div>
                        </div>
                        <div>
                            <div className="text-4xl font-heading font-black text-fuchsia-400 mb-2">0</div>
                            <div className="text-zinc-500 text-sm">Resume Spam</div>
                        </div>
                    </div>
                </section>
            )}

            {/* Mission */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-heading font-black text-white mb-6">Our Mission</h2>
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-4 text-zinc-400 leading-relaxed">
                            <p>
                                The hiring process is broken. Candidates send hundreds of applications into the void.
                                Recruiters sift through mountains of irrelevant CVs. Both sides waste weeks on poor matches.
                            </p>
                            <p>
                                SkilledCore was built to fix this. We use AI to understand the depth of a candidate's skills —
                                not just their job title — and match them with opportunities that are genuinely right for them.
                            </p>
                            <p>
                                For candidates: your profile speaks for itself. Ghost Protocol protects you from your current employer seeing your job search.
                                For recruiters: AI-scored candidates and a clean signal-to-noise ratio means faster, better hires.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {VALUES.map(v => (
                                <div key={v.title} className="flex gap-4 p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                                    <v.icon className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-white font-semibold text-sm">{v.title}</div>
                                        <div className="text-zinc-500 text-sm mt-0.5">{v.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 bg-black/20 border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-heading font-black text-white mb-4">How It Works</h2>
                        <p className="text-zinc-400">Three steps from sign-up to hired.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {HOW_IT_WORKS.map(step => (
                            <div key={step.step} className="relative group">
                                <div className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all h-full">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-xs font-mono text-zinc-600 mb-2">STEP {step.step}</div>
                                    <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-heading font-black text-white mb-4">The Team</h2>
                        <p className="text-zinc-400">A small, focused team on a big mission.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {TEAM.map(member => (
                            <div key={member.initials} className="p-6 bg-zinc-900/40 border border-white/5 rounded-2xl text-center hover:border-violet-500/30 transition-all">
                                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-2xl font-heading font-black text-white mx-auto mb-4`}>
                                    {member.initials}
                                </div>
                                <div className="font-bold text-white mb-1">{member.title}</div>
                                <p className="text-zinc-400 text-sm">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section className="py-24 px-4 text-center border-t border-white/5">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-heading font-black text-white">Get in Touch</h2>
                    <p className="text-zinc-400">
                        Questions, partnerships, or press inquiries — we're a small team and we read every email.
                    </p>
                    <a
                        href="mailto:support@skilledcore.com"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600/10 border border-violet-500/30 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-all"
                    >
                        <Mail className="w-4 h-4" />
                        support@skilledcore.com
                    </a>
                    <div className="pt-4">
                        <Link href="/register">
                            <Button className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 h-12">
                                Join SkilledCore
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
