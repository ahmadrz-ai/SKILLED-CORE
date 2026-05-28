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

    const dateStr = new Date(project.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div 
            className="w-full min-h-[calc(100vh-120px)] flex flex-col relative overflow-hidden font-sans rounded-2xl text-[var(--text-body)] shadow-sm border border-[var(--border-card)]"
            style={{ background: "linear-gradient(165deg, var(--bg-page) 0%, var(--bg-secondary-panel) 100%)" }}
        >
            {/* Ambient Background blur */}
            {project.imageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={project.imageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-10 blur-[100px] scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/80 to-transparent" />
                </div>
            )}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.035] z-0 pointer-events-none" />

            {/* Content Container (Pattern C Single Column max-w-3xl) */}
            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-12 pb-20 space-y-10 animate-in fade-in duration-700 w-full text-left">

                {/* Navigation Back */}
                <div className="flex justify-between items-center">
                    <Link href={`/profile/${project.user.username}`}>
                        <Button variant="ghost" className="pl-0 hover:bg-[var(--bg-sidebar-hover)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] font-semibold transition-all group rounded-lg">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Profile
                        </Button>
                    </Link>
                </div>

                {/* Hero Showcase Grid */}
                <div className="grid grid-cols-1 gap-8 items-start">

                    {/* Image Card (Main Visual) */}
                    <div className="space-y-4">
                        <div className="relative rounded-2xl overflow-hidden shadow-md border border-[var(--border-card)] group bg-[var(--bg-secondary-panel)] aspect-video">
                            {project.imageUrl ? (
                                <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-[var(--icon-muted)] opacity-50" />
                                </div>
                            )}
                            <div className="absolute inset-0 border border-[var(--border-subtle)] rounded-2xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Info & Context Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono tracking-wider uppercase">
                                <span className="px-2.5 py-1 rounded-md bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[var(--sc-purple-700)] flex items-center gap-1.5 font-bold shadow-xs">
                                    <Clock className="w-3.5 h-3.5" /> {dateStr}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-[var(--sc-blue-50)] border border-[var(--sc-blue-200)] text-[var(--sc-blue-700)] flex items-center gap-1.5 font-bold shadow-xs">
                                    <Globe className="w-3.5 h-3.5" /> Public Project
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold font-heading leading-tight text-[var(--text-heading)] tracking-tight">
                                {project.title}
                            </h1>
                        </div>

                        {/* Creator Mini-Card */}
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] hover:bg-[var(--bg-sidebar-hover)] transition-colors shadow-xs">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-default)] bg-[var(--bg-card)] shrink-0">
                                {project.user.image ? (
                                    <img src={project.user.image} alt={project.user.username || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-[var(--icon-muted)]" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold mb-0.5">Designed by</p>
                                <Link href={`/profile/${project.user.username}`} className="font-bold text-[var(--text-heading)] hover:underline hover:text-[var(--text-brand)] truncate block text-sm leading-normal">
                                    {project.user.name}
                                </Link>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4">
                            {project.link ? (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button className="w-full h-12 text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] border-none cursor-pointer flex items-center justify-center gap-2">
                                        Visit Live Project <ExternalLink className="w-4 h-4 ml-1" />
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled className="w-full h-12 bg-[var(--btn-primary-bg-disabled)] text-[var(--btn-primary-text-disabled)] font-bold rounded-xl cursor-not-allowed border border-[var(--border-default)]">
                                    No Live Link Available
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 gap-6 pt-8 border-t border-[var(--border-strong)]">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-heading)] font-heading uppercase tracking-wide">About the Project</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Detailed overview and execution outcomes.</p>
                    </div>
                    <div>
                        <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-xl border border-[var(--border-card)] shadow-inner text-sm text-[var(--text-body)] leading-relaxed">
                            {project.description ? (
                                <p className="whitespace-pre-wrap font-medium">{project.description}</p>
                            ) : (
                                <p className="italic text-[var(--text-secondary)] font-bold">No detailed description has been provided for this project.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
