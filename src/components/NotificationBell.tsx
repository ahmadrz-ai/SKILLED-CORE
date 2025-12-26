'use client';

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Info, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/actions/feedback";
import { useRouter } from "next/navigation";

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        const res = await getNotifications();
        if (res.success) setNotifications(res.notifications);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, path: string | null) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await markNotificationRead(id);
        if (path) {
            setIsOpen(false);
            router.push(path);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllNotificationsRead();
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
                <Bell className={cn(
                    "w-6 h-6 transition-colors",
                    isOpen ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />

                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full box-content border-2 border-zinc-900" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-sm text-white tracking-wide">NOTIFICATIONS</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] text-violet-400 hover:text-violet-300 font-mono"
                                >
                                    MARK ALL READ
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleMarkAsRead(notification.id, notification.resourcePath)}
                                            className={cn(
                                                "p-4 hover:bg-white/5 transition-colors cursor-pointer relative",
                                                !notification.read && "bg-violet-900/10"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                                    !notification.read ? "bg-violet-500" : "bg-transparent"
                                                )} />
                                                <div className="space-y-1">
                                                    <p
                                                        className={cn(
                                                            "text-sm leading-snug",
                                                            !notification.read ? "text-white font-medium" : "text-zinc-400"
                                                        )}
                                                        dangerouslySetInnerHTML={{ __html: notification.message }}
                                                    />
                                                    <p className="text-[10px] text-zinc-600 font-mono">
                                                        {new Date(notification.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                                    No new alerts from the system.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-white/5 bg-white/5">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/notifications');
                                }}
                                className="w-full py-2 text-xs font-bold text-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors uppercase tracking-wider"
                            >
                                Detailed View
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
