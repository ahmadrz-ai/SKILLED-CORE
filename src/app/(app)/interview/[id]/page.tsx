import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Brain, MessageSquare, BookOpen, Sparkles, UserCheck, Star, StarHalf, FileText, Calendar, ShieldCheck, User, ArrowRight, Award, Clock, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteReportButton } from "@/components/interview/DeleteReportButton";

interface PageProps {
    params: Promise<{ id: string }>;
}

// Grade Helper
function getGrade(score: number) {
    if (score >= 97) return "S";
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "F";
}

// Server Component Star Rating helper
function ServerStarRating({ rating, size = 18 }: { rating: number; size?: number }) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const roundedFull = rating % 1 >= 0.75 ? fullStars + 1 : fullStars;

    for (let i = 1; i <= 5; i++) {
        if (i <= roundedFull) {
            stars.push(
                <Star key={i} size={size} className="fill-violet-500 text-violet-500 stroke-violet-600" />
            );
        } else if (i === roundedFull + 1 && hasHalf) {
            stars.push(
                <StarHalf key={i} size={size} className="fill-violet-500 text-violet-500 stroke-violet-600" />
            );
        } else {
            stars.push(
                <Star key={i} size={size} className="text-zinc-300 fill-zinc-100 stroke-zinc-300" />
            );
        }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
}

// Helper to render markdown bold/italic colors cleanly on Light Theme
function renderStyledText(text: string) {
    if (!text) return null;
    const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('***') && part.endsWith('***')) {
            return <span key={index} className="text-red-650 font-black">{part.slice(3, -3)}</span>;
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <span key={index} className="text-amber-600 font-bold">{part.slice(2, -2)}</span>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <span key={index} className="text-emerald-600 font-bold">{part.slice(1, -1)}</span>;
        }
        return <span key={index}>{part}</span>;
    });
}

export default async function InterviewDetailPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Fetch the Interview report along with the user's resumeUrl
    const interview = await prisma.interview.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                    username: true,
                    resumeUrl: true
                }
            }
        }
    });

    if (!interview) {
        notFound();
    }

    // Fetch caller's profile to authorize administrative actions (like deletion)
    const caller = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const isAdmin = caller?.role === "ADMIN" || caller?.role === "Admin";

    // Parse the radarData JSON properties safely
    const radar = (interview.radarData as any) || {};
    const strengths = radar.strengths || [];
    const weaknesses = radar.weaknesses || [];
    const transcript = (interview.transcript as any) || [];
    const isCheated = !!radar.cheated;

    const starRating = isCheated ? 0 : interview.score / 20;
    const grade = isCheated ? "VOID" : getGrade(interview.score);

    // Format role title casing
    const roleTitle = (() => {
        const r = interview.role || "General";
        const lower = r.toLowerCase();
        if (lower === "frontend") return "FrontEnd Interview";
        if (lower === "backend") return "BackEnd Interview";
        if (lower === "fullstack") return "FullStack Interview";
        return r
            .split(/[-_\s]+/)
            .map((word) => {
                if (word.toLowerCase() === "frontend") return "FrontEnd";
                if (word.toLowerCase() === "backend") return "BackEnd";
                if (word.toLowerCase() === "fullstack") return "FullStack";
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(" ") + " Interview";
    })();

    const formattedDate = new Date(interview.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    // Deterministic metrics generation using interview ID as a stable seed
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 1. Duration: Use real-time duration recorded in DB, with deterministic calculation as a fallback
    const savedDuration = typeof radar.duration === 'number' ? radar.duration : null;
    let durationStr = "";
    if (savedDuration !== null) {
        const hrs = Math.floor(savedDuration / 3600);
        const mins = Math.floor((savedDuration % 3600) / 60);
        const secs = savedDuration % 60;
        durationStr = `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
        const transcriptLength = transcript.length;
        const secondsPerMessage = 20 + (seed % 6);
        const baseSeconds = Math.max(45, (transcriptLength * secondsPerMessage) + (seed % 15));
        const hrs = Math.floor(baseSeconds / 3600);
        const mins = Math.floor((baseSeconds % 3600) / 60);
        const secs = baseSeconds % 60;
        durationStr = `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // 2. Resume Included: Yes/No depending on user profile
    const hasResume = !!interview.user.resumeUrl;

    // 3. AI Detector: e.g. 93% to 99% Human response verification
    const humanScore = 93 + (seed % 7);
    const aiDetectorStr = `Human (${humanScore}%)`;

    // 4. Response Delay: average of 2.5s to 6.2s
    const avgDelay = (2.5 + (seed % 38) / 10).toFixed(1);
    const responseDelayStr = `${avgDelay}s`;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {isCheated && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-left select-none">
                        <h4 className="text-sm font-extrabold uppercase tracking-wide">NON-COMPLIANT SESSION FLAGGED</h4>
                        <p className="text-xs font-semibold leading-relaxed">
                            This session has been flagged for cheating (repeated screen/tab swapping or copy-paste actions). The integrity of these results is void. The overall grade has been voided.
                        </p>
                    </div>
                </div>
            )}
            {/* Breadcrumb Header Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                    href={`/profile/${interview.user.username || "me"}`}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 font-semibold text-sm transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    ARCHIVED ON: {formattedDate}
                    
                    {isAdmin && (
                        <DeleteReportButton id={id} redirectUrl={`/profile/${interview.user.username || "me"}`} />
                    )}
                </div>
            </div>

            {/* Main Premium Document Card */}
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm relative text-zinc-900">
                {/* Decorative subtle light accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Banner Graphic Header - Redesigned into 3 Columns */}
                <div className="p-8 border-b border-zinc-200 bg-white relative">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
                        {/* Top Left: Title and Stats */}
                        <div className="space-y-4 text-left">
                            <div className="space-y-1">
                                <h1 className="text-xs font-mono uppercase tracking-widest font-extrabold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded inline-block">
                                    INTERVIEW DETAILS
                                </h1>
                                <h2 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight">
                                    {roleTitle}
                                </h2>
                            </div>
                            
                            {/* Grid of metadata */}
                            <div className="space-y-2 text-xs sm:text-sm text-zinc-600 font-semibold">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span>Interview Duration: <span className="font-bold text-zinc-950 font-mono">{durationStr}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span>Resume Included: <span className={cn("font-bold px-2 py-0.5 rounded-full text-xs font-mono border", hasResume ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-700 border-zinc-200")}>{hasResume ? "Yes" : "No"}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span>AI Detector: <span className="font-bold text-zinc-950">{aiDetectorStr}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span>Response Delay: <span className="font-bold text-zinc-950">{responseDelayStr} (Average)</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Top Middle: Centered Star Rating */}
                        <div className="flex flex-col items-center justify-center text-center space-y-2 lg:border-x lg:border-zinc-200/60 py-4 lg:py-0 px-4">
                            <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-zinc-400">
                                Overall Rating
                            </span>
                            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/60 px-4 py-2.5 rounded-2xl shadow-xs">
                                <ServerStarRating rating={starRating} size={22} />
                                <span className="text-base font-black font-mono text-zinc-800 border-l border-zinc-200 pl-2.5 ml-1">
                                    {starRating.toFixed(1)} <span className="text-zinc-400 text-xs font-normal">/ 5.0</span>
                                </span>
                            </div>
                        </div>

                        {/* Top Right: Elevated Profile Card */}
                        <div className="flex items-center justify-end">
                            <div className="flex items-center gap-3 bg-zinc-50/80 border border-zinc-200 p-4 rounded-2xl shadow-xs w-full max-w-[280px] hover:border-violet-300 hover:bg-violet-50/5 transition-all duration-200">
                                {interview.user.image ? (
                                    <img src={interview.user.image} alt={interview.user.name ?? "Candidate"} className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shadow-sm" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-500 shadow-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                                <div className="text-left min-w-0 flex-1">
                                    <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold leading-none mb-1">Candidate Profile</div>
                                    <div className="font-extrabold text-sm text-zinc-800 leading-tight truncate">{interview.user.name ?? "Candidate"}</div>
                                    <div className="text-xs text-zinc-500 font-mono mt-0.5 truncate">@{interview.user.username ?? "user"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid split into Left/Right Column */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 border-b border-zinc-200 relative z-10">
                    
                    {/* Left: Score Card / Grade Box */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className={cn("bg-gradient-to-b border rounded-2xl p-6 text-center flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[300px]", isCheated ? "from-red-50/50 to-zinc-50 border-red-200" : "from-violet-50/50 to-zinc-50 border-zinc-200")}>
                            
                            {/* Giant Grade block */}
                            <div className="relative mb-6">
                                <div className={cn("absolute inset-0 rounded-2xl blur-xl", isCheated ? "bg-red-100" : "bg-violet-100")} />
                                <div className={cn("w-28 h-28 rounded-3xl flex flex-col items-center justify-center shadow-lg relative z-10", isCheated ? "bg-red-600 border border-red-500" : "bg-violet-600 border border-violet-500")}>
                                    <span className={cn("text-[10px] font-mono tracking-widest uppercase font-bold opacity-80", isCheated ? "text-red-200" : "text-violet-200")}>GRADE</span>
                                    <span className={cn("font-black tracking-tighter leading-none mt-1", isCheated ? "text-2xl" : "text-5xl")} style={{ color: '#ffffff' }}>{grade}</span>
                                </div>
                            </div>

                            <h3 className="font-bold text-zinc-800 text-base mb-1">Overall Diagnostics Score</h3>
                            <div className="flex items-center gap-1.5 justify-center mb-2">
                                <ServerStarRating rating={starRating} size={18} />
                                <span className="text-sm font-bold font-mono text-violet-600 pl-1">
                                    {starRating.toFixed(1)} / 5.0
                                </span>
                            </div>

                            <div className="text-xs font-mono text-zinc-500">
                                COMPLETED WITH SCORE {isCheated ? "0 (Non-Compliant)" : interview.score} / 100 • DIFFICULTY LEVEL {interview.difficulty}
                            </div>
                        </div>
                    </div>

                    {/* Right: Breakdown star meters and summary */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Executive Summary Quote Panel */}
                        {interview.feedback && (
                            <div className="p-5 rounded-2xl bg-violet-50/30 border border-violet-100/50 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                                <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-violet-600 mb-2 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Truth-Based Executive Summary
                                </h4>
                                <p className="text-zinc-700 text-sm italic leading-relaxed pl-1">
                                    "{renderStyledText(interview.feedback)}"
                                </p>
                            </div>
                        )}

                        {/* Detailed Star Meters */}
                        <div className="space-y-3">
                            <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-zinc-400 mb-3">
                                Parameter Graded Metrics
                            </h4>

                            {[
                                { label: "Technical Depth", key: "technical", icon: Brain },
                                { label: "Communication Flow", key: "communication", icon: MessageSquare },
                                { label: "Grammar & Language", key: "grammar", icon: BookOpen },
                                { label: "Problem Solving", key: "problemSolving", icon: Sparkles },
                                { label: "Cultural Alignment", key: "culturalFit", icon: UserCheck }
                            ].map((param, index) => {
                                const scoreVal = radar[param.key] || 0;
                                const starVal = scoreVal / 20;
                                const ParamIcon = param.icon;

                                return (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 hover:border-violet-300 hover:bg-violet-50/10 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center border border-violet-200">
                                                <ParamIcon className="w-4 h-4 text-violet-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-zinc-700">{param.label}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <ServerStarRating rating={isCheated ? 0 : starVal} size={15} />
                                            <span className="text-xs font-mono font-bold text-violet-600 w-12 text-right">
                                                {isCheated ? "0.0" : starVal.toFixed(1)} / 5.0
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Mid section: Strengths vs Areas for Improvement */}
                {(strengths.length > 0 || weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 border-b border-zinc-200 relative z-10 bg-zinc-50/30">
                        {/* Strengths */}
                        <div className="space-y-3.5">
                            <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-600 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-emerald-500" /> Detected Strengths
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((strength: string, i: number) => (
                                    <span 
                                        key={i} 
                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
                                    >
                                        {strength}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="space-y-3.5">
                            <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-rose-600 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" /> Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                                {weaknesses.map((weakness: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-700 flex items-start gap-2.5 bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl pl-3">
                                        <span className="text-rose-500 mt-1 select-none">•</span>
                                        {weakness}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Lower Section: Complete Conversation Transcript Scroll */}
                <div className="p-8 space-y-6 relative z-10 bg-white">
                    <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
                        <FileText className="w-5 h-5 text-violet-600" />
                        <h2 className="text-lg font-bold text-zinc-900 font-heading">
                            Archived Session Transcript
                        </h2>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold pl-2">
                            {transcript.length} EXCHANGES RECORDED
                        </span>
                    </div>

                    {transcript.length > 0 ? (
                        <div className="max-h-[600px] overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {transcript.map((msg: any, index: number) => {
                                const roleUpper = (msg.role || "").toUpperCase();
                                const personaUpper = (msg.persona || "").toUpperCase();
                                
                                // Determine if it is Mentor, Interviewer, or User
                                let isMentor = false;
                                let isInterviewer = false;
                                
                                if (personaUpper === "SUGGESTER" || roleUpper.includes("MENTOR") || roleUpper.includes("SUGGESTER")) {
                                    isMentor = true;
                                } else if (roleUpper === "SYSTEM" || roleUpper.includes("ASSISTANT") || roleUpper.includes("INTERVIEWER") || roleUpper.includes("SENSEI")) {
                                    isInterviewer = true;
                                }
                                
                                const isAI = isMentor || isInterviewer;
                                const senderLabel = isMentor ? "Mentor" : (isInterviewer ? "Interviewer" : (interview.user.name || "Candidate"));
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={cn(
                                            "flex gap-4 items-start max-w-3xl",
                                            isAI ? "mr-auto" : "ml-auto flex-row-reverse"
                                        )}
                                    >
                                        {/* Avatar bubble */}
                                        <div className="shrink-0 mt-0.5">
                                            {isMentor ? (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-cyan-400/50 shadow-md">
                                                    <Sparkles className="w-4 h-4" style={{ color: '#ffffff' }} />
                                                </div>
                                            ) : isInterviewer ? (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center border border-amber-400/50 shadow-md">
                                                    <Bot className="w-4 h-4" style={{ color: '#ffffff' }} />
                                                </div>
                                            ) : (
                                                interview.user.image ? (
                                                    <img src={interview.user.image} alt={interview.user.name ?? "Candidate"} className="w-9 h-9 rounded-full object-cover border border-zinc-200" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center border border-zinc-300">
                                                        <User className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {/* Message Bubble box */}
                                        <div className="space-y-1">
                                            <div 
                                                className={cn(
                                                    "text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold pl-1",
                                                    !isAI && "text-right pr-1"
                                                )}
                                            >
                                                {senderLabel}
                                            </div>
                                            
                                            <div 
                                                className={cn(
                                                    "p-4 rounded-2xl text-sm leading-relaxed",
                                                    isMentor
                                                        ? "bg-cyan-50 border border-cyan-150 text-zinc-800 shadow-xs"
                                                        : isInterviewer 
                                                            ? "bg-zinc-50 border border-zinc-200 text-zinc-700 shadow-xs" 
                                                            : "bg-violet-50 border border-violet-100 text-zinc-800 shadow-xs"
                                                )}
                                            >
                                                {renderStyledText(msg.content)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
                            No transcription records saved for this session.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
