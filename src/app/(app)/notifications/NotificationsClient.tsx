"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Briefcase, MessageSquare, User, Heart, Star, MoreHorizontal, Check, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { toast } from "sonner";

interface NotificationItem {
    id: string;
    type: string;
    message: string;
    resourcePath: string | null;
    read: boolean;
    createdAt: Date;
    actor?: {
        name: string | null;
        image: string | null;
        role: string;
    } | null;
}

export function NotificationsClient({ initialData }: { initialData: NotificationItem[] }) {
    const router = useRouter();
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'MENTIONS' | 'SYSTEM'>('ALL');
    const [notifications, setNotifications] = useState(initialData);

    const filtered = notifications.filter(n => {
        if (filter === 'ALL') return true;
        if (filter === 'UNREAD') return !n.read;
        if (filter === 'MENTIONS') return n.type === 'MENTION' || n.type === 'COMMENT';
        if (filter === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'JOB_ALERT';
        return true;
    });

    const handleRead = async (id: string, path: string | null) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await markAsRead(id);
        if (path) {
            router.push(path);
        }
    };

    const handleMarkAll = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllAsRead();
        toast.success("All notifications marked as read");
        router.refresh();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'CONNECTION_REQUEST': return <User className="w-4 h-4 text-[var(--sc-blue-700)]" />;
            case 'JOB_ALERT': return <Briefcase className="w-4 h-4 text-[var(--sc-purple-650)]" />;
            case 'POST_LIKE': return <Heart className="w-4 h-4 text-[var(--sc-red-600)] fill-[var(--sc-red-100)]" />;
            case 'COMMENT': return <MessageSquare className="w-4 h-4 text-[var(--sc-green-700)]" />;
            case 'SYSTEM': return <Bell className="w-4 h-4 text-[var(--sc-amber-700)]" />;
            default: return <Star className="w-4 h-4 text-[var(--sc-gray-500)]" />;
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 font-sans text-[var(--text-body)]">
            
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-[var(--border-strong)] pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase">
                        NOTIFICATIONS
                    </h1>
                    <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                        Stay updated with your deployment activity and professional network alerts.
                    </p>
                </div>
            </div>

            {/* Pattern B: Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Panel: Filter tabs (w-72 fixed) */}
                <div className="w-full lg:w-72 flex-shrink-0 bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                            Filter Inbox
                        </span>
                        <button
                            onClick={handleMarkAll}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--text-brand)] hover:text-[var(--text-brand-hover)] uppercase tracking-wider border-none bg-transparent cursor-pointer"
                            title="Mark all read"
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Mark all read
                        </button>
                    </div>

                    <div className="flex flex-col space-y-1">
                        {(['ALL', 'UNREAD', 'MENTIONS', 'SYSTEM'] as const).map((tab) => {
                            const count = tab === 'UNREAD' 
                                ? notifications.filter(n => !n.read).length
                                : tab === 'ALL'
                                ? notifications.length
                                : tab === 'MENTIONS'
                                ? notifications.filter(n => n.type === 'MENTION' || n.type === 'COMMENT').length
                                : notifications.filter(n => n.type === 'SYSTEM' || n.type === 'JOB_ALERT').length;

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={cn(
                                        "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 flex items-center justify-between border-none cursor-pointer",
                                        filter === tab
                                            ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)]"
                                            : "text-[var(--text-sidebar-inactive)] bg-transparent hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-hover)]"
                                    )}
                                >
                                    <span>{tab === 'ALL' ? 'All Alerts' : tab === 'UNREAD' ? 'Unread Only' : tab === 'MENTIONS' ? 'Mentions & Comments' : 'System Broadcasts'}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
                                            tab === 'UNREAD'
                                                ? "bg-[var(--sc-red-600)] text-white"
                                                : filter === tab
                                                ? "bg-[var(--sc-purple-200)] text-[var(--sc-purple-700)]"
                                                : "bg-[var(--sc-gray-200)] text-[var(--sc-gray-700)]"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: List of notification cards (flex-1) */}
                <div className="flex-1 w-full space-y-3">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center min-h-[220px] p-8 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-sm">
                            <Bell className="w-12 h-12 text-[var(--sc-gray-300)] mt-4" />
                            <h3 className="text-base font-semibold text-[var(--text-heading)] mt-4">You're all caught up!</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xs leading-relaxed">
                                {filter === 'UNREAD' 
                                    ? "No unread alerts. Excellent queue management." 
                                    : "No new notifications in this channel."}
                            </p>
                        </div>
                    ) : (
                        filtered.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleRead(notification.id, notification.resourcePath)}
                                className={cn(
                                    "group flex gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden shadow-sm",
                                    notification.read
                                        ? "bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]"
                                        : "bg-[var(--sc-purple-50)] border-[var(--border-selected)] hover:bg-[var(--sc-purple-100)]/30 border-l-2 border-l-[var(--sc-purple-400)]"
                                )}
                            >
                                {/* Unread Dot */}
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-[var(--sc-purple-600)] rounded-full shadow-[0_0_8px_var(--border-focus-shadow)]" />
                                )}

                                {/* Icon / Avatar */}
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="relative">
                                        {notification.actor?.image ? (
                                            <img src={notification.actor.image} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--border-default)]" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary-panel)] flex items-center justify-center border border-[var(--border-default)]">
                                                {getIcon(notification.type)}
                                            </div>
                                        )}
                                        {notification.actor && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--bg-card)] rounded-full flex items-center justify-center border border-[var(--border-default)] shadow-sm">
                                                {getIcon(notification.type)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="text-sm text-[var(--text-body-strong)] leading-relaxed">
                                        {notification.actor && (
                                            <span className="font-bold text-[var(--text-heading)] mr-1">{notification.actor.name}</span>
                                        )}
                                        <span dangerouslySetInnerHTML={{ __html: notification.message }} />
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                        {notification.type === 'JOB_ALERT' && (
                                            <span className="px-1.5 py-0.5 rounded bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] text-[9px] text-[var(--sc-purple-700)] font-bold">
                                                Job Alert
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Chevron indicator */}
                                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4 text-[var(--icon-muted)] hover:text-[var(--icon-strong)]" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
