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
        <div 
            className="w-full min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden font-sans rounded-2xl text-zinc-800 shadow-sm"
            style={{ background: "linear-gradient(165deg, #FAFAFE 0%, #F1EEFF 40%, #EDE9FE 70%, #FAFAFE 100%)" }}
        >
            {/* --- Ambient Background --- */}
            {project.imageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={project.imageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-10 blur-[100px] scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                </div>
            )}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.035] z-0 pointer-events-none" />

            {/* --- Content --- */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4 w-full">

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <Link href={`/profile/${project.user.username}`}>
                        <Button variant="ghost" className="pl-0 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 font-semibold transition-all group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Profile
                        </Button>
                    </Link>
                </div>

                {/* Hero Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* Left: Image (Main Visual) - Spans 7 cols */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-zinc-200 group bg-zinc-55 aspect-video">
                            {project.imageUrl ? (
                                <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                                    <Sparkles className="w-12 h-12 text-zinc-400 opacity-50" />
                                </div>
                            )}

                            {/* Shiny border effect */}
                            <div className="absolute inset-0 border border-zinc-250 rounded-2xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Right: Info & Context - Spans 5 cols */}
                    <div className="lg:col-span-5 flex flex-col justify-center space-y-8 lg:py-4">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tracking-wider uppercase">
                                <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center gap-2 font-bold shadow-sm">
                                    <Clock className="w-3 h-3" /> {dateStr}
                                </span>
                                <span className="px-2.5 py-1 rounded bg-teal-55 border border-teal-100 text-teal-650 flex items-center gap-2 font-bold shadow-sm">
                                    <Globe className="w-3 h-3" /> Public Project
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black font-heading leading-tight text-zinc-900 drop-shadow-sm">
                                {project.title}
                            </h1>
                        </div>

                        {/* Creator Mini-Card */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-zinc-105 overflow-hidden border border-zinc-200">
                                {project.user.image ? (
                                    <img src={project.user.image} alt={project.user.username || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-full h-full p-2 text-zinc-405" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-zinc-450 uppercase tracking-wider mb-0.5 font-bold">Designed by</p>
                                <Link href={`/profile/${project.user.username}`} className="font-bold text-zinc-800 hover:underline hover:text-indigo-600 underline-offset-4">
                                    {project.user.name}
                                </Link>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            {project.link ? (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full h-14 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 duration-100 border-none">
                                        Visit Live Project <ExternalLink className="w-5 h-5 ml-2" />
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled className="w-full h-14 bg-zinc-150 text-zinc-400 font-bold rounded-xl cursor-not-allowed border border-zinc-200">
                                    No Live Link
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-12 border-t border-zinc-200">
                    <div className="md:col-span-3">
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 font-heading">About the Project</h3>
                        <p className="text-zinc-500 text-sm">Detailed overview and objectives.</p>
                    </div>
                    <div className="md:col-span-9">
                        <div className="prose prose-lg max-w-none text-zinc-650 leading-relaxed bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-inner">
                            {project.description ? (
                                <p className="whitespace-pre-wrap">{project.description}</p>
                            ) : (
                                <p className="italic text-zinc-400 font-bold">No detailed description has been provided for this project.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
