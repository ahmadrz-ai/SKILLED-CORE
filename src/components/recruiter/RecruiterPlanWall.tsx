'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RECRUITER_PLANS, legacyTierFor } from '@/lib/plans';
import { PaymentModal } from '@/components/credits/PaymentModal';

/**
 * Soft paywall shown on recruiter-only surfaces (talent search, bookings) when a
 * recruiter has no active recruiter plan. They can still use the feed, profile and
 * messaging — this only gates the hiring tools. Activation reuses the existing
 * PaymentModal → PENDING transaction → admin-approval flow (no live gateway yet).
 */
export function RecruiterPlanWall({ feature = 'this feature' }: { feature?: string }) {
    return (
        <div className="min-h-screen px-6 py-10 lg:py-16 max-w-[1100px] mx-auto">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)]">
                    <Lock className="w-6 h-6 text-[var(--sc-purple-600)]" />
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-[var(--text-heading)]">
                    Unlock {feature}
                </h1>
                <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium">
                    Talent search, candidate evaluation and interview bookings are part of a
                    recruiter plan. Choose a plan below to start hiring verified engineers.
                    Your feed, profile and messaging stay free.
                </p>
            </div>

            {/* Recruiter plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl mx-auto">
                {RECRUITER_PLANS.map((plan) => {
                    const legacy = legacyTierFor(plan.code);
                    return (
                        <motion.div
                            key={plan.code}
                            whileHover={{ y: -4 }}
                            className={cn(
                                'relative p-7 rounded-2xl border flex flex-col h-full bg-[var(--bg-card)] transition-all shadow-sm',
                                plan.highlight
                                    ? 'border-[var(--sc-purple-300)] shadow-lg'
                                    : 'border-[var(--border-default)]'
                            )}
                        >
                            {plan.tag && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-[var(--sc-purple-600)] text-white px-3 py-1 rounded-full">
                                    {plan.tag}
                                </span>
                            )}

                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                {plan.name}
                            </h3>
                            <div className="mt-3 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-[var(--text-heading)]">{plan.price}</span>
                                {plan.cadence && (
                                    <span className="text-sm text-[var(--text-secondary)]">{plan.cadence}</span>
                                )}
                            </div>

                            <ul className="mt-5 space-y-2.5 flex-1 border-t border-[var(--border-subtle)] pt-5">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-body)]">
                                        <Check className="w-4 h-4 text-[var(--sc-green-600)] flex-shrink-0 mt-0.5" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6">
                                <PaymentModal
                                    mode="PLAN"
                                    planName={plan.name}
                                    planCode={legacy}
                                    fixedPrice={plan.priceMonthly}
                                >
                                    <button
                                        className={cn(
                                            'w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5',
                                            plan.highlight
                                                ? 'bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] text-white'
                                                : 'border border-[var(--border-default)] text-[var(--text-heading)] hover:bg-[var(--sc-purple-50)] hover:text-[var(--sc-purple-800)]'
                                        )}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {plan.cta}
                                    </button>
                                </PaymentModal>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
                Plan activation is reviewed and approved by an admin. Manage everything any time on the{' '}
                <Link href="/credits" className="text-[var(--sc-purple-600)] font-semibold hover:underline">
                    Plans &amp; Billing
                </Link>{' '}
                page.
            </p>

            <div className="text-center mt-3">
                <Link
                    href="/feed"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-heading)] transition-colors"
                >
                    Continue to your feed <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
