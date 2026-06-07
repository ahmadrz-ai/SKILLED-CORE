"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { sendConnectionRequest } from "@/app/(app)/network/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    const [connectStatus, setConnectStatus] = useState<'IDLE' | 'LOADING' | 'SENT'>('IDLE');

    if (!promotedUser) return null;

    const handleConnect = async () => {
        setConnectStatus('LOADING');
        try {
            const res = await sendConnectionRequest(promotedUser.id);
            if (res.success) {
                setConnectStatus('SENT');
                toast.success(`Connection request sent to ${promotedUser.name}!`);
            } else {
                setConnectStatus('IDLE');
                toast.error(res.message || "Failed to send connection request.");
            }
        } catch (err) {
            setConnectStatus('IDLE');
            toast.error("Failed to send connection request.");
        }
    };

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 relative overflow-hidden group mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Ad Badge */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-extrabold text-[#6B7280] uppercase tracking-widest bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 rounded">
                    {isSelf ? "YOUR CAMPAIGN" : "PROMOTED"}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#5B35D5] animate-pulse" />
            </div>

            <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 border border-[#E5E7EB] shadow-sm">
                    <AvatarImage src={promotedUser.image || undefined} />
                    <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] font-bold">
                        {promotedUser.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111827] truncate flex items-center gap-1.5 group-hover:text-[#5B35D5] transition-colors">
                        {promotedUser.name}
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    </h3>
                    <p className="text-xs text-[#4B5563] font-medium line-clamp-2 mb-3 leading-normal">
                        {promotedUser.headline || "Seeking new opportunities"}
                    </p>

                    {!isSelf && (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={connectStatus !== 'IDLE'}
                            onClick={handleConnect}
                            className={cn(
                                "text-xs h-7.5 border rounded-full px-4.5 font-bold shadow-sm transition-all duration-200 inline-flex items-center animate-none",
                                connectStatus === 'SENT'
                                    ? "border-[#E5E7EB] text-[#6B7280] bg-[#F9FAFB] cursor-not-allowed"
                                    : "border-[#B4A3F3] text-[#5B35D5] bg-[#EAE6FD] hover:bg-[#D4CCF8] hover:text-[#4A28C9]"
                            )}
                        >
                            {connectStatus === 'LOADING' && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {connectStatus === 'SENT' && <Check className="w-3.5 h-3.5 mr-1.5 text-green-600" />}
                            {connectStatus === 'IDLE' && <UserPlus className="w-3.5 h-3.5 mr-1.5 text-[#5B35D5]" />}
                            
                            {connectStatus === 'LOADING' && "Connecting..."}
                            {connectStatus === 'SENT' && "Pending"}
                            {connectStatus === 'IDLE' && "Connect"}
                        </Button>
                    )}
                    {isSelf && (
                        <div className="text-[10px] text-[#10B981] font-extrabold flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full w-max shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            Active - Reaching 2.5x more recruiters
                        </div>
                    )}
                </div>
            </div>

            {/* Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#5B35D5]/5 blur-[40px] rounded-full pointer-events-none" />
        </div>
    );
}
