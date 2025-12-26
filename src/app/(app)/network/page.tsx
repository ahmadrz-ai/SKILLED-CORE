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
            <div className="flex h-screen items-center justify-center bg-obsidian text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian text-white flex flex-col md:flex-row">

            {/* MANAGER SIDEBAR (Left) */}
            <div className="w-full md:w-64 bg-zinc-950/50 border-r border-white/5 p-6 flex-shrink-0">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 px-2">Manage Network</h2>
                <nav className="space-y-1">
                    {[
                        { label: 'Connections', count: data.stats.connections, icon: Users, active: true },
                        { label: 'Following', count: data.stats.following, icon: UserPlus, active: false }, // Recruiter centric
                        { label: 'Groups', count: null, icon: Users, active: false },
                        { label: 'Events', count: null, icon: MapPin, active: false },
                        { label: 'Newsletter', count: null, icon: Briefcase, active: false },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => handleNavigation(item.label)}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all group",
                                item.active
                                    ? "bg-violet-600/10 text-violet-300 border border-violet-500/20"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", item.active ? "text-violet-400" : "text-zinc-500 group-hover:text-white")} />
                                {item.label}
                            </div>
                            {item.count !== null && (
                                <span className={cn("text-xs", item.active ? "text-violet-400" : "text-zinc-500")}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <h3 className="text-xs font-bold text-zinc-500 mb-4 px-2">Personal Links</h3>
                    <div className="space-y-2">
                        <Link href="/profile/me">
                            <Button variant="outline" className="w-full border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 justify-start">
                                <LinkIcon className="w-4 h-4 mr-2" />
                                My Profile
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 p-6 md:p-10 space-y-10 overflow-y-auto">

                {/* HEADLINE */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-cinzel text-white mb-2">GROW YOUR NETWORK</h1>
                        <p className="text-zinc-500">Connecting you with the architects of the future.</p>
                    </div>
                </div>

                {/* LAYOUT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT COLUMN (MAIN) - 3 COLS */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* INVITATIONS DECK */}
                        {/* <AnimatePresence> ... (Keeping Invitations here or moving inside? Usually Invitations are top level. Let's keep them here but inside the col) */}
                        <AnimatePresence>
                            {data.invitations.length > 0 ? (
                                <motion.section
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <h2 className="font-bold text-white tracking-wide flex items-center gap-2">
                                            INVITATIONS
                                            <span className="bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full">{data.invitations.length}</span>
                                        </h2>
                                        <Button variant="ghost" className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest h-auto py-1">Manage All</Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        {data.invitations.map((inv) => (
                                            <motion.div
                                                key={inv.id}
                                                layout
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-violet-500/30 transition-all"
                                            >
                                                <Link href={`/profile/${inv.requesterId}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg bg-zinc-800 overflow-hidden")}>
                                                        {inv.avatar ? (
                                                            <img src={inv.avatar} alt={inv.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            inv.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{inv.name}</h3>
                                                        <p className="text-xs text-zinc-400 truncate max-w-[150px]">{inv.headline || 'No headline'}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                                                            <Users className="w-3 h-3" /> Connection Request
                                                        </p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => handleInviteAction(inv.id, 'ignore')}
                                                        className="rounded-full w-8 h-8 border-white/10 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        onClick={() => handleInviteAction(inv.id, 'accept')}
                                                        className="rounded-full w-8 h-8 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Bg Decoration */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />
                                </motion.section>
                            ) : (
                                <div className="bg-zinc-900/20 border border-white/5 rounded-xl p-8 text-center">
                                    <h3 className="text-zinc-400 font-medium">No pending invitations</h3>
                                    <p className="text-zinc-600 text-sm mt-1">When people want to connect with you, they'll appear here.</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* YOUR CONNECTIONS */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Your Connections</h2>
                                <span className="text-xs text-zinc-500">{data.connections.length} People</span>
                            </div>

                            {data.connections.length > 0 ? (
                                <div className="space-y-3">
                                    {data.connections.map((conn) => (
                                        <motion.div
                                            key={conn.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-violet-500/30 transition-all"
                                        >
                                            <Link href={`/profile/${conn.id}`} className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg bg-zinc-800 overflow-hidden border border-white/5 group-hover:border-violet-500/50 transition-colors">
                                                    {conn.image ? (
                                                        <img src={conn.image} alt={conn.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        conn.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-sm group-hover:text-violet-400 transition-colors">{conn.name}</h3>
                                                    <p className="text-xs text-zinc-400">{conn.headline}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-1">Connected {new Date(conn.connectedAt).toLocaleDateString()}</p>
                                                </div>
                                            </Link>

                                            <div className="flex items-center gap-3">
                                                <Link href={`/messages?userId=${conn.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
                                                        Message
                                                    </Button>
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                                    <p className="text-zinc-500">You don't have any connections yet.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN (SIDEBAR) - 1 COL */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* AD CARD (PROMOTED USER) */}
                        {data.promoted && (
                            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                                <span className="absolute top-2 right-2 bg-zinc-800 text-[10px] text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">Ad</span>
                                <p className="text-xs font-bold text-zinc-400 mb-4">Add to your feed</p>

                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden">
                                        {data.promoted.image ? (
                                            <img src={data.promoted.image} alt={data.promoted.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold">{data.promoted.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-sm font-bold text-white truncate">{data.promoted.name}</h3>
                                        <p className="text-xs text-zinc-500 truncate">{data.promoted.headline}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button size="sm" variant="outline" className="w-full border-white/10 hover:bg-white/5 text-xs">
                                        <LinkIcon className="w-3 h-3 mr-2" />
                                        View Profile
                                    </Button>
                                    <Link href={`/profile/${data.promoted.id}`} className="w-full text-center text-[10px] text-zinc-500 hover:text-white">
                                        View all recommendations
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* MUTUALS / RECOMMENDATIONS */}
                        <div className="bg-zinc-900 border border-white/5 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-white mb-4">People you may know</h3>

                            <div className="space-y-4">
                                {(data.mutuals.length > 0 ? data.mutuals : data.recommendations.slice(0, 3)).map((user) => (
                                    <div key={user.id} className="flex flex-col gap-2 pb-4 border-b border-white/5 last:border-0">
                                        <div className="flex items-start gap-3">
                                            <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                                    {user.image ? (
                                                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="min-w-0">
                                                <Link href={`/profile/${user.id}`} className="hover:underline decoration-white/20">
                                                    <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                                                </Link>
                                                <p className="text-xs text-zinc-500 truncate">{user.headline}</p>
                                                {user.mutualCount > 0 && (
                                                    <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {user.mutualCount} mutual connections
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleConnect(user.id)}
                                            disabled={pendingConnects.has(user.id)}
                                            className="w-full rounded-full border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white h-8 text-xs bg-zinc-800/50"
                                        >
                                            {pendingConnects.has(user.id) ? 'Pending' : 'Connect'}
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button variant="ghost" className="w-full mt-2 text-xs text-zinc-500 hover:text-white">
                                Show more
                            </Button>
                        </div>
                    </div>

                </div>


            </div>
        </div>
    );
}
