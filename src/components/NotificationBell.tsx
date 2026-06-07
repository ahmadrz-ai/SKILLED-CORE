'use client';

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
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
        const interval = setInterval(fetchNotifications, 5000); // Poll every 5s for near real-time
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
                className="relative p-2 rounded-xl hover:bg-sc-gray-100 transition-colors group"
                aria-label="Notifications"
            >
                <Bell className={cn(
                    "w-6 h-6 transition-colors",
                    isOpen ? "text-sc-purple-600" : "text-text-secondary group-hover:text-text-heading"
                )} />

                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-sc-red-500 rounded-full box-content border-2 border-bg-topbar" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-border-default rounded-2xl shadow-sc-dropdown overflow-hidden z-50 origin-top-right"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                            <h3 className="font-bold text-sm text-text-heading tracking-wide">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] text-sc-purple-600 hover:text-sc-purple-700 font-semibold"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-border-subtle">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleMarkAsRead(notification.id, notification.resourcePath)}
                                            className={cn(
                                                "p-4 hover:bg-sc-gray-50 transition-colors cursor-pointer relative",
                                                !notification.read && "bg-sc-purple-50"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                                    !notification.read ? "bg-sc-purple-500" : "bg-transparent"
                                                )} />
                                                <div className="space-y-1">
                                                    <p
                                                        className={cn(
                                                            "text-sm leading-snug",
                                                            !notification.read ? "text-text-heading font-medium" : "text-text-secondary"
                                                        )}
                                                        dangerouslySetInnerHTML={{ __html: notification.message }}
                                                    />
                                                    <p className="text-[10px] text-text-tertiary font-mono">
                                                        {new Date(notification.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-text-tertiary text-xs">
                                    No new notifications.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-border-subtle bg-sc-gray-50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/notifications');
                                }}
                                className="w-full py-2 text-xs font-bold text-center text-text-secondary hover:text-text-heading hover:bg-sc-gray-100 rounded-lg transition-colors uppercase tracking-wider"
                            >
                                View all
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
