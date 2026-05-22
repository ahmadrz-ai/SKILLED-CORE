import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApplyButton from "./ApplyButton";
import { Building2, MapPin, DollarSign, Clock, Globe, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// FIX-014: Dynamic SEO metadata per job
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const job = await prisma.job.findUnique({
        where: { id: resolvedParams.id },
        include: { company: true }
    });

    if (!job) return { title: "Job Not Found | SkilledCore" };

    return {
        title: `${job.title} at ${job.company.name} | SkilledCore`,
        description: job.description.slice(0, 160),
        openGraph: {
            title: `${job.title} — ${job.company.name}`,
            description: `${job.type} · ${job.location}`,
            type: "website",
        },
    };
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const resolvedParams = await params;
    const currentUserId = session?.user?.id;

    const job = await prisma.job.findUnique({
        where: { id: resolvedParams.id },
        include: {
            company: true,
            applications: {
                where: { userId: currentUserId }
            }
        }
    });

    if (!job) {
        notFound();
    }

    const hasApplied = job.applications.length > 0;
    const timePosted = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

    // FIX-014: JSON-LD JobPosting schema for Google Jobs integration
    const expiryDate = new Date(job.createdAt);
    expiryDate.setDate(expiryDate.getDate() + 60); // 60-day expiry estimate

    const jobPostingSchema = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description,
        "datePosted": job.createdAt.toISOString(),
        "validThrough": expiryDate.toISOString(),
        "employmentType": job.type === 'Full-time' ? 'FULL_TIME'
            : job.type === 'Part-time' ? 'PART_TIME'
            : job.type === 'Contract' ? 'CONTRACTOR'
            : 'OTHER',
        "hiringOrganization": {
            "@type": "Organization",
            "name": job.company.name,
            "sameAs": job.company.website || `https://skilledcore.com/company/${job.company.id}`,
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location,
                "addressCountry": "US"
            }
        },
        "jobLocationType": job.workplaceType === 'Remote' ? "TELECOMMUTE" : undefined,
        ...(job.salaryMin && job.salaryMax ? {
            "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": job.currency || "USD",
                "value": {
                    "@type": "QuantitativeValue",
                    "minValue": job.salaryMin,
                    "maxValue": job.salaryMax,
                    "unitText": "YEAR"
                }
            }
        } : {}),
    };

    return (
        <>
            {/* FIX-014: JSON-LD injected in page head */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
            />

            <div className="max-w-4xl mx-auto py-8 px-4">
                <Link href="/jobs" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
                </Link>

                {/* Header */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm mb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-3xl font-bold text-white overflow-hidden">
                            {job.company.logo
                                ? <img src={job.company.logo} alt={`${job.company.name} logo`} className="w-full h-full object-cover rounded-xl" />
                                : job.company.name.charAt(0)
                            }
                        </div>

                        <div className="flex-1 space-y-2">
                            <h1 className="text-3xl font-bold text-white">{job.title}</h1>
                            <div className="flex items-center text-zinc-400 gap-4 flex-wrap text-sm">
                                <div className="flex items-center">
                                    <Building2 className="w-4 h-4 mr-2" />
                                    {job.company.name}
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {job.location}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    {timePosted}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <ApplyButton jobId={job.id} initialHasApplied={hasApplied} />
                            {job.externalUrl && (
                                <a
                                    href={job.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-center text-sm text-zinc-500 hover:text-violet-400 flex items-center justify-center"
                                >
                                    Open Original Post <Globe className="w-3 h-3 ml-1" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-3 mt-8 border-t border-white/5 pt-6 flex-wrap">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-zinc-300 border border-white/5">{job.type}</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-zinc-300 border border-white/5">{job.workplaceType}</span>
                        {job.experienceLevel && (
                            <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-zinc-300 border border-white/5">{job.experienceLevel}</span>
                        )}
                        {job.salaryMin && job.salaryMax && (
                            <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20 flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {(job.salaryMin / 1000).toFixed(0)}k - {(job.salaryMax / 1000).toFixed(0)}k/yr
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-white">Job Description</h2>
                            <div className="prose prose-invert max-w-none text-zinc-400">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {job.description}
                                </ReactMarkdown>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-zinc-900/30 rounded-xl p-6 border border-white/5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.split(',').map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-violet-500/10 text-violet-300 text-xs rounded-lg border border-violet-500/20">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900/30 rounded-xl p-6 border border-white/5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">About the Company</h3>
                            <p className="text-zinc-400 text-sm">{job.company.description || `${job.company.name} is hiring on SkilledCore.`}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
