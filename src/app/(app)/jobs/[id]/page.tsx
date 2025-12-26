import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import ApplyButton from "./ApplyButton";
import { Building2, MapPin, DollarSign, Clock, Globe, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href="/jobs" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
            </Link>

            {/* Header */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm mb-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-20 h-20 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-3xl font-bold text-white">
                        {job.company.logo ? <img src={job.company.logo} alt="" className="w-full h-full object-cover rounded-xl" /> : job.company.name.charAt(0)}
                    </div>

                    <div className="flex-1 space-y-2">
                        <h1 className="text-3xl font-bold text-white">{job.title}</h1>
                        <div className="flex items-center text-zinc-400 gap-4 flex-wrap">
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
                            <a href={job.externalUrl} target="_blank" rel="noopener noreferrer" className="text-center text-sm text-zinc-500 hover:text-violet-400 flex items-center justify-center">
                                Open Original Post <Globe className="w-3 h-3 ml-1" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Badges */}
                <div className="flex gap-3 mt-8 border-t border-white/5 pt-6">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-sm text-zinc-300 border border-white/5">{job.type}</span>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/20 flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {(job.salaryMin || 0) / 1000}k - {(job.salaryMax || 0) / 1000}k
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Job Description</h3>
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
                </div>
            </div>
        </div>
    );
}
