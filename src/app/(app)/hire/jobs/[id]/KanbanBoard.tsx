"use client";

import { useState } from "react";
import { updateApplicationStatus } from "@/app/actions/ats";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, MessageSquare, FileText, CheckCircle2, User, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
type Application = {
    id: string;
    status: string;
    createdAt: Date;
    matchScore: number | null;
    applicant: {
        id: string;
        name: string | null;
        image: string | null;
        email: string | null;
        resumeUrl: string | null;
        username?: string | null;
        headline?: string | null;
    };
};

type ColumnType = "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";

const COLUMNS: { id: ColumnType; label: string; dotColor: string; bgClass: string; textClass: string; borderClass: string }[] = [
    { id: "PENDING", label: "Inbox", dotColor: "bg-[var(--sc-gray-400)]", bgClass: "bg-[var(--bg-secondary-panel)]", textClass: "text-[var(--text-heading)]", borderClass: "border-[var(--border-default)]" },
    { id: "REVIEWED", label: "In Review", dotColor: "bg-[var(--sc-blue-500)]", bgClass: "bg-[var(--sc-blue-50)]/40", textClass: "text-[var(--sc-blue-700)]", borderClass: "border-[var(--sc-blue-100)]" },
    { id: "SHORTLISTED", label: "Shortlisted", dotColor: "bg-[var(--sc-purple-500)]", bgClass: "bg-[var(--sc-purple-50)]/40", textClass: "text-[var(--sc-purple-700)]", borderClass: "border-[var(--sc-purple-200)]" },
    { id: "HIRED", label: "Hired", dotColor: "bg-[var(--sc-green-500)]", bgClass: "bg-[var(--sc-green-50)]/40", textClass: "text-[var(--sc-green-700)]", borderClass: "border-[var(--sc-green-200)]" },
    { id: "REJECTED", label: "Rejected", dotColor: "bg-[var(--sc-red-500)]", bgClass: "bg-[var(--sc-red-50)]/45", textClass: "text-[var(--text-error)]", borderClass: "border-[var(--sc-red-200)]" },
];

export default function KanbanBoard({ job }: { job: any }) {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>(job.applications);

    const handleMove = async (appId: string, newStatus: string) => {
        const previousApplications = [...applications];
        setApplications(prev =>
            prev.map(app => app.id === appId ? { ...app, status: newStatus } : app)
        );

        toast.promise(
            updateApplicationStatus(appId, newStatus).then(result => {
                if (!result.success) {
                    setApplications(previousApplications); // Revert
                    throw new Error("Failed to move candidate");
                }
                return result;
            }),
            {
                loading: "Moving candidate to new stage...",
                success: "Candidate pipeline stage updated!",
                error: "Could not update pipeline stage. Please retry.",
            }
        );
    };

    const getColumnApps = (status: string) => applications.filter(a => a.status === status);

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-230px)] custom-scrollbar items-start text-[var(--text-body)]">
            {COLUMNS.map(col => {
                const columnApps = getColumnApps(col.id);
                return (
                    <div 
                        key={col.id} 
                        className={cn(
                            "min-w-[320px] max-w-[320px] rounded-2xl border flex flex-col max-h-full shadow-sm transition-all duration-200",
                            col.bgClass,
                            col.borderClass
                        )}
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-inherit flex justify-between items-center bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-10 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", col.dotColor)} />
                                <span className={cn("font-bold text-xs uppercase tracking-wider", col.textClass)}>{col.label}</span>
                            </div>
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] px-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
                                {columnApps.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                            {columnApps.length > 0 ? (
                                columnApps.map(app => {
                                    const profileLink = app.applicant.username 
                                        ? `/profile/${app.applicant.username}`
                                        : `/profile/${app.applicant.id}`;

                                    return (
                                        <div 
                                            key={app.id} 
                                            className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-card)] hover:border-[var(--sc-purple-400)] shadow-[var(--shadow-card)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative"
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-2.5">
                                                {/* Candidate Profile Details */}
                                                <Link 
                                                    href={profileLink} 
                                                    className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-95"
                                                    title="View Full Profile"
                                                >
                                                    <Avatar className="w-10 h-10 border border-[var(--border-default)] shrink-0 group-hover:scale-105 transition-transform duration-200">
                                                        <AvatarImage src={app.applicant.image || ""} />
                                                        <AvatarFallback className="bg-[var(--bg-secondary-panel)] text-[var(--text-brand)] font-bold text-sm">
                                                            {app.applicant.name?.[0]?.toUpperCase() || "C"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 text-left">
                                                        <div className="font-bold text-sm text-[var(--text-heading)] truncate flex items-center gap-1 group-hover:text-[var(--text-brand)] transition-colors">
                                                            {app.applicant.name}
                                                            <ChevronRight className="w-3.5 h-3.5 text-[var(--icon-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div className="text-[11px] text-[var(--text-secondary)] font-medium truncate mt-0.5">
                                                            {app.applicant.headline || app.applicant.email}
                                                        </div>
                                                    </div>
                                                </Link>

                                                {/* Dropdown Options */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="text-[var(--icon-default)] hover:text-[var(--icon-strong)] p-1 rounded-md hover:bg-[var(--bg-sidebar-hover)] transition-all cursor-pointer border-none bg-transparent">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[var(--bg-dropdown)] border border-[var(--border-dropdown)] text-[var(--text-body)] shadow-md rounded-xl p-1 w-48 z-50">
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(profileLink)}
                                                            className="hover:bg-[var(--bg-sidebar-hover)] focus:bg-[var(--bg-sidebar-hover)] cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--text-body-strong)] flex items-center gap-2"
                                                        >
                                                            <User className="w-3.5 h-3.5 text-[var(--icon-default)]" /> View Profile
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-[var(--border-subtle)] my-1" />
                                                        {COLUMNS.filter(c => c.id !== col.id).map(targetCol => (
                                                            <DropdownMenuItem
                                                                key={targetCol.id}
                                                                onClick={() => handleMove(app.id, targetCol.id)}
                                                                className="hover:bg-[var(--sc-purple-50)] hover:text-[var(--text-brand)] focus:bg-[var(--sc-purple-50)] focus:text-[var(--text-brand)] cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold flex items-center gap-2"
                                                            >
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", targetCol.dotColor)} />
                                                                Move to {targetCol.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Score Card and Actions */}
                                            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--border-subtle)]">
                                                {app.matchScore ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--sc-green-100)] text-[10px] font-bold font-mono text-[var(--sc-green-700)] border border-[var(--sc-green-200)] shadow-xs">
                                                        <CheckCircle2 className="w-3 h-3 text-[var(--sc-green-600)]" />
                                                        {app.matchScore}% Match
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-bold font-mono text-[var(--text-tertiary)] uppercase tracking-wide">
                                                        Pending Score
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => app.applicant.resumeUrl ? window.open(app.applicant.resumeUrl, '_blank') : toast.error("No resume uploaded")}
                                                        className={cn(
                                                            "p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer bg-transparent", 
                                                            app.applicant.resumeUrl 
                                                                ? "hover:bg-[var(--bg-sidebar-hover)] border-[var(--border-input)] text-[var(--icon-default)] hover:text-[var(--icon-strong)]" 
                                                                : "border-[var(--border-subtle)] text-[var(--text-disabled)] cursor-not-allowed"
                                                        )}
                                                        title="View Resume"
                                                        disabled={!app.applicant.resumeUrl}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/messages?userId=${app.applicant.id}`)}
                                                        className="p-2 border border-[var(--border-input)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg text-[var(--icon-default)] hover:text-[var(--icon-strong)] transition-all flex items-center justify-center cursor-pointer bg-transparent"
                                                        title="Send Message"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-28 border border-dashed border-[var(--border-strong)] rounded-xl flex flex-col items-center justify-center text-[var(--text-tertiary)] px-4 text-center bg-[var(--bg-card)]/25">
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Empty Stage</p>
                                    <p className="text-[10px] text-[var(--text-tertiary)] font-normal mt-1 leading-snug">Drag candidates here to advance their pipeline</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
