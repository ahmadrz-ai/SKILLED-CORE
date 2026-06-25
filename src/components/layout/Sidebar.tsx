"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { logout } from "@/app/actions/authActions";

import React from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import {
  Home, Users, Briefcase, MessageSquare, BarChart, CreditCard,
  MoreHorizontal, LogOut, Settings, PlusCircle, Sparkles, DollarSign,
  BookOpen, MessageSquarePlus, LifeBuoy, ChevronLeft, ChevronRight, X, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/credits/PlanBadge";
import { useBadges } from "@/components/realtime/RealtimeBadgeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/feed" },
  { label: "Network", icon: Users, path: "/network" },
  { label: "Find Talent", icon: Users, path: "/hire", highlightRole: "RECRUITER" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "AI Interview", icon: MessageSquarePlus, path: "/interview", highlight: true },
  { label: "Interviews", icon: CalendarDays, path: "/bookings" },
  { label: "Salary", icon: DollarSign, path: "/salary" },
  { label: "Learning", icon: BookOpen, path: "/learning" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Analytics", icon: BarChart, path: "/analytics" },
  { label: "Credits", icon: CreditCard, path: "/credits" },
  { label: "Support", icon: LifeBuoy, path: "/help" },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  counts?: {
    network?: number;
    messages?: number;
    notifications?: number;
    jobs?: number;
    learning?: number;
    analytics?: boolean;
    salary?: boolean;
  };
  plan?: string;
}

export function Sidebar({ isCollapsed = false, onToggle, isMobileOpen = false, onMobileClose, plan }: SidebarProps) {
  const pathname = usePathname();
  const { counts: rt } = useBadges();
  const { data: session } = useSession();
  const user = session?.user;
  const recruiterGuard = useRoleGuard("RECRUITER");

  const handleProtectedNav = (e: React.MouseEvent, path: string, required: "RECRUITER") => {
    if (required === "RECRUITER" && !recruiterGuard.isAuthorized) {
      e.preventDefault();
      recruiterGuard.triggerDenial();
    }
  };

  const [clearedBadges, setClearedBadges] = React.useState<string[]>([]);

  const handleBadgeClick = (key: string) => {
    if (!clearedBadges.includes(key)) {
      setClearedBadges((prev) => [...prev, key]);
    }
  };

  return (
    <aside 
      className={cn(
        // General sidebars styling
        "flex flex-col bg-bg-sidebar border-r border-border-sidebar fixed left-0 transition-all duration-200 ease-in-out font-sans",
        // Width binds to mode at every breakpoint: icon-only -> narrow rail, with
        // labels -> wide. (Bug 4: mobile drawer was hardcoded w-60 even when icon-only,
        // leaving dead space.)
        isCollapsed ? "w-16 lg:w-16" : "w-60 lg:w-60",
        // Mobile layout: top-0, h-full, z-50
        "top-0 h-full z-50",
        // Desktop overrides: lg:top-14, lg:bottom-0, lg:z-40, lg:h-auto
        "lg:top-14 lg:bottom-0 lg:z-40 lg:h-auto",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Mobile Top Brand Panel (Hidden on Desktop) */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-border-sidebar flex-shrink-0 lg:hidden bg-bg-topbar">
        <Link href="/feed" className="flex items-center gap-2 group min-h-[44px]">
          <Image
            src="/logo.png"
            alt="SkilledCore"
            width={28}
            height={28}
            className="w-7 h-7 flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex flex-col leading-none">
            <span className="text-text-heading font-black text-xs tracking-tight">SkilledCore</span>
            <span className="text-text-secondary text-[8px] font-bold mt-0.5">Talent Intelligence</span>
          </div>
        </Link>
        <button 
          onClick={onMobileClose}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover min-h-[44px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className={cn("flex-1 py-4 space-y-0.5 overflow-y-auto custom-scrollbar", isCollapsed ? "px-1.5" : "px-3")}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const isProtected = ["/jobs/create", "/hire"].includes(item.path);

          // @ts-ignore
          if (item.role && (user as any)?.role !== item.role && (user as any)?.role !== "ADMIN") {
            return null;
          }

          // @ts-ignore
          const showHighlight = item.highlight || (item.highlightRole && (user as any)?.role === item.highlightRole);

          const badges = {
            jobs: rt.jobs || 0,
            salary: rt.salary || false,
            learning: rt.learning || 0,
            analytics: rt.analytics || false,
            credits: (user as any)?.credits && (user as any).credits < 3 ? "low" : null,
            network: rt.network || 0,
            messages: rt.messages || 0,
            notifications: rt.notifications || 0,
            // Realtime core tabs (CR2)
            interviews: rt.bookings || 0,
            support: rt.support || 0,
          };

          const badgeKey = item.label.toLowerCase();
          const badgeValue = !clearedBadges.includes(badgeKey) ? badges[badgeKey as keyof typeof badges] : null;

          return (
            <Link
              key={item.path}
              href={item.path}
              // Bug 6/15: the sidebar renders on every page; default prefetch would
              // prefetch the RSC payload of all ~14 nav routes (incl. the current one,
              // logged as a "self-refetch") on every load. Gate it — Next still
              // prefetches on hover/touch, so navigation stays fast.
              prefetch={false}
              onClick={(e) => {
                handleBadgeClick(badgeKey);
                if (isProtected) handleProtectedNav(e, item.path, "RECRUITER");
                if (onMobileClose) onMobileClose();
              }}
              // Correction 8: zero-dependency native HTML title attribute on icon wrapper for tooltips
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 group relative min-h-[36px]",
                isCollapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-bg-sidebar-active text-text-sidebar-active"
                  : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-sc-purple-600" />
              )}

              <div className="relative flex-shrink-0">
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-sc-purple-600" : "text-sc-gray-400 group-hover:text-sc-gray-600"
                  )}
                />
                {showHighlight && (
                  <Sparkles className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-[#7C3AED] fill-[#7C3AED]" />
                )}
              </div>

              {!isCollapsed && <span className="flex-1">{item.label}</span>}

              {/* BADGES (Only visible when expanded) */}
              {!isCollapsed && (
                <>
                  {(item.label === "Network" || item.label === "Messages" || item.label === "Notifications" || item.label === "Interviews" || item.label === "Support") && !!badgeValue && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-badge-danger px-1 text-[9px] font-bold text-white leading-none">
                      {badgeValue}
                    </span>
                  )}
                  {item.label === "Jobs" && !!badgeValue && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sc-purple-600 px-1 text-[9px] font-bold text-white leading-none">
                      {badgeValue}
                    </span>
                  )}
                  {item.label === "Learning" && !!badgeValue && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sc-purple-500 px-1 text-[9px] font-bold text-white leading-none">
                      {badgeValue}
                    </span>
                  )}
                  {item.label === "Salary" && badgeValue && (
                    <span className="h-1.5 w-1.5 rounded-full bg-sc-green-600 flex-shrink-0" />
                  )}
                  {item.label === "Analytics" && badgeValue && (
                    <span className="h-1.5 w-1.5 rounded-full bg-sc-blue-500 flex-shrink-0" />
                  )}
                  {item.label === "Credits" && badgeValue === "low" && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sc-purple-600 px-1 text-[9px] font-bold text-white leading-none">
                      !
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE */}
      <div className={cn("border-t border-border-sidebar flex-shrink-0", isCollapsed ? "p-1.5 flex justify-center" : "p-3")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              title={isCollapsed ? (user?.name || "User") : undefined}
              className={cn(
                "flex items-center w-full rounded-lg hover:bg-bg-sidebar-hover transition-colors group cursor-pointer min-h-[44px]", 
                isCollapsed ? "justify-center p-0.5" : "gap-3 px-2 py-2"
              )}
            >
              <Avatar className="h-8 w-8 border border-border-sidebar flex-shrink-0">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-bg-sidebar-active text-text-brand text-xs font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-text-heading truncate">{user?.name || "User"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {(user as any)?.role && (
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                          {(user as any).role}
                        </span>
                      )}
                      <PlanBadge plan={plan} />
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-icon-default flex-shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? "start" : "end"}
            side="top"
            className="w-52 bg-bg-dropdown border-border-dropdown text-text-body shadow-sc-dropdown"
          >
            <DropdownMenuLabel className="text-text-heading font-semibold text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild className="hover:bg-bg-card-hover focus:bg-bg-card-hover cursor-pointer text-text-body text-xs py-2">
              <Link href="/profile/me" prefetch={false}>
                <Users className="w-4 h-4 mr-2 text-icon-default" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-bg-card-hover focus:bg-bg-card-hover cursor-pointer text-text-body text-xs py-2">
              <Link href="/settings" prefetch={false}>
                <Settings className="w-4 h-4 mr-2 text-icon-default" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem
              className="text-text-error hover:text-text-error hover:bg-sc-red-50 focus:bg-sc-red-50 cursor-pointer text-xs py-2"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* SIDEBAR TOGGLE BUTTON (Correction 2: Bottom Chevron Manual Toggle) */}
      <div className="hidden lg:flex p-2 border-t border-border-sidebar justify-center flex-shrink-0 bg-bg-sidebar">
        <button 
          onClick={onToggle}
          className="p-1 rounded-lg text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover transition-colors cursor-pointer min-h-[32px] w-full flex items-center justify-center border-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" /> // → when collapsed (click to expand)
          ) : (
            <ChevronLeft className="w-4 h-4" /> // ← when expanded (click to collapse)
          )}
        </button>
      </div>
    </aside>
  );
}
