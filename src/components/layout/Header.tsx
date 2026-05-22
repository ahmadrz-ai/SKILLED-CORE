"use client";

import { usePathname } from "next/navigation";
import { Search, ChevronRight, Menu, MessageSquarePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "../NotificationBell";
import { PaymentModal } from "@/components/credits/PaymentModal";
import { useState, useRef, useEffect } from "react";
import { getSearchSuggestions } from "@/app/actions/search";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash } from "lucide-react";

interface HeaderProps {
  credits?: number;
}

// Page name map for cleaner breadcrumbs
const PAGE_NAMES: Record<string, string> = {
  feed: "Home",
  network: "Network",
  jobs: "Jobs",
  hire: "Hire",
  search: "Search",
  interview: "AI Interview",
  salary: "Salary Insights",
  learning: "Learning",
  messages: "Messages",
  analytics: "Analytics",
  credits: "Credits",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
  assessments: "Assessments",
  admin: "Admin",
  billing: "Billing",
  applications: "Applications",
};

export function Header({ credits = 0 }: HeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    let label = segment;
    if (isUUID) {
      const prev = segments[index - 1];
      if (prev === "jobs") label = "Job Details";
      else if (prev === "profile") label = "Profile";
      else label = "Details";
    } else {
      label = PAGE_NAMES[segment] || segment.replace(/-/g, " ");
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    return (
      <div key={segment + index} className="flex items-center gap-1.5">
        {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB] flex-shrink-0" />}
        <span className={cn("text-sm", isLast ? "text-[#111827] font-semibold" : "text-[#9CA3AF]")}>
          {label}
        </span>
      </div>
    );
  });

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-6">

      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 -ml-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs — desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          {breadcrumbs.length > 0 ? breadcrumbs : (
            <span className="text-sm font-semibold text-[#111827]">Home</span>
          )}
        </div>

        {/* Page title — mobile */}
        <div className="md:hidden">
          <span className="text-sm font-bold text-[#111827]">
            {PAGE_NAMES[segments[segments.length - 1]] ||
              segments[segments.length - 1]?.replace(/-/g, " ") ||
              "Home"}
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative z-50">
        <SearchInput />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <a
          href="/feedback"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#374151] transition-colors text-xs font-medium border border-[#E5E7EB]"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Feedback
        </a>

        <NotificationBell />

        {/* Credits */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#F3F4F6] border border-[#E5E7EB]">
          <div className="w-2 h-2 rounded-full bg-[#6366F1] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#374151]">{credits} Credits</span>
          <PaymentModal />
        </div>
      </div>
    </header>
  );
}

function SearchInput() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ users: any[]; tags: string[] }>({ users: [], tags: [] });
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const data = await getSearchSuggestions(query);
          setSuggestions(data);
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions({ users: [], tags: [] });
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    setIsOpen(false);
    setQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (suggestions.users.length > 0 || suggestions.tags.length > 0) setIsOpen(true); }}
        placeholder="Search candidates, jobs, skills..."
        className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg py-2 pl-9 pr-16 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all hover:bg-[#F3F4F6]"
        onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) handleSearch(query); }}
      />
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 items-center bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded text-[10px] text-[#9CA3AF] cursor-pointer hover:border-[#D1D5DB] transition-colors"
      >
        <span>Ctrl</span>
        <span>K</span>
      </button>

      {isOpen && (suggestions.users.length > 0 || suggestions.tags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden z-50 divide-y divide-[#F3F4F6]">

          {suggestions.users.length > 0 && (
            <div className="p-2">
              <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">People</h3>
              {suggestions.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => { router.push(`/profile/${user.username || user.id}`); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left"
                >
                  <Avatar className="w-7 h-7 border border-[#E5E7EB]">
                    <AvatarImage src={user.image} />
                    <AvatarFallback className="text-xs bg-[#EEF2FF] text-[#6366F1]">{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#111827] truncate">{user.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.tags.length > 0 && (
            <div className="p-2">
              <h3 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-2 mb-1">Skills & Tags</h3>
              {suggestions.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSearch(`#${tag}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#6366F1]">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-[#374151] group-hover:text-[#111827]">#{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
