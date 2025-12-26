"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldAlert, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { reportPost } from "@/app/(app)/feed/actions";

interface ReportPostModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
}

const SEVERITY_LEVELS = [
    { value: "LOW", label: "Low - Minor Nuisance" },
    { value: "MEDIUM", label: "Medium - Standard Violation" },
    { value: "HIGH", label: "High - Serious Offense" },
    { value: "CRITICAL", label: "Critical - Immediate Danger" }
];

const VIOLATION_CATEGORIES = [
    { value: "SPAM", label: "Spam / Misleading" },
    { value: "HARASSMENT", label: "Harassment / Hate Speech" },
    { value: "MISINFORMATION", label: "Misinformation" },
    { value: "NSFW", label: "Nudity / Sexual Content" },
    { value: "VIOLENCE", label: "Violence / Illegal Acts" },
    { value: "OTHER", label: "Other Violation" }
];

export function ReportPostModal({ postId, isOpen, onClose }: ReportPostModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState("LOW");
    const [category, setCategory] = useState("SPAM");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Please provide a title for the report");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("postId", postId);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("severity", severity);
            formData.append("category", category);

            const result = await reportPost(formData);

            if (result.success) {
                toast.success("Report filed. Administrators notified.");
                onClose();
            } else {
                toast.error(result.message || "Failed to submit report");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-red-500/20 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <ShieldAlert className="w-6 h-6" />
                        <span className="text-xs font-mono font-bold tracking-widest uppercase">Moderation Protocol</span>
                    </div>
                    <DialogTitle className="text-xl">Report Content Violation</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Flag this content for administrative review. Serious violations may result in immediate account suspension.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase text-zinc-500 font-bold">Violation Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                                {VIOLATION_CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase text-zinc-500 font-bold">Severity Assessment</Label>
                        <Select value={severity} onValueChange={setSeverity}>
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                                {SEVERITY_LEVELS.map(level => (
                                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase text-zinc-500 font-bold">Subject (Title)</Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Brief summary of the violation..."
                            className="bg-zinc-900 border-white/10 placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase text-zinc-500 font-bold">Additional Details</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Provide context or specific details..."
                            className="bg-zinc-900 border-white/10 min-h-[100px] placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading} className="hover:bg-white/5 hover:text-white text-zinc-400">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {isLoading ? "Filing..." : "Submit Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
