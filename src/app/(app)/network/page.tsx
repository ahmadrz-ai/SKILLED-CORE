'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, UserCheck, Shield, ChevronRight,
    Search, MapPin, Briefcase, Zap, X, Check, Link as LinkIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNetworkData, sendConnectionRequest, updateConnectionStatus } from './actions';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

export default function NetworkPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        invitations: any[],
        connections: any[],
        recommendations: any[],
        mutuals: any[],
        promoted: any | null,
        stats: { connections: number, following: number }
    }>({
        invitations: [],
        connections: [],
        recommendations: [],
        mutuals: [],
        promoted: null,
        stats: { connections: 0, following: 0 }
    });

    // Optimistic UI states
    const [pendingConnects, setPendingConnects] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getNetworkData();
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load network");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteAction = async (id: string, action: 'accept' | 'ignore') => {
        // Optimistic remove
        setData(prev => ({
            ...prev,
            invitations: prev.invitations.filter(inv => inv.id !== id)
        }));

        const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
        const res = await updateConnectionStatus(id, status);

        if (!res.success) {
            toast.error("Action failed");
            loadData(); // Revert on failure
        } else {
            toast.success(action === 'accept' ? "Connection Accepted" : "Request Ignored");
            if (action === 'accept') {
                setData(prev => ({ ...prev, stats: { ...prev.stats, connections: prev.stats.connections + 1 } }));
            }
        }
    };

    const handleConnect = async (userId: string) => {
        setPendingConnects(prev => new Set(prev).add(userId));

        const res = await sendConnectionRequest(userId);

        if (res.success) {
            toast.success("Invitation Sent");
            // Keep it optimistic, maybe remove from list or show pending
        } else {
            toast.error(res.message || "Failed to connect");
            setPendingConnects(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const handleNavigation = (label: string) => {
        if (label === 'Connections') return;
        if (label === 'Following') {
            router.push('/profile/me?view=following');
            return;
        }
        toast.info("Feature coming soon");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 md:p-10 bg-bg-secondary-panel">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="h-8 w-64 rounded animate-pulse bg-border-default" />
                    <div className="h-4 w-48 rounded animate-pulse bg-bg-secondary-panel" />
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="rounded-xl border border-border-default p-5 bg-bg-card shadow-sc-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full animate-pulse bg-border-default" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-36 rounded animate-pulse bg-border-default" />
                                            <div className="h-3 w-24 rounded animate-pulse bg-bg-secondary-panel" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-xl border border-border-default p-4 bg-bg-card shadow-sc-xs">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full animate-pulse bg-border-default" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-24 rounded animate-pulse bg-border-default" />
                                        <div className="h-2 w-16 rounded animate-pulse bg-bg-secondary-panel" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-bg-secondary-panel text-text-body flex flex-col md:flex-row">

            {/* MANAGER SIDEBAR (Left) */}
            <div className="w-full md:w-64 bg-bg-sidebar border-r border-border-sidebar p-6 flex-shrink-0 shadow-sc-xs">
                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6 px-2">Manage Network</h2>
                <nav className="space-y-1">
                    {[
                        { label: 'Connections', count: data.stats.connections, icon: Users, active: true },
                        { label: 'Following', count: data.stats.following, icon: UserPlus, active: false },
                        { label: 'Groups', count: null, icon: Users, active: false },
                        { label: 'Events', count: null, icon: MapPin, active: false },
                        { label: 'Newsletter', count: null, icon: Briefcase, active: false },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => handleNavigation(item.label)}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg text-sm font-semibold transition-all border group cursor-pointer",
                                item.active
                                    ? "bg-bg-sidebar-active text-text-sidebar-active border-border-selected"
                                    : "text-text-sidebar-inactive border-transparent hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", item.active ? "text-text-sidebar-active" : "text-text-placeholder group-hover:text-text-secondary")} />
                                {item.label}
                            </div>
                            {item.count !== null && (
                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", item.active ? "bg-sc-purple-150 text-sc-purple-800" : "bg-bg-secondary-panel text-text-secondary border border-border-default")}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-border-sidebar">
                    <h3 className="text-xs font-bold text-text-secondary mb-4 px-2 uppercase tracking-wider">Personal Links</h3>
                    <div className="space-y-2">
                        <Link href="/profile/me">
                            <Button variant="outline" className="w-full border-border-default text-text-body hover:bg-bg-sidebar-hover justify-start font-semibold">
                                <LinkIcon className="w-4 h-4 mr-2 text-text-placeholder" />
                                My Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto bg-bg-secondary-panel">

                {/* HEADLINE */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-heading mb-2">GROW YOUR NETWORK</h1>
                        <p className="text-text-secondary font-medium">Connecting you with the architects of the future.</p>
                    </div>
                </div>

                {/* LAYOUT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT COLUMN (MAIN) - 3 COLS */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* INVITATIONS DECK */}
                        <AnimatePresence>
                            {data.invitations.length > 0 ? (
                                <motion.section
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-bg-card border border-border-card rounded-2xl p-6 relative overflow-hidden shadow-sc-card"
                                >
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <h2 className="font-bold text-text-heading tracking-wide flex items-center gap-2">
                                            INVITATIONS
                                            <span className="bg-sc-purple-600 text-text-inverse text-[10px] px-2 py-0.5 rounded-full font-bold">{data.invitations.length}</span>
                                        </h2>
                                        <Button variant="ghost" className="text-text-secondary hover:text-text-heading text-xs font-bold uppercase tracking-widest h-auto py-1">Manage All</Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        {data.invitations.map((inv) => (
                                            <motion.div
                                                key={inv.id}
                                                layout
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="bg-bg-secondary-panel border border-border-default p-4 rounded-xl flex items-center justify-between group hover:border-border-selected transition-all"
                                            >
                                                <Link href={`/profile/${inv.requesterUsername || inv.requesterId}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-text-body shadow bg-bg-secondary-panel overflow-hidden border border-border-default")}>
                                                        {inv.avatar ? (
                                                            <img src={inv.avatar} alt={inv.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            inv.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-text-heading text-sm">{inv.name}</h3>
                                                        <p className="text-xs text-text-secondary truncate max-w-[150px] font-medium">{inv.headline || 'No headline'}</p>
                                                        <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1 font-semibold">
                                                            <Users className="w-3 h-3 text-text-brand" /> Connection Request
                                                        </p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => handleInviteAction(inv.id, 'ignore')}
                                                        className="rounded-full w-8 h-8 border-border-default text-text-secondary hover:text-text-error hover:bg-bg-error hover:border-border-error"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        onClick={() => handleInviteAction(inv.id, 'accept')}
                                                        className="rounded-full w-8 h-8 bg-sc-purple-600 hover:bg-sc-purple-700 text-text-inverse shadow-sc-xs border-none cursor-pointer animate-none"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Bg Decoration */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-sc-purple-100/30 blur-[80px] rounded-full pointer-events-none" />
                                </motion.section>
                            ) : (
                                <div className="bg-bg-card border border-border-card rounded-xl p-8 text-center shadow-sc-card">
                                    <h3 className="text-text-heading font-bold">No pending invitations</h3>
                                    <p className="text-text-secondary text-sm mt-1">When people want to connect with you, they'll appear here.</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* YOUR CONNECTIONS */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-text-heading">Your Connections</h2>
                                <span className="text-xs font-semibold text-text-secondary">{data.connections.length} People</span>
                            </div>

                            {data.connections.length > 0 ? (
                                <div className="space-y-3">
                                    {data.connections.map((conn) => (
                                        <motion.div
                                            key={conn.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-bg-card border border-border-card p-4 rounded-xl flex items-center justify-between shadow-sc-card hover:border-border-selected transition-all group"
                                        >
                                            <Link href={`/profile/${conn.username || conn.id}`} className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-text-body shadow bg-bg-secondary-panel overflow-hidden border border-border-default group-hover:border-border-selected transition-colors">
                                                    {conn.image ? (
                                                        <img src={conn.image} alt={conn.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        conn.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-text-heading text-sm group-hover:text-text-brand transition-colors">{conn.name}</h3>
                                                    <p className="text-xs text-text-secondary font-medium">{conn.headline}</p>
                                                    <p className="text-[10px] text-text-tertiary mt-1 font-semibold">Connected {new Date(conn.connectedAt).toLocaleDateString()}</p>
                                                </div>
                                            </Link>

                                            <div className="flex items-center gap-3">
                                                <Link href={`/messages?userId=${conn.id}`}>
                                                    <Button variant="outline" size="sm" className="border-border-default text-text-secondary hover:bg-bg-sidebar-hover hover:text-text-heading font-semibold text-xs">
                                                        Message
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Users}
                                    title="Your network is empty"
                                    description="Start connecting with colleagues, peers, and industry leaders to build your professional network."
                                    ctaText="Find People"
                                    ctaHref="/search"
                                />
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN (SIDEBAR) - 1 COL */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* AD CARD (PROMOTED USER) */}
                        {data.promoted && (
                            <div className="bg-bg-card border border-border-card rounded-xl p-4 relative overflow-hidden shadow-sc-card">
                                <span className="absolute top-2 right-2 bg-bg-secondary-panel text-[10px] text-text-secondary px-1.5 py-0.5 rounded border border-border-default font-semibold">Ad</span>
                                <p className="text-xs font-bold text-text-secondary mb-4 tracking-wider uppercase">Add to your feed</p>

                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-bg-secondary-panel border border-border-default flex-shrink-0 overflow-hidden">
                                        {data.promoted.image ? (
                                            <img src={data.promoted.image} alt={data.promoted.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-text-body bg-bg-secondary-panel">{data.promoted.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold text-text-heading truncate">{data.promoted.name}</h3>
                                        <p className="text-xs text-text-secondary truncate font-medium">{data.promoted.headline}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button size="sm" variant="outline" className="w-full border-border-default hover:bg-bg-sidebar-hover text-text-body font-semibold text-xs">
                                        <LinkIcon className="w-3 h-3 mr-2 text-text-placeholder" />
                                        View Profile
                                    </Button>
                                    <Link href={`/profile/${data.promoted.id}`} className="w-full text-center text-[10px] text-text-tertiary hover:text-text-brand font-semibold">
                                        View all recommendations
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* MUTUALS / RECOMMENDATIONS */}
                        <div className="bg-bg-card border border-border-card rounded-xl p-4 shadow-sc-card">
                            <h3 className="text-sm font-bold text-text-heading mb-4">People you may know</h3>

                            <div className="space-y-4">
                                {(data.mutuals.length > 0 ? data.mutuals : data.recommendations.slice(0, 3)).map((user) => (
                                    <div key={user.id} className="flex flex-col gap-2 pb-4 border-b border-border-subtle last:border-0">
                                        <div className="flex items-start gap-3">
                                            <Link href={`/profile/${user.username || user.id}`} className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-bg-secondary-panel border border-border-default overflow-hidden">
                                                    {user.image ? (
                                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-text-body bg-bg-secondary-panel">{user.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="min-w-0">
                                                <Link href={`/profile/${user.username || user.id}`} className="hover:underline decoration-border-default">
                                                    <h4 className="text-sm font-bold text-text-heading truncate hover:text-text-brand transition-colors">{user.name}</h4>
                                                </Link>
                                                <p className="text-xs text-text-secondary truncate font-medium">{user.headline}</p>
                                                {user.mutualCount > 0 && (
                                                    <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1 font-semibold">
                                                        <Users className="w-3 h-3 text-text-brand" /> {user.mutualCount} mutual connections
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleConnect(user.id)}
                                            disabled={pendingConnects.has(user.id)}
                                            className="w-full rounded-full border-border-default hover:border-border-brand text-text-body hover:text-text-brand h-8 text-xs bg-bg-secondary-panel font-bold cursor-pointer"
                                        >
                                            {pendingConnects.has(user.id) ? 'Pending' : 'Connect'}
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button variant="ghost" className="w-full mt-2 text-xs text-text-placeholder hover:text-text-secondary font-bold cursor-pointer">
                                Show more
                            </Button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
