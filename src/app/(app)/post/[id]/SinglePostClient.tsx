"use client";

import { PostCard, PostProps } from "@/components/feed/PostCard";
import { useState } from "react";
import { toggleLike as toggleLikeAction } from "@/app/(app)/feed/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SinglePostClientProps {
    post: any;
    currentUserId: string;
}

export function SinglePostClient({ post: initialPost, currentUserId }: SinglePostClientProps) {
    const mapPost = (p: any): PostProps => ({
        id: p.id,
        author: {
            id: p.userId,
            name: p.author?.name || 'Anonymous',
            handle: p.author?.username ? `@${p.author.username}` : '@user',
            avatar: p.author?.image,
            isFollowing: p.author?.isFollowing, 
            connectionStatus: p.author?.connectionStatus || 'NONE', 
            isHiring: false, 
            role: p.author?.role,
            nodeType: p.author?.nodeType,
            plan: p.author?.plan
        },
        content: p.content,
        timestamp: new Date(p.createdAt).toLocaleString(),
        likes: p.likes?.length || 0,
        comments: p._count?.comments || 0,
        isLiked: p.likes?.some((l: any) => l.userId === currentUserId) || false,
        codeSnippet: p.codeSnippet,
        poll: p.poll ? {
            id: p.poll.id,
            question: p.poll.question,
            options: p.poll.options?.map((o: any) => ({
                id: o.id,
                text: o.text,
                votes: o.votes || 0
            })) || []
        } : undefined
    });

    const [post, setPost] = useState<any>(initialPost);

    const handleLike = async () => {
        // Optimistic update
        const isLiked = post.likes.some((like: any) => like.userId === currentUserId);
        const updatedLikes = isLiked
            ? post.likes.filter((like: any) => like.userId !== currentUserId)
            : [...post.likes, { userId: currentUserId, postId: post.id }];

        setPost((prev: any) => ({
            ...prev,
            likes: updatedLikes
        }));

        try {
            await toggleLikeAction(post.id);
        } catch (err) {
            console.error("Failed to toggle like:", err);
            // Rollback on failure
            setPost(initialPost);
        }
    };

    const handleDelete = () => {
        // Redirect back to main feed after deleting
        window.location.href = "/feed";
    };

    const uiPost = mapPost(post);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Link 
                    href="/feed" 
                    className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-sidebar-hover)] transition-colors bg-[var(--bg-card)] border border-[var(--border-card)] px-3.5 py-2 rounded-xl shadow-sm select-none"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-[var(--icon-default)]" />
                    Back to Feed
                </Link>
            </div>
            
            <PostCard
                post={uiPost}
                onLike={handleLike}
                onDelete={handleDelete}
            />
        </div>
    );
}
