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
  BookOpen, MessageSquarePlus, Bell, LifeBuoy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanBadge } from "@/components/credits/PlanBadge";
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
  { label: "Salary", icon: DollarSign, path: "/salary" },
  { label: "Learning", icon: BookOpen, path: "/learning" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Analytics", icon: BarChart, path: "/analytics-dashboard" },
  { label: "Credits", icon: CreditCard, path: "/credits" },
  { label: "Support", icon: LifeBuoy, path: "/help" },
];

interface SidebarProps {
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

export function Sidebar({ counts, plan }: SidebarProps) {
  const pathname = usePathname();
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
    <aside className="hidden lg:flex w-64 h-screen flex-col bg-bg-sidebar border-r border-border-sidebar fixed left-0 top-0 z-50">

      {/* BRAND */}
      <div className="h-16 flex items-center px-5 border-b border-border-sidebar flex-shrink-0">
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="SkilledCore"
            width={32}
            height={32}
            className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex flex-col leading-none">
            <span className="text-text-heading font-bold text-sm tracking-tight">SkilledCore</span>
            <span className="text-text-secondary text-[10px] font-medium">Talent Intelligence</span>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
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
            jobs: counts?.jobs || 0,
            salary: counts?.salary || false,
            learning: counts?.learning || 0,
            analytics: counts?.analytics || false,
            credits: (user as any)?.credits && (user as any).credits < 3 ? "low" : null,
            network: counts?.network || 0,
            messages: counts?.messages || 0,
            notifications: counts?.notifications || 0,
          };

          const badgeKey = item.label.toLowerCase();
          const badgeValue = !clearedBadges.includes(badgeKey) ? badges[badgeKey as keyof typeof badges] : null;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => {
                handleBadgeClick(badgeKey);
                if (isProtected) handleProtectedNav(e, item.path, "RECRUITER");
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-bg-sidebar-active text-text-sidebar-active"
                  : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-sc-purple-600" />
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

              <span className="flex-1">{item.label}</span>

              {/* BADGES */}
              {(item.label === "Network" || item.label === "Messages" || item.label === "Notifications") && !!badgeValue && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-sc-red-650 px-1 text-[10px] font-bold text-white">
                  {badgeValue}
                </span>
              )}
              {item.label === "Jobs" && !!badgeValue && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-sc-purple-600 px-1 text-[10px] font-bold text-white">
                  {badgeValue}
                </span>
              )}
              {item.label === "Learning" && !!badgeValue && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-sc-purple-500 px-1 text-[10px] font-bold text-white">
                  {badgeValue}
                </span>
              )}
              {item.label === "Salary" && badgeValue && (
                <span className="h-2 w-2 rounded-full bg-sc-green-600 flex-shrink-0" />
              )}
              {item.label === "Analytics" && badgeValue && (
                <span className="h-2 w-2 rounded-full bg-sc-blue-500 flex-shrink-0" />
              )}
              {item.label === "Credits" && badgeValue === "low" && (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-sc-purple-600 px-1 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE */}
      <div className="p-3 border-t border-border-sidebar flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-bg-sidebar-hover transition-colors group">
              <Avatar className="h-8 w-8 border border-border-sidebar flex-shrink-0">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-bg-sidebar-active text-text-brand text-xs font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-text-heading truncate">{user?.name || "User"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {(user as any)?.role && (
                    <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
                      {(user as any).role}
                    </span>
                  )}
                  <PlanBadge plan={plan} />
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-icon-default flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-52 bg-bg-dropdown border-border-dropdown text-text-body shadow-sc-dropdown"
          >
            <DropdownMenuLabel className="text-text-heading font-semibold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild className="hover:bg-bg-card-hover focus:bg-bg-card-hover cursor-pointer text-text-body">
              <Link href="/profile/me">
                <Users className="w-4 h-4 mr-2 text-icon-default" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-bg-card-hover focus:bg-bg-card-hover cursor-pointer text-text-body">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2 text-icon-default" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem
              className="text-text-error hover:text-text-error hover:bg-sc-red-50 focus:bg-sc-red-50 cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
