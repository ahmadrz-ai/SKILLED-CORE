"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Briefcase, MessageSquare, User, Heart, Star, MoreHorizontal, Check } from "lucide-react";
import Link from "next/link";
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
    const [filter, setFilter] = useState<'ALL' | 'JOBS' | 'POSTS'>('ALL');
    const [notifications, setNotifications] = useState(initialData);

    const filtered = notifications.filter(n => {
        if (filter === 'ALL') return true;
        if (filter === 'JOBS' && ['JOB_ALERT', 'JOB_APPLICATION'].includes(n.type)) return true;
        if (filter === 'POSTS' && ['POST_LIKE', 'COMMENT', 'MENTION'].includes(n.type)) return true;
        return false;
    });

    const handleRead = async (id: string, path: string | null) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        // Server action
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
            case 'CONNECTION_REQUEST': return <User className="w-4 h-4 text-blue-600" />;
            case 'JOB_ALERT': return <Briefcase className="w-4 h-4 text-indigo-600" />;
            case 'POST_LIKE': return <Heart className="w-4 h-4 text-red-500 fill-red-100" />;
            case 'COMMENT': return <MessageSquare className="w-4 h-4 text-emerald-600" />;
            case 'SYSTEM': return <Bell className="w-4 h-4 text-amber-600" />;
            default: return <Star className="w-4 h-4 text-zinc-500" />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 text-zinc-800">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-zinc-800 font-heading">Notifications</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMarkAll}
                        className="text-xs font-bold text-indigo-650 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                    >
                        Mark all read
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-6 border-b border-zinc-200 pb-1">
                {['ALL', 'JOBS', 'POSTS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            filter === tab ? "text-zinc-900 font-bold" : "text-zinc-500 hover:text-zinc-800"
                        )}
                    >
                        {tab === 'ALL' ? 'All' : tab === 'JOBS' ? 'Jobs' : 'My Posts'}
                        {filter === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                        )}
                    </button>
                ))}
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 border-dashed">
                        <Bell className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-500 font-semibold">No notifications to display.</p>
                    </div>
                ) : (
                    filtered.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleRead(notification.id, notification.resourcePath)}
                            className={cn(
                                "group flex gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden shadow-sm",
                                notification.read
                                    ? "bg-white border-zinc-200/80 hover:bg-zinc-50/50"
                                    : "bg-indigo-50/20 border-indigo-100 hover:bg-indigo-50/40"
                            )}
                        >
                            {/* Unread Dot */}
                            {!notification.read && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                            )}

                            {/* Icon / Avatar */}
                            <div className="flex-shrink-0 pt-1">
                                <div className="relative">
                                    {notification.actor?.image ? (
                                        <img src={notification.actor.image} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                                            {getIcon(notification.type)}
                                        </div>
                                    )}
                                    {notification.actor && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-zinc-200">
                                            {getIcon(notification.type)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="text-sm text-zinc-700 leading-relaxed">
                                    {notification.actor && (
                                        <span className="font-bold text-zinc-900 mr-1">{notification.actor.name}</span>
                                    )}
                                    <span dangerouslySetInnerHTML={{ __html: notification.message }} />
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-450 font-medium">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                    {notification.type === 'JOB_ALERT' && (
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[9px] text-indigo-650 font-semibold">
                                            Job Alert
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Button (Optional) */}
                            <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* End of list */}
            <div className="mt-8 text-center">
                <p className="text-xs text-zinc-400 font-bold">You're all caught up!</p>
            </div>
        </div>
    );
}
