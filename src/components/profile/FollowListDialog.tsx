import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getFollowers, getFollowing, removeFollower, toggleFollow } from "@/app/(app)/feed/actions";
import { Loader2, UserMinus, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowUser {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    headline: string | null;
    isFollowing: boolean;
}

interface FollowListDialogProps {
    userId: string;
    type: 'followers' | 'following' | null;
    isOpen: boolean;
    onClose: () => void;
    isOwner: boolean; // Is the viewer the owner of the profile being viewed?
}

import { useSession } from "next-auth/react";

export function FollowListDialog({ userId, type, isOpen, onClose, isOwner }: FollowListDialogProps) {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;
    const [users, setUsers] = useState<FollowUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && type) {
            fetchList();
        }
    }, [isOpen, type, userId]);

    const fetchList = async () => {
        setLoading(true);
        const res = type === 'followers'
            ? await getFollowers(userId)
            : await getFollowing(userId);

        if (res.success && res.users) {
            setUsers(res.users);
        } else {
            toast.error("Failed to load list");
        }
        setLoading(false);
    };

    const handleFollowToggle = async (targetId: string, currentStatus: boolean) => {
        setActionLoading(targetId);
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === targetId ? { ...u, isFollowing: !currentStatus } : u));

        const res = await toggleFollow(targetId);
        if (!res.success) {
            // Revert
            setUsers(prev => prev.map(u => u.id === targetId ? { ...u, isFollowing: currentStatus } : u));
            toast.error(res.message);
        }
        setActionLoading(null);
    };

    const handleRemoveFollower = async (targetId: string) => {
        setActionLoading(targetId);
        const res = await removeFollower(targetId);
        if (res.success) {
            setUsers(prev => prev.filter(u => u.id !== targetId));
            toast.success("Follower removed");
        } else {
            toast.error(res.message);
        }
        setActionLoading(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-obsidian border-white/10 text-white max-w-md h-[500px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/10 bg-zinc-950">
                    <DialogTitle className="text-center font-bold capitalize">
                        {type}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-zinc-500 py-10 text-sm">
                            No users found.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between group">
                                <Link href={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={user.image || undefined} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-white group-hover:text-violet-400 transition-colors">
                                            {user.name}
                                        </div>
                                        <div className="text-zinc-500 text-xs">@{user.username}</div>
                                        {user.headline && (
                                            <div className="text-zinc-600 text-[10px] truncate max-w-[150px]">
                                                {user.headline}
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div>
                                    {/* Logic:
                                        Type == Followers:
                                            - If isOwner: Show "Remove" button
                                            - If !isOwner: Show "Follow/Following" button (to follow them back or not)
                                        
                                        Type == Following:
                                            - If isOwner: Show "Following" (hover Unfollow)
                                            - If !isOwner: Show "Follow/Following" (if I strictly follow them)
                                    */}

                                    {type === 'followers' && isOwner ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveFollower(user.id)}
                                            disabled={actionLoading === user.id}
                                            className="h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            {actionLoading === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
                                        </Button>
                                    ) : (
                                        // Standard Follow Toggle Logic
                                        // If viewing my own 'Following' list -> I obviously follow them, so show 'Unfollow' option
                                        // If viewing someone else's list -> I see my relationship to them
                                        // Only show follow button if:
                                        // 1. Not me (user.id !== currentUserId)
                                        // 2. Not me (based on prop check, if valid)
                                        user.id !== currentUserId && ( // Cannot follow self
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                                                disabled={actionLoading === user.id}
                                                className={cn(
                                                    "h-8 text-xs font-bold transition-all w-24",
                                                    user.isFollowing
                                                        ? "bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10"
                                                        : "bg-blue-600 text-white hover:bg-blue-500"
                                                )}
                                            >
                                                {actionLoading === user.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : user.isFollowing ? (
                                                    "Following"
                                                ) : (
                                                    "Follow"
                                                )}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
