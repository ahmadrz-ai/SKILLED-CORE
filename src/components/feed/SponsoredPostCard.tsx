"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SponsoredPostCardProps {
  id: string;
  sponsorName: string;
  sponsorLogoUrl?: string;
  sponsorCategory: string;
  title: string;
  content: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl: string;
  initialLikes?: number;
  initialViews?: number;
}

export function SponsoredPostCard({
  sponsorName,
  sponsorLogoUrl,
  sponsorCategory,
  title,
  content,
  imageUrl,
  ctaText = "Learn More",
  ctaUrl,
  initialLikes = 12,
}: SponsoredPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (liked) {
      setLikesCount((prev) => prev - 1);
      setLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
    }
  };

  const handleAction = () => {
    window.open(ctaUrl, "_blank", "noopener,noreferrer");
  };

  const handleSend = () => {
    navigator.clipboard.writeText(ctaUrl);
    toast.success("Copied sponsor link to clipboard!");
  };

  return (
    <div className="group relative bg-white border border-[#E5E7EB] py-5 hover:shadow-sm transition-all duration-200 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 border border-[#E5E7EB] flex-shrink-0">
          <AvatarImage src={sponsorLogoUrl || undefined} />
          <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-sm">
            {sponsorName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#111827] text-sm leading-none">
                {sponsorName}
              </span>
              <span className="flex items-center text-[#9CA3AF] text-xs leading-none">
                · Sponsored
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#9CA3AF] hover:text-[#6B7280] p-1 rounded hover:bg-[#F3F4F6] transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-[#E5E7EB] text-[#374151] shadow-lg">
                  <DropdownMenuItem
                    onClick={() => toast.success("Noted. We will adjust your feed.")}
                    className="cursor-pointer hover:bg-[#F3F4F6] gap-2 text-sm"
                  >
                    <XCircle className="w-4 h-4 text-[#9CA3AF]" /> Hide Ad
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Text Body */}
          <div className="mt-2 text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
            {title && <span className="font-bold block mb-1 text-[#111827]">{title}</span>}
            {content}
          </div>

          {/* Image / CTA block */}
          {imageUrl && (
            <div
              onClick={handleAction}
              className="mt-3 rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer hover:border-[#6366F1] transition-colors group/ad-media"
            >
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-auto object-cover max-h-[360px]"
              />
              <div className="flex items-center justify-between p-3 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider block font-medium truncate">
                    {sponsorCategory}
                  </span>
                  <span className="text-sm font-semibold text-[#111827] block truncate">
                    {title || ctaText}
                  </span>
                </div>
                <button className="flex-shrink-0 h-8 px-4 text-xs font-bold text-[#6366F1] hover:text-white hover:bg-[#6366F1] border border-[#6366F1] rounded-full transition-all duration-200 flex items-center gap-1">
                  <span>{ctaText}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-[#F3F4F6]">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all font-medium",
                liked
                  ? "text-[#2563EB] bg-[#EFF6FF]"
                  : "text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF]"
              )}
            >
              <ThumbsUp className={cn("w-3.5 h-3.5", liked && "fill-current")} />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={() => toast.info("Comments are disabled for sponsored posts.")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] hover:text-[#059669] hover:bg-[#ECFDF5] transition-all font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>0</span>
            </button>
            <button
              onClick={() => toast.info("Sponsored posts cannot be reposted.")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-all font-medium"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Repost</span>
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

