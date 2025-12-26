"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles, ExternalLink } from "lucide-react";

interface PromotedWidgetProps {
    promotedUser: {
        id: string;
        name: string | null;
        headline: string | null;
        image: string | null;
    } | null;
    isSelf?: boolean;
}

export function PromotedWidget({ promotedUser, isSelf }: PromotedWidgetProps) {
    if (!promotedUser) return null;

    return (
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-violet-500/20 rounded-xl p-4 relative overflow-hidden group mb-4">
            {/* Ad Badge */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-700 px-1.5 py-0.5 rounded">
                    {isSelf ? "YOUR CAMPAIGN" : "PROMOTED"}
                </span>
                <Sparkles className="w-3 h-3 text-violet-400" />
            </div>

            <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 border-2 border-violet-500/30">
                    <AvatarImage src={promotedUser.image || undefined} />
                    <AvatarFallback>{promotedUser.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                        {promotedUser.name}
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {promotedUser.headline || "Seeking new opportunities"}
                    </p>

                    {!isSelf && (
                        <Button size="sm" variant="outline" className="w-full text-xs h-7 border-violet-500/30 text-violet-300 hover:bg-violet-500/10">
                            <UserPlus className="w-3 h-3 mr-1.5" />
                            Connect
                        </Button>
                    )}
                    {isSelf && (
                        <div className="text-[10px] text-green-400 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active - Reaching 2.5x more recruiters
                        </div>
                    )}
                </div>
            </div>

            {/* Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 blur-[40px] rounded-full pointer-events-none" />
        </div>
    );
}
