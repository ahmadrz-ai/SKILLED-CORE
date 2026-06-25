'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    MapPin, Users, Globe, Building2, Share2,
    CheckCircle2, Briefcase, Calendar, Pencil, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import JobCard, { JobProps } from '@/components/JobCard';
import { updateCompanyProfile } from './actions';

export interface CompanyView {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    logo?: string | null;
    banner?: string | null;
    website?: string | null;
    industry?: string | null;
    location?: string | null;
    foundedYear?: string | null;
    companySize?: string | null;
    techStack: string[];
    verified: boolean;
    jobs: JobProps[];
    people: { id: string; name: string | null; username?: string | null; image?: string | null; headline?: string | null }[];
}

export default function CompanyClient({ company, canEdit = false }: { company: CompanyView; canEdit?: boolean }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'about' | 'jobs' | 'people'>('about');
    const [isFollowing, setIsFollowing] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        tagline: company.tagline || '',
        description: company.description || '',
        website: company.website || '',
        industry: company.industry || '',
        location: company.location || '',
        foundedYear: company.foundedYear || '',
        companySize: company.companySize || '',
        techStack: company.techStack.join(', '),
        logo: company.logo || '',
        banner: company.banner || '',
    });

    const initial = company.name?.charAt(0)?.toUpperCase() || 'C';

    const saveProfile = async () => {
        setSaving(true);
        const res = await updateCompanyProfile(company.id, form);
        setSaving(false);
        if (res.success) {
            toast.success(res.message || 'Saved');
            setEditOpen(false);
            router.refresh();
        } else {
            toast.error(res.message || 'Failed to save');
        }
    };

    const field = (key: keyof typeof form, label: string, opts?: { textarea?: boolean; placeholder?: string }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{label}</label>
            {opts?.textarea ? (
                <textarea
                    value={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={opts?.placeholder}
                    className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-body)] placeholder:text-zinc-400 focus:outline-none focus:border-[var(--sc-purple-500)] h-24 resize-none"
                />
            ) : (
                <input
                    value={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={opts?.placeholder}
                    className="w-full h-10 px-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-body)] placeholder:text-zinc-400 focus:outline-none focus:border-[var(--sc-purple-500)]"
                />
            )}
        </div>
    );

    const share = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : `/company/${company.slug}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Company link copied');
        } catch {
            toast.error('Could not copy link');
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-[var(--text-body)] pb-20 relative font-sans">

            {/* HERO BANNER */}
            <div className="relative h-60 md:h-72 w-full overflow-hidden rounded-t-2xl bg-gradient-to-r from-[var(--sc-purple-700)] to-[var(--sc-purple-500)]">
                {company.banner && (
                    <Image src={company.banner} alt={`${company.name} banner`} fill className="object-cover" sizes="100vw" />
                )}
                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute top-6 left-6 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 rounded-lg min-h-[36px] flex items-center px-3 gap-1">
                        ← Back
                    </Button>
                </div>

                <div className="absolute top-6 right-6 z-10 flex gap-2">
                    <Button variant="ghost" size="icon" onClick={share} className="text-white hover:bg-white/10 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 relative -mt-24">

                {/* HEADER IDENTITY */}
                <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                    {/* Logo */}
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-[var(--bg-card)] shadow-md flex items-center justify-center text-4xl font-black text-white relative z-10 shrink-0 overflow-hidden bg-gradient-to-tr from-[var(--sc-purple-600)] to-[var(--sc-purple-400)]">
                        {company.logo ? (
                            <Image src={company.logo} alt={company.name} fill className="object-cover" sizes="128px" />
                        ) : (
                            initial
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pb-1 text-left">
                        <h1 className="text-2xl font-bold font-heading text-[var(--text-heading)] flex items-center gap-2.5 leading-none">
                            {company.name}
                            {company.verified && (
                                <CheckCircle2 className="w-5 h-5 text-[var(--sc-purple-600)]" />
                            )}
                        </h1>
                        {company.tagline && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1.5 font-medium">{company.tagline}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-tertiary)] mt-3 font-semibold uppercase tracking-wide">
                            {company.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {company.location}</span>}
                            {company.companySize && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {company.companySize} Employees</span>}
                            {company.foundedYear && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Founded {company.foundedYear}</span>}
                            {company.website && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {company.website.replace(/^https?:\/\//, '')}</span>}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-3 pb-1 w-full md:w-auto flex-shrink-0">
                        {canEdit && (
                            <Button
                                onClick={() => setEditOpen(true)}
                                variant="outline"
                                className="border-[var(--sc-purple-200)] text-[var(--sc-purple-700)] hover:bg-[var(--sc-purple-50)] font-bold text-xs py-2 px-4 rounded-lg select-none shadow-sm flex items-center gap-1.5"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                        )}
                        <Button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={cn(
                                "flex-1 md:flex-none font-bold text-xs py-2 px-4 rounded-lg tracking-wider transition-all select-none",
                                isFollowing
                                    ? "bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)]"
                                    : "bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] text-white border-none shadow-sm"
                            )}
                        >
                            {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                        </Button>
                        {company.website && (
                            <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" className="border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] font-bold text-xs py-2 px-4 rounded-lg select-none shadow-sm">
                                    Visit Site
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* TABS FRAME */}
                <div className="space-y-6">
                    <div className="flex items-center gap-6 border-b border-[var(--border-strong)] px-1 overflow-x-auto">
                        {(['about', 'jobs', 'people'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-3.5 text-xs font-bold tracking-widest transition-all relative uppercase border-none bg-transparent cursor-pointer whitespace-nowrap",
                                    activeTab === tab ? "text-[var(--text-brand)] font-black" : "text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
                                )}
                            >
                                {tab === 'jobs' ? `Jobs (${company.jobs.length})` : tab}
                                {activeTab === tab && (
                                    <motion.div layoutId="activeCompanyTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--sc-purple-600)]" />
                                )}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'about' && (
                            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 text-left">
                                <section className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-6 shadow-sm">
                                    <h2 className="text-sm font-bold text-[var(--text-heading)] font-heading uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-[var(--sc-purple-600)]" />
                                        About
                                    </h2>
                                    <p className="text-sm text-[var(--text-body)] leading-relaxed font-medium whitespace-pre-line">
                                        {company.description || `${company.name} hasn't added a description yet.`}
                                    </p>
                                    {company.industry && (
                                        <p className="text-xs text-[var(--text-tertiary)] mt-4 font-semibold uppercase tracking-wide">
                                            Industry · {company.industry}
                                        </p>
                                    )}
                                </section>

                                {company.techStack.length > 0 && (
                                    <section className="space-y-3">
                                        <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Tech Stack</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {company.techStack.map((tech) => (
                                                <div key={tech} className="px-3 py-1.5 bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[var(--sc-purple-700)] font-semibold rounded-lg text-xs font-mono shadow-xs">
                                                    {tech}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'jobs' && (
                            <motion.div key="jobs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-left">
                                {company.jobs.length > 0 ? (
                                    company.jobs.map((job, idx) => <JobCard key={job.id} job={job} index={idx} />)
                                ) : (
                                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] border-dashed rounded-xl p-8 text-center text-[var(--text-secondary)] shadow-sm">
                                        <Briefcase className="w-8 h-8 text-[var(--icon-muted)] mx-auto mb-3" />
                                        <p className="font-bold text-sm text-[var(--text-heading)]">No Open Roles</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Follow the company to get notified of future openings.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'people' && (
                            <motion.div key="people" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                                {company.people.length > 0 ? (
                                    company.people.map((person) => (
                                        <Link
                                            key={person.id}
                                            href={`/profile/${person.username || person.id}`}
                                            className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4 flex items-center gap-3 shadow-sm hover:border-[var(--border-selected)] transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 shadow-inner bg-[var(--sc-purple-500)] overflow-hidden relative">
                                                {person.image ? (
                                                    <Image src={person.image} alt={person.name || 'Member'} fill className="object-cover" sizes="40px" />
                                                ) : (
                                                    person.name?.charAt(0)?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-[var(--text-heading)] truncate">{person.name}</p>
                                                {person.headline && <p className="text-[10px] text-[var(--text-secondary)] font-semibold truncate mt-0.5">{person.headline}</p>}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="sm:col-span-3 bg-[var(--bg-card)] border border-[var(--border-card)] border-dashed rounded-xl p-8 text-center text-[var(--text-secondary)] shadow-sm">
                                        <Users className="w-8 h-8 text-[var(--icon-muted)] mx-auto mb-3" />
                                        <p className="font-bold text-sm text-[var(--text-heading)]">No team members yet</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* EDIT MODAL (owners / admins only) */}
            <AnimatePresence>
                {editOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                        onClick={() => !saving && setEditOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--bg-modal)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-black text-[var(--text-heading)] tracking-tight">Edit company profile</h3>
                                <button onClick={() => !saving && setEditOpen(false)} className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-sidebar-hover)] transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {field('tagline', 'Tagline', { placeholder: 'One line about your company' })}
                                {field('description', 'About', { textarea: true, placeholder: 'What does your company do?' })}
                                <div className="grid grid-cols-2 gap-3">
                                    {field('industry', 'Industry', { placeholder: 'e.g. Fintech' })}
                                    {field('location', 'Location', { placeholder: 'e.g. Remote-first' })}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {field('foundedYear', 'Founded', { placeholder: 'e.g. 2021' })}
                                    {field('companySize', 'Company size', { placeholder: 'e.g. 50-100' })}
                                </div>
                                {field('website', 'Website', { placeholder: 'https://yourcompany.com' })}
                                {field('techStack', 'Tech stack (comma-separated)', { placeholder: 'Next.js, React, Postgres' })}
                                {field('logo', 'Logo image URL', { placeholder: 'https://...' })}
                                {field('banner', 'Banner image URL', { placeholder: 'https://...' })}
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border-subtle)]">
                                <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving} className="text-[var(--text-secondary)]">Cancel</Button>
                                <Button onClick={saveProfile} disabled={saving} className="bg-[var(--sc-purple-600)] hover:bg-[var(--sc-purple-700)] text-white font-bold min-w-[110px]">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
