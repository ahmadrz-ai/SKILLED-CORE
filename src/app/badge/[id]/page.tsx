import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ShieldCheck, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.skilledcore.com";

async function getBadge(id: string) {
    try {
        return await prisma.verifiedSkill.findUnique({
            where: { id },
            include: { user: { select: { name: true, username: true, image: true, headline: true } } },
        });
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const badge = await getBadge(id);
    if (!badge || badge.status !== "VERIFIED") {
        return { title: "Verified Skill — SkilledCore" };
    }
    const who = badge.user?.name || "A candidate";
    const title = `${who} is verified in ${badge.name} — SkilledCore`;
    const description = `${who} earned a Verified Skill Badge in ${badge.name} (${badge.depthScore}/100) through a proctored AI interview on SkilledCore.`;
    return {
        title,
        description,
        openGraph: { title, description, url: `${APP_URL}/badge/${id}`, type: "profile" },
        twitter: { card: "summary", title, description },
    };
}

export default async function BadgePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const badge = await getBadge(id);

    if (!badge || badge.status !== "VERIFIED") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg-page text-center p-6">
                <ShieldCheck className="w-10 h-10 text-text-tertiary mb-3" />
                <h1 className="text-lg font-bold text-text-heading">Badge not found</h1>
                <p className="text-sm text-text-secondary mt-1">This verification link is invalid or has been revoked.</p>
                <Link href="/" className="mt-5 text-sm font-semibold text-sc-purple-600 hover:underline">Go to SkilledCore</Link>
            </div>
        );
    }

    const who = badge.user?.name || "Candidate";
    const profileHref = `/profile/${badge.user?.username || ""}`;

    return (
        <div className="min-h-screen bg-bg-page flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Image src="/logo.png" alt="SkilledCore" width={24} height={24} unoptimized />
                    <span className="font-bold text-text-heading tracking-tight">SkilledCore</span>
                </div>

                {/* Certificate card */}
                <div className="relative rounded-2xl border border-verified-gold-border bg-bg-card shadow-sc-card overflow-hidden">
                    <div className="h-1.5 w-full bg-verified-gold" />
                    <div className="p-7 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-gold-tint border border-verified-gold-border text-verified-gold text-[11px] font-bold uppercase tracking-wider px-3 py-1">
                            <BadgeCheck className="w-3.5 h-3.5" /> Verified Skill
                        </span>

                        <h1 className="mt-5 text-3xl font-black text-text-heading tracking-tight uppercase">{badge.name}</h1>

                        <div className="mt-3 inline-flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-verified-gold font-mono">{badge.depthScore}</span>
                            <span className="text-sm text-text-secondary">/ 100</span>
                        </div>

                        {/* Candidate */}
                        <Link href={profileHref} className="mt-6 flex items-center justify-center gap-3 group">
                            {badge.user?.image ? (
                                <Image src={badge.user.image} alt={who} width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-border-default" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-sc-purple-100 text-sc-purple-700 flex items-center justify-center font-bold">{who[0]}</div>
                            )}
                            <div className="text-left">
                                <div className="font-semibold text-text-heading group-hover:text-sc-purple-700">{who}</div>
                                {badge.user?.headline && <div className="text-xs text-text-secondary">{badge.user.headline}</div>}
                            </div>
                        </Link>

                        <p className="mt-6 text-xs text-text-secondary leading-relaxed flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-text-success shrink-0" />
                            Verified via a proctored AI interview on {new Date(badge.verifiedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </p>

                        {badge.interviewId && (
                            <Link href={`/interview/${badge.interviewId}`} className="mt-2 inline-block text-xs font-semibold text-sc-purple-600 hover:underline">
                                View the assessment report
                            </Link>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-6 text-center">
                    <Link
                        href="/register?role=candidate"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold text-sm px-5 py-3 transition-colors"
                    >
                        Earn your own verified badge — free <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-[11px] text-text-tertiary mt-3">Prove a skill with one AI interview. No resumes.</p>
                </div>
            </div>
        </div>
    );
}
