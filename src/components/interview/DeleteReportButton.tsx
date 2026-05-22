"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteInterview } from "@/app/actions/interview";
import { toast } from "sonner";

interface DeleteReportButtonProps {
    id: string;
    redirectUrl: string;
}

export function DeleteReportButton({ id, redirectUrl }: DeleteReportButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "CRITICAL: Are you sure you want to permanently delete this AI Interview Report?\n\nThis action cannot be undone and the report will be completely removed from the database and the candidate's profile."
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const res = await deleteInterview(id);
            if (res.success) {
                toast.success("AI Interview Report deleted successfully.");
                router.push(redirectUrl);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete report.");
            }
        } catch (error) {
            console.error("Delete report error:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 hover:border-red-500 text-red-400 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(239,68,68,0.05)] z-10"
        >
            {isDeleting ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                </>
            ) : (
                <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Report
                </>
            )}
        </Button>
    );
}
