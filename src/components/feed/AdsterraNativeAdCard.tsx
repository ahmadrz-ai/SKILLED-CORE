"use client";

import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat, Send, MoreHorizontal, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SponsoredPostCard } from "./SponsoredPostCard";

const FALLBACK_ADS = [
  {
    id: "sp-3",
    sponsorName: "SkilledCore Premium",
    sponsorCategory: "Social & Recruitment SaaS",
    title: "Boost Your Recruitment Strategy",
    content:
      "Unlock deep-search filters, direct developer inbox credits, and verified Recruiter Badges to accelerate your hire rates. Get started with SkilledCore Premium today.",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    ctaText: "Upgrade Plan",
    ctaUrl: "/credits",
    initialLikes: 256,
    initialViews: 3210,
  },
  {
    id: "sp-1",
    sponsorName: "Neon",
    sponsorCategory: "Database Cloud",
    title: "Serverless Postgres with Instant Branching",
    content:
      "Stop provisioning servers. Neon scales your database to zero when inactive and gives you instant database branch copies for your preview deployments on Vercel.",
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    ctaText: "Start Free",
    ctaUrl: "https://neon.tech",
    initialLikes: 142,
    initialViews: 1980,
  },
  {
    id: "sp-2",
    sponsorName: "Cloudinary",
    sponsorCategory: "Media Management",
    title: "Image & Video Optimization Made Effortless",
    content:
      "Deliver rich media fast. Automatically optimize, transform, and deliver images and videos customized for any device or screen size using Cloudinary's global CDN.",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    ctaText: "Optimize Media",
    ctaUrl: "https://cloudinary.com",
    initialLikes: 89,
    initialViews: 1240,
  },
];

export function AdsterraNativeAdCard() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(220);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [fallbackAd] = useState(
    () => FALLBACK_ADS[Math.floor(Math.random() * FALLBACK_ADS.length)]
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      if (event.data?.type === "ad-loaded") {
        const height = event.data.height;
        if (typeof height === "number" && height > 50) {
          setIframeHeight(height + 10);
        }
      } else if (event.data?.type === "ad-blocked") {
        setIsBlocked(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (isBlocked) {
    return (
      <SponsoredPostCard
        id={fallbackAd.id}
        sponsorName={fallbackAd.sponsorName}
        sponsorCategory={fallbackAd.sponsorCategory}
        title={fallbackAd.title}
        content={fallbackAd.content}
        imageUrl={fallbackAd.imageUrl}
        ctaText={fallbackAd.ctaText}
        ctaUrl={fallbackAd.ctaUrl}
        initialLikes={fallbackAd.initialLikes}
        initialViews={fallbackAd.initialViews}
      />
    );
  }

  // Iframe src doc: loads Adsterra script inside a sandboxed iframe but renders inside
  // a native-styled post card wrapper (no custom styling injected to match the card).
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: transparent;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 {
            display: block;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div id="container-5cfe1786391f63abaf4e0bdc2103a3e2"></div>

        <script>
          var scriptBlocked = false;

          function reportHeight() {
            if (scriptBlocked) return;
            var container = document.getElementById('container-5cfe1786391f63abaf4e0bdc2103a3e2');
            var height = document.body.scrollHeight || document.documentElement.scrollHeight;
            if (container && container.children.length > 0 && height > 50) {
              window.parent.postMessage({ type: 'ad-loaded', height: height }, '*');
            }
          }

          window.addEventListener('load', reportHeight);
          setInterval(reportHeight, 350);

          // Check for ad-block after 3s
          var adTimeout = setTimeout(function() {
            var container = document.getElementById('container-5cfe1786391f63abaf4e0bdc2103a3e2');
            if (!container || container.children.length === 0) {
              scriptBlocked = true;
              window.parent.postMessage({ type: 'ad-blocked' }, '*');
            }
          }, 3000);
        </script>

        <script
          async="async"
          data-cfasync="false"
          src="https://pl29525465.effectivecpmnetwork.com/5cfe1786391f63abaf4e0bdc2103a3e2/invoke.js"
          onerror="scriptBlocked = true; window.parent.postMessage({ type: 'ad-blocked' }, '*'); clearTimeout(adTimeout);"
          onload="clearTimeout(adTimeout);"
        ></script>
      </body>
    </html>
  `;

  return (
    <div className="group relative bg-white border border-[#E5E7EB] py-5 hover:shadow-sm transition-all duration-200 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3">
      <div className="flex gap-3">
        {/* Avatar — generic "AD" placeholder matching PostCard avatar size */}
        <Avatar className="w-10 h-10 border border-[#E5E7EB] flex-shrink-0">
          <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold text-xs">
            AD
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#111827] text-sm leading-none">
                Sponsored
              </span>
              <span className="flex items-center text-[#9CA3AF] text-xs leading-none">
                · Ad
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[#9CA3AF] hover:text-[#6B7280] p-1 rounded hover:bg-[#F3F4F6] transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white border-[#E5E7EB] text-[#374151] shadow-lg"
                >
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

          {/* Adsterra Iframe — fills the post body area */}
          <div className="mt-3 w-full rounded-xl overflow-hidden border border-[#E5E7EB]">
            <iframe
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              style={{ height: `${iframeHeight}px` }}
              className="w-full border-0 bg-transparent overflow-hidden transition-[height] duration-300"
              title="Sponsored Ad"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-[#F3F4F6]">
            <button
              onClick={() => {
                if (liked) {
                  setLiked(false);
                  setLikesCount((p) => p - 1);
                } else {
                  setLiked(true);
                  setLikesCount((p) => p + 1);
                }
              }}
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
              onClick={() => toast.info("Sponsored link copied!")}
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
