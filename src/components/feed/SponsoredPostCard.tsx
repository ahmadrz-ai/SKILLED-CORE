"use client";

import React, { useState } from "react";
import { ThumbsUp, Eye, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  initialViews = 340,
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

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800/80 py-5 hover:shadow-md transition-all duration-300 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3 overflow-hidden">
      {/* Premium Top Multi-color Gradient Border Line to wow the user */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header (No handles, no follow buttons, self-identifies as sponsored) */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {sponsorLogoUrl ? (
            <img
              src={sponsorLogoUrl}
              alt={sponsorName}
              className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner flex-shrink-0">
              {sponsorName.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111827] dark:text-white text-sm hover:text-[#6366F1] transition-colors leading-none">
                {sponsorName}
              </span>
              <span title="Verified Sponsor">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {sponsorCategory}
            </span>
          </div>
        </div>

        {/* Dynamic Glowing SPONSORED/AD Tag */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-full select-none shadow-sm animate-pulse">
            Ad
          </span>
        </div>
      </div>

      {/* Post Text Content */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-[#111827] dark:text-white mb-1.5 leading-snug">
          {title}
        </h4>
        <p className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {/* Ad Image Preview Cover */}
      {imageUrl && (
        <div 
          onClick={handleAction}
          className="mb-4 rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-slate-800/80 cursor-pointer relative group/image max-h-[300px]"
        >
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover/image:scale-[1.01] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-slate-950/0 group-hover/image:bg-slate-950/5 transition-colors duration-300 flex items-center justify-center">
            <span className="bg-white/90 dark:bg-slate-900/90 text-xs font-bold text-[#111827] dark:text-slate-100 px-3.5 py-2 rounded-full shadow-lg opacity-0 group-hover/image:opacity-100 transform translate-y-2 group-hover/image:translate-y-0 transition-all duration-300 flex items-center gap-1.5 border border-slate-100/20">
              Visit Sponsor <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Footer / Interaction Bar */}
      <div className="flex items-center justify-between border-t border-[#F3F4F6] dark:border-slate-800/60 pt-3.5 mt-2">
        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200",
              liked ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5 transition-transform duration-200", liked && "scale-110 fill-indigo-600/10")} />
            <span>{likesCount}</span>
          </button>

          {/* Ad Views/Impressions Count */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Eye className="w-3.5 h-3.5" />
            <span>{initialViews} Views</span>
          </div>
        </div>

        {/* Interactive CTA Link Button */}
        <Button
          size="sm"
          onClick={handleAction}
          className="text-xs h-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1 border-0"
        >
          <span>{ctaText}</span>
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {/* Decorative Subtle Glowing Background Blur */}
      <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[35px] rounded-full pointer-events-none" />
    </div>
  );
}
