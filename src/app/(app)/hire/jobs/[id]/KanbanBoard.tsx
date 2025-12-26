"use client";

import { useState } from "react";
import { updateApplicationStatus } from "@/app/actions/ats";
import { useRouter } from "next/navigation";
import { MoreHorizontal, MessageSquare, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner or similar toast
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
    };
};

type ColumnType = "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";

const COLUMNS: { id: ColumnType; label: string; color: string }[] = [
    { id: "PENDING", label: "Inbox", color: "bg-zinc-500" },
    { id: "REVIEWED", label: "In Review", color: "bg-blue-500" },
    { id: "SHORTLISTED", label: "Shortlisted", color: "bg-violet-500" },
    { id: "HIRED", label: "Hired", color: "bg-emerald-500" },
    { id: "REJECTED", label: "Rejected", color: "bg-red-500" },
];

export default function KanbanBoard({ job }: { job: any }) {
    const router = useRouter();
    // Optimistic State
    const [applications, setApplications] = useState<Application[]>(job.applications);

    const handleMove = async (appId: string, newStatus: string) => {
        // Optimistic Update
        setApplications(prev =>
            prev.map(app => app.id === appId ? { ...app, status: newStatus } : app)
        );

        const result = await updateApplicationStatus(appId, newStatus);
        if (!result.success) {
            toast.error("Failed to move candidate");
            // Revert on error (simplified for demo, ideally revert state)
        }
    };

    const getColumnApps = (status: string) => applications.filter(a => a.status === status);

    return (
        <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
            {COLUMNS.map(col => (
                <div key={col.id} className="min-w-[320px] bg-zinc-900/40 rounded-2xl border border-white/5 flex flex-col">
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-10 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", col.color)} />
                            <span className="font-bold text-sm text-zinc-300">{col.label}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/5 text-zinc-500 border-none">{getColumnApps(col.id).length}</Badge>
                    </div>

                    {/* Column Content */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                        {getColumnApps(col.id).map(app => (
                            <div key={app.id} className="bg-black/40 p-4 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src={app.applicant.image || ""} />
                                            <AvatarFallback>{app.applicant.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-bold text-sm text-white">{app.applicant.name}</div>
                                            <div className="text-xs text-zinc-500">{app.applicant.email}</div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-zinc-600 hover:text-white transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                            {COLUMNS.filter(c => c.id !== col.id).map(targetCol => (
                                                <DropdownMenuItem
                                                    key={targetCol.id}
                                                    onClick={() => handleMove(app.id, targetCol.id)}
                                                    className="hover:bg-zinc-800 cursor-pointer"
                                                >
                                                    Move to {targetCol.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                    {app.matchScore ? (
                                        <div className="text-xs font-mono text-emerald-400">
                                            {app.matchScore}% Match
                                        </div>
                                    ) : (
                                        <div className="text-xs font-mono text-zinc-600">
                                            No AI Score
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => app.applicant.resumeUrl ? window.open(app.applicant.resumeUrl, '_blank') : toast.error("No resume uploaded")}
                                            className={cn("p-1.5 rounded-md transition-colors", app.applicant.resumeUrl ? "hover:bg-white/10 text-zinc-500 hover:text-white" : "text-zinc-700 cursor-not-allowed")}
                                            title="View Resume"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/messages?userId=${app.applicant.id}`)}
                                            className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-colors"
                                            title="Message"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
