
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar, User as UserIcon, Share2, Globe, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

interface ProjectPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
    const { projectId } = await params;
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true, description: true }
    });

    if (!project) return { title: "Project Not Found" };

    return {
        title: `${project.title} | Skilled Core`,
        description: project.description?.substring(0, 160) || "View project details on Skilled Core."
    };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { projectId } = await params;
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            user: {
                select: {
                    name: true,
                    username: true,
                    image: true,
                    role: true,
                    headline: true
                }
            }
        }
    });

    if (!project) {
        notFound();
    }

    // Format date
    const dateStr = new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-obsidian text-white relative overflow-hidden font-sans selection:bg-violet-500/30">

            {/* --- Ambient Background --- */}
            {project.imageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={project.imageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-20 blur-[100px] scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
                </div>
            )}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 z-0 pointer-events-none" />

            {/* --- Content --- */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <Link href={`/profile/${project.user.username}`}>
                        <Button variant="ghost" className="pl-0 hover:bg-white/5 text-zinc-400 hover:text-white transition-all group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Profile
                        </Button>
                    </Link>
                    {/* Optional: Share Button could go here */}
                </div>

                {/* Hero Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left: Image (Main Visual) - Spans 7 cols */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-zinc-900 aspect-video">
                            {project.imageUrl ? (
                                <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                    <Sparkles className="w-12 h-12 text-zinc-600 opacity-50" />
                                </div>
                            )}

                            {/* Shiny border effect */}
                            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: Info & Context - Spans 5 cols */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-8 lg:py-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm font-mono text-violet-400 tracking-wider uppercase">
                                <span className="px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> {dateStr}
                                </span>
                                <span className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Public Project
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black font-heading leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 drop-shadow-sm">
                                {project.title}
                            </h1>
                        </div>

                        {/* Creator Mini-Card */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-white/20">
                                {project.user.image ? (
                                    <img src={project.user.image} alt={project.user.username || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-full h-full p-2 text-zinc-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">Designed by</p>
                                <Link href={`/profile/${project.user.username}`} className="font-bold text-white hover:underline decoration-violet-500 underline-offset-4">
                                    {project.user.name}
                                </Link>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            {project.link ? (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full h-14 text-base bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] transition-all border border-violet-400/20">
                                        Visit Live Project <ExternalLink className="w-5 h-5 ml-2" />
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled className="w-full h-14 bg-zinc-800 text-zinc-500 font-bold rounded-xl cursor-not-allowed border border-white/5">
                                    No Live Link
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-12 border-t border-white/5">
                    <div className="md:col-span-3">
                        <h3 className="text-xl font-bold text-white mb-2 font-heading">About the Project</h3>
                        <p className="text-zinc-500 text-sm">Detailed overview and objectives.</p>
                    </div>
                    <div className="md:col-span-9">
                        <div className="prose prose-invert prose-lg max-w-none text-zinc-300 leading-relaxed bg-zinc-900/30 p-8 rounded-2xl border border-white/5 shadow-inner">
                            {project.description ? (
                                <p className="whitespace-pre-wrap">{project.description}</p>
                            ) : (
                                <p className="italic text-zinc-600">No detailed description has been provided for this project.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
