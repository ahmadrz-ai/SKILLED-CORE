"use client";

import React, { useEffect, useState, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { SponsoredPostCard } from "./SponsoredPostCard";

const FALLBACK_ADS = [
  {
    id: "sp-3",
    sponsorName: "SkilledCore Premium",
    sponsorCategory: "Social & Recruitment SaaS",
    title: "Boost Your Recruitment Strategy",
    content: "Unlock deep-search filters, direct developer inbox credits, and verified Recruiter Badges to accelerate your hire rates. Get started with SkilledCore Premium today.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    ctaText: "Upgrade Plan",
    ctaUrl: "/pricing",
    initialLikes: 256,
    initialViews: 3210
  },
  {
    id: "sp-1",
    sponsorName: "Neon",
    sponsorCategory: "Database Cloud",
    title: "Serverless Postgres with Instant Branching",
    content: "Stop provisioning servers. Neon scales your database to zero when inactive and gives you instant database branch copies for your preview deployments on Vercel.",
    imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    ctaText: "Start Free",
    ctaUrl: "https://neon.tech",
    initialLikes: 142,
    initialViews: 1980
  },
  {
    id: "sp-2",
    sponsorName: "Cloudinary",
    sponsorCategory: "Media Management",
    title: "Image & Video Optimization Made Effortless",
    content: "Deliver rich media fast. Automatically optimize, transform, and deliver images and videos customized for any device or screen size using Cloudinary's global content delivery network.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    ctaText: "Optimize Media",
    ctaUrl: "https://cloudinary.com",
    initialLikes: 89,
    initialViews: 1240
  }
];

export function AdsterraNativeAdCard() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(195);
  const [fallbackAd] = useState(() => FALLBACK_ADS[Math.floor(Math.random() * FALLBACK_ADS.length)]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate that message is from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      if (event.data && event.data.type === "ad-loaded") {
        const height = event.data.height;
        if (typeof height === "number" && height > 50) {
          // Add a small buffer to avoid scrollbars
          setIframeHeight(height + 10);
        }
      } else if (event.data && event.data.type === "ad-blocked") {
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

  // HTML content loaded in iframe to isolate container and styles, supporting multiple ad cards on one page safely
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
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
          /* Custom overrides to force Adsterra native ads to look extremely premium and fit the feed perfectly */
          .adsterra-native-wrapper a,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 a {
            display: flex !important;
            flex-direction: column !important;
            background: rgba(255, 255, 255, 0.8) !important;
            border: 1px solid #E5E7EB !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            padding: 10px !important;
            transition: all 0.25s ease-in-out !important;
            text-decoration: none !important;
            box-sizing: border-box !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
            margin-bottom: 8px !important;
          }
          .dark .adsterra-native-wrapper a,
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 a {
            background: rgba(15, 23, 42, 0.45) !important;
            border-color: rgba(30, 41, 59, 0.8) !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
          }
          .adsterra-native-wrapper a:hover,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 a:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.08) !important;
            border-color: #6366F1 !important;
          }
          .dark .adsterra-native-wrapper a:hover,
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 a:hover {
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15) !important;
            border-color: #818cf8 !important;
          }
          /* Style images to look like high-quality cards */
          .adsterra-native-wrapper img,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 img {
            width: 100% !important;
            height: 145px !important;
            object-fit: cover !important;
            border-radius: 8px !important;
            margin-bottom: 10px !important;
            transition: transform 0.3s ease !important;
          }
          .adsterra-native-wrapper a:hover img,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 a:hover img {
            transform: scale(1.01) !important;
          }
          /* Premium Titles */
          .adsterra-native-wrapper [class*="title"],
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 [class*="title"],
          .adsterra-native-wrapper .title,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 .title {
            font-size: 13.5px !important;
            font-weight: 700 !important;
            color: #1f2937 !important;
            line-height: 1.45 !important;
            margin-bottom: 4px !important;
            font-family: inherit !important;
          }
          .dark .adsterra-native-wrapper [class*="title"],
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 [class*="title"],
          .dark .adsterra-native-wrapper .title,
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 .title {
            color: #f8fafc !important;
          }
          /* Descriptions matching our font weights */
          .adsterra-native-wrapper [class*="desc"],
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 [class*="desc"],
          .adsterra-native-wrapper .description,
          #container-5cfe1786391f63abaf4e0bdc2103a3e2 .description {
            font-size: 11px !important;
            color: #6b7280 !important;
            line-height: 1.35 !important;
            font-family: inherit !important;
          }
          .dark .adsterra-native-wrapper [class*="desc"],
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 [class*="desc"],
          .dark .adsterra-native-wrapper .description,
          .dark #container-5cfe1786391f63abaf4e0bdc2103a3e2 .description {
            color: #94a3b8 !important;
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
            
            // Only report if container has loaded some elements and height is non-trivial
            if (container && container.children.length > 0 && height > 50) {
              window.parent.postMessage({ type: 'ad-loaded', height: height }, '*');
            }
          }
          
          window.addEventListener('load', reportHeight);
          setInterval(reportHeight, 350);
          
          // Theme sync script (immediate and observer based)
          function syncTheme() {
            try {
              var isDark = window.parent.document.documentElement.classList.contains('dark') || 
                           window.parent.document.body.classList.contains('dark');
              if (isDark) {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
              }
            } catch (e) {}
          }
          syncTheme();
          try {
            var observer = new MutationObserver(syncTheme);
            observer.observe(window.parent.document.documentElement, { attributes: true, attributeFilter: ['class'] });
          } catch (e) {}
          
          // Check for ad block / script load failure timeout
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
    <div className="group relative bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800/80 py-5 hover:shadow-md transition-all duration-300 -mx-4 px-4 lg:mx-0 lg:px-5 lg:rounded-xl lg:mb-3 overflow-hidden">
      {/* Premium Gradient Top Line matching SkilledCore's high-end vibe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

      {/* Header identifying as Sponsored */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Ad Network Partner Logo / Generic Advertiser Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0">
            AD
          </div>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#111827] dark:text-white text-sm leading-none">
                Sponsor Content
              </span>
              <span title="Verified Network Partner">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Premium Ad Network
            </span>
          </div>
        </div>

        {/* Dynamic Glowing SPONSORED Tag */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-full select-none shadow-sm animate-pulse">
            Sponsored
          </span>
        </div>
      </div>

      {/* Adsterra Native Sandbox Container (IFrame) */}
      <div className="w-full min-h-[140px] rounded-xl overflow-hidden relative">
        <iframe
          ref={iframeRef}
          srcDoc={iframeSrcDoc}
          style={{ height: `${iframeHeight}px` }}
          className="w-full border-0 bg-transparent overflow-hidden transition-all duration-300 scrollbar-none"
          title="Sponsored Post Frame"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
