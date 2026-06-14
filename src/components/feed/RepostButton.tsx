"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { toast } from "sonner";
import { repostPost } from "@/app/(app)/feed/actions";
import { cn } from "@/lib/utils";

/** Repost toggle with live count + active state (optimistic). */
export function RepostButton({
    postId, initialCount = 0, initialReposted = false,
}: {
    postId: string;
    initialCount?: number;
    initialReposted?: boolean;
}) {
    const [count, setCount] = useState(initialCount);
    const [reposted, setReposted] = useState(initialReposted);
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        const next = !reposted;
        setReposted(next);
        setCount((c) => Math.max(0, c + (next ? 1 : -1)));
        const res = await repostPost(postId);
        setBusy(false);
        if (!res.success) {
            setReposted(!next);
            setCount((c) => Math.max(0, c + (next ? -1 : 1)));
            toast.error(res.message || "Failed to repost.");
        } else {
            setReposted(!!res.reposted);
            if (typeof res.count === "number") setCount(res.count);
            toast.success(res.reposted ? "Reposted to your network." : "Removed repost.");
        }
    };

    return (
        <button
            onClick={toggle}
            disabled={busy}
            className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium cursor-pointer",
                reposted ? "text-[#059669] bg-[#ECFDF5]" : "text-[#6B7280] md:hover:text-[#059669] md:hover:bg-[#ECFDF5]",
            )}
        >
            <Repeat className={cn("w-3.5 h-3.5", reposted && "stroke-[2.5]")} />
            <span>{count > 0 ? count : "Repost"}</span>
        </button>
    );
}
