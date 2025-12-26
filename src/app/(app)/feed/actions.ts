'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { containsProfanity } from '@/lib/content-safety';

export async function updatePost(postId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (!post) return { success: false, message: "Post not found" };
        if (post.userId !== session.user.id) return { success: false, message: "Unauthorized" };

        await prisma.post.update({
            where: { id: postId },
            data: { content }
        });

        revalidatePath("/feed");
        return { success: true, message: "Transmission updated." };
    } catch (error) {
        console.error("Failed to update post:", error);
        return { success: false, message: "Failed to update transmission." };
    }
}

export async function createPost(content: string, codeSnippet?: string, pollOptions?: string[]) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 500) {
        return { success: false, message: 'Post exceeds 500 word limit.' };
    }

    if (containsProfanity(content)) {
        return { success: false, message: 'Post rejected: Profanity detected.' };
    }

    try {
        // Extract hashtags
        const hashtags = content.match(/#\w+/g);
        const uniqueTags = hashtags ? Array.from(new Set(hashtags.map(t => t.replace('#', '')))).join(',') : null;

        const postData: any = {
            content,
            codeSnippet,
            userId: session.user.id,
            tags: uniqueTags,
            type: pollOptions && pollOptions.length > 0 ? "POLL" : "TEXT"
        };

        if (pollOptions && pollOptions.length >= 2) {
            postData.poll = {
                create: {
                    question: content, // Use post content as question
                    options: {
                        create: pollOptions.map(opt => ({ text: opt }))
                    }
                }
            };
        }

        const newPost = await prisma.post.create({
            data: postData,
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                        username: true,
                        headline: true
                    }
                },
                likes: true,
                _count: {
                    select: { comments: true }
                },
                poll: {
                    include: {
                        options: true
                    }
                }
            }
        });

        revalidatePath('/feed');
        return { success: true, message: 'Post broadcasted.', post: newPost };
    } catch (error) {
        console.error('Create Post Error:', error);
        return { success: false, message: 'Post failed.' };
    }
}

export async function toggleLike(postId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    try {
        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });
            revalidatePath('/feed');
            return { success: true, liked: false };
        } else {
            await prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });

            // Create Notification
            const post = await prisma.post.findUnique({
                where: { id: postId },
                select: { userId: true }
            });

            if (post && post.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: "LIKE",
                        message: `${session.user.name || "A user"} liked your post.`,
                        resourcePath: `/feed?postId=${postId}`,
                        read: false
                    }
                });
            }

            revalidatePath('/feed');
            return { success: true, liked: true };
        }
    } catch (error) {
        console.error('Toggle Like Error:', error);
        return { success: false, message: 'Operation failed.' };
    }
}

export async function addComment(postId: string, content: string, parentId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    if (!content.trim()) {
        return { success: false, message: 'Comment cannot be empty.' };
    }

    if (containsProfanity(content)) {
        return { success: false, message: 'Comment contains restricted language.' };
    }

    try {
        const newComment = await prisma.comment.create({
            data: {
                content,
                postId,
                userId: session.user.id,
                parentId
            },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                        username: true
                    }
                },
                votes: true
            }
        });

        // Create Notification
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (post && post.userId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: "COMMENT",
                    message: `${session.user.name || "A user"} commented on your post.`,
                    resourcePath: `/feed?postId=${postId}`,
                    read: false
                }
            });
        }

        revalidatePath('/feed');
        return { success: true, comment: newComment };
    } catch (error) {
        console.error('Add Comment Error:', error);
        return { success: false, message: 'Failed to broadcast comment.' };
    }
}

export async function fetchComments(postId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true,
                        username: true
                    }
                },
                votes: true
            }
        });
        return { success: true, comments };
    } catch (error) {
        console.error('Fetch Comments Error:', error);
        return { success: false, comments: [] };
    }
}

export async function voteComment(commentId: string, type: 'UP' | 'DOWN') {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const existingVote = await prisma.commentVote.findUnique({
            where: {
                userId_commentId: {
                    userId: session.user.id,
                    commentId
                }
            }
        });

        if (existingVote) {
            if (existingVote.type === type) {
                await prisma.commentVote.delete({
                    where: { id: existingVote.id }
                });
            } else {
                await prisma.commentVote.update({
                    where: { id: existingVote.id },
                    data: { type }
                });
            }
        } else {
            await prisma.commentVote.create({
                data: {
                    type,
                    commentId,
                    userId: session.user.id
                }
            });
        }

        revalidatePath('/feed');
        return { success: true };
    } catch (error) {
        console.error('Vote Comment Error:', error);
        return { success: false, message: 'Failed to vote.' };
    }
}

export async function deletePost(postId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (!post) {
            return { success: false, message: 'Post not found.' };
        }

        if (post.userId !== session.user.id) {
            return { success: false, message: 'Access denied: You are not the author.' };
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        revalidatePath('/feed');
        return { success: true, message: 'Post deleted.' };
    } catch (error) {
        console.error('Delete Post Error:', error);
        return { success: false, message: 'Failed to delete post.' };
    }
}

export async function reportPost(data: FormData | string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        let postId: string;
        let reason: string;
        let description = "";
        let severity = "LOW";
        let category = "OTHER";

        if (typeof data === 'string') {
            // Legacy/Simple call support
            postId = data;
            reason = "Inappropriate Content";
        } else {
            // FormData support
            postId = data.get('postId') as string;
            reason = data.get('title') as string || "Content Violation";
            description = data.get('description') as string || "";
            severity = data.get('severity') as string || "LOW";
            category = data.get('category') as string || "OTHER";
        }

        await prisma.report.create({
            data: {
                reporterId: session.user.id,
                targetType: 'POST',
                targetId: postId,
                reason: reason,
                adminNotes: JSON.stringify({ description }),
                severity,
                category,
                status: 'PENDING'
            }
        });

        return { success: true, message: 'Report filed. Administrators have been notified.' };
    } catch (error) {
        console.error('Report Post Error:', error);
        return { success: false, message: 'Failed to submit report.' };
    }
}

export async function getUserStats(userId: string) {
    try {
        // Post Impressions
        const posts = await prisma.post.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });
        const impressions = posts.reduce((acc, post) => acc + post._count.likes + post._count.comments, 0);

        // Profile Views (Rolling 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const viewsCount = await prisma.profileView.count({
            where: {
                profileId: userId,
                viewedAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        return { profileViews: viewsCount, impressions };
    } catch (error) {
        // Fallback for offline mode
        return { profileViews: 0, impressions: 0 };
    }
}

export async function logProfileView(profileId: string) {
    const session = await auth();
    // Do not log if not logged in or viewing own profile
    if (!session?.user?.id || session.user.id === profileId) {
        return { success: false };
    }

    try {
        const viewerId = session.user.id;

        // Check for recent view (within 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentView = await prisma.profileView.findFirst({
            where: {
                viewerId,
                profileId,
                viewedAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        if (!recentView) {
            // Log new view
            await prisma.profileView.create({
                data: {
                    viewerId,
                    profileId
                }
            });
            // Don't revalidate path generally, as this is a background stat
            return { success: true };
        }

        return { success: false, message: 'Already viewed recently' };

    } catch (error) {
        console.error('Log Profile View Error:', error);
        return { success: false };
    }
}

export async function votePoll(pollId: string, optionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Check for existing vote
            const existingVote = await tx.pollVote.findFirst({
                where: { pollId, userId }
            });

            if (existingVote) {
                // If clicking same option, remove vote (toggle off)
                if (existingVote.optionId === optionId) {
                    await tx.pollVote.delete({
                        where: { id: existingVote.id }
                    });
                    await tx.pollOption.update({
                        where: { id: optionId },
                        data: { votes: { decrement: 1 } }
                    });
                } else {
                    // Changing vote
                    await tx.pollVote.delete({
                        where: { id: existingVote.id }
                    });
                    await tx.pollOption.update({
                        where: { id: existingVote.optionId },
                        data: { votes: { decrement: 1 } }
                    });

                    // Add new vote
                    await tx.pollVote.create({
                        data: { pollId, optionId, userId }
                    });
                    await tx.pollOption.update({
                        where: { id: optionId },
                        data: { votes: { increment: 1 } }
                    });
                }
            } else {
                // New Vote
                await tx.pollVote.create({
                    data: { pollId, optionId, userId }
                });
                await tx.pollOption.update({
                    where: { id: optionId },
                    data: { votes: { increment: 1 } }
                });
            }
        });

        // Fetch updated poll data
        const updatedPoll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: { options: true }
        });

        revalidatePath('/feed');
        return { success: true, poll: updatedPoll };

    } catch (error) {
        console.error('Vote Poll Error:', error);
        return { success: false, message: 'Failed to record vote.' };
    }
}

export async function checkUsername(username: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Minimum length check
    if (username.length < 3) return { available: false, message: "Too short", suggestions: [] };

    // Strict Character Check (Server Side)
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validUsernameRegex.test(username)) {
        return { available: false, message: "Invalid characters. Only letters, numbers, and underscores allowed.", suggestions: [] };
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {
                username: { equals: username, mode: 'insensitive' },
                NOT: currentUserId ? { id: currentUserId } : undefined
            }
        });

        if (!existingUser) {
            return { available: true, suggestions: [] };
        }

        // Username is taken, generate suggestions
        const suggestions: string[] = [];
        let attempts = 0;

        while (suggestions.length < 3 && attempts < 10) {
            attempts++;
            const suffix = Math.floor(Math.random() * 1000);
            const candidate = `${username}${suffix}`;

            // Check candidate
            const taken = await prisma.user.findFirst({
                where: { username: { equals: candidate, mode: 'insensitive' } }
            });

            if (!taken && !suggestions.includes(candidate)) {
                suggestions.push(candidate);
            }
        }

        return {
            available: false,
            message: "Username is taken",
            suggestions
        };

    } catch (error) {
        console.error("Check Username Error:", error);
        // Fallback if DB invalid
        return { available: true, suggestions: [] };
    }
}
export async function getTrendingTopics() {
    try {
        // Fetch recent posts to analyze trends (limit to last 50 to perform runtime analysis)
        const recentPosts = await prisma.post.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: { content: true }
        });

        const hashtagCounts: Record<string, number> = {};

        recentPosts.forEach(post => {
            const matches = post.content.match(/#\w+/g);
            if (matches) {
                matches.forEach(tag => {
                    // Normalize tag: remove #, simplify case if needed, but keeping original casing is often better for display
                    // For counting, let's normalize to lowercase to merge variants
                    const normalized = tag.toLowerCase();
                    const cleanTag = tag.substring(1); // remove # for display

                    // Dictionary Key = lowercase, Value = { count, display }
                    // Actually, let's just count normalized and use the most common display variant? 
                    // Simpler: just use the exact tag string for now, maybe just lowercase for aggregation.

                    const key = cleanTag; // Case sensitive aggregation for specific branding? 
                    // Let's do Case insensitive aggregation

                    // Simplest approach: Just count them.
                    hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
                });
            }
        });

        // Convert to array and sort
        const sortedTags = Object.entries(hashtagCounts)
            .map(([tag, count]) => ({ tag, posts: count.toString() })) // Formatting posts count as string '2.4k' later if needed, but for now raw number
            .sort((a, b) => parseInt(b.posts) - parseInt(a.posts))
            .slice(0, 5);

        // Format counts (e.g. 1200 -> 1.2k)
        const formattedTags = sortedTags.map(t => {
            const count = parseInt(t.posts);
            let displayCount = t.posts;
            if (count >= 1000) {
                displayCount = (count / 1000).toFixed(1) + 'k';
            }
            return { tag: t.tag, posts: displayCount };
        });


        return formattedTags;
    } catch (error) {
        console.error("Get Trending Topics Error:", error);
        return [];
    }
}

// --- Social Graph ---

export async function toggleFollow(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    const userId = session.user.id;
    if (userId === targetUserId) return { success: false, message: "Cannot self-follow" };

    try {
        const existing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        });

        if (existing) {
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }
            });
            revalidatePath('/feed');
            return { success: true, following: false };
        } else {
            await prisma.follow.create({
                data: {
                    followerId: userId,
                    followingId: targetUserId
                }
            });
            revalidatePath('/feed');
            return { success: true, following: true };
        }
    } catch (error) {
        console.error("Toggle Follow Error:", error);
        return { success: false, message: "Action failed" };
    }
}

export async function searchUsers(query: string) {
    if (!query || query.length < 1) return [];
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5,
            select: { id: true, name: true, username: true, image: true }
        });
        return users;
    } catch (error) {
        console.error("Search Users Error:", error);
        return [];
    }
}

export async function getRecommendedUsers() {
    const session = await auth();
    const currentUserId = session?.user?.id;

    try {
        // 1. Get list of IDs I already follow
        let excludedIds: string[] = [];
        if (currentUserId) {
            excludedIds.push(currentUserId);
            const following = await prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true }
            });
            excludedIds = [...excludedIds, ...following.map(f => f.followingId)];
        }

        // 2. Fetch users NOT in that list
        const users = await prisma.user.findMany({
            where: {
                id: { notIn: excludedIds }
            },
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                headline: true,
                image: true
            }
        });

        // 3. Map to format (isFollowing is always false by definition here)
        const usersWithStatus = users.map(u => ({
            id: u.id,
            name: u.name || "Anonymous User",
            title: u.headline || "SkilledCore Member",
            image: u.image || "",
            isFollowing: false
        }));

        return usersWithStatus;
    } catch (error) {
        console.error("Get Recommended Users Error:", error);
        return [];
    }
}

// --- Follow Management ---

export async function getFollowers(userId: string) {
    try {
        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        headline: true
                    }
                }
            }
        });

        const session = await auth();
        const currentUserId = session?.user?.id;

        // Map to simpler structure and check if current user follows them (for follow back)
        const mapped = await Promise.all(followers.map(async f => {
            let isFollowing = false;
            if (currentUserId && f.followerId !== currentUserId) {
                const check = await prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: currentUserId,
                            followingId: f.followerId
                        }
                    }
                });
                isFollowing = !!check;
            }

            return {
                id: f.follower.id,
                name: f.follower.name,
                username: f.follower.username,
                image: f.follower.image,
                headline: f.follower.headline,
                isFollowing
            };
        }));

        return { success: true, users: mapped };
    } catch (error) {
        console.error("Get Followers Error:", error);
        return { success: false, users: [] };
    }
}

export async function getFollowing(userId: string) {
    try {
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        headline: true
                    }
                }
            }
        });

        // For "Following" list, the current user (if identical to profile owner) obviously follows them.
        // If viewing someone else's following list, we check if *we* also follow them.

        const session = await auth();
        const currentUserId = session?.user?.id;

        const mapped = await Promise.all(following.map(async f => {
            let isFollowing = false;
            // If viewing my own profile, I perform the check logically (I am following them).
            // If viewing someone else, check if *I* follow this person they follow.
            if (currentUserId) {
                const check = await prisma.follow.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: currentUserId,
                            followingId: f.followingId
                        }
                    }
                });
                isFollowing = !!check;
            }

            return {
                id: f.following.id,
                name: f.following.name,
                username: f.following.username,
                image: f.following.image,
                headline: f.following.headline,
                isFollowing
            };
        }));

        return { success: true, users: mapped };
    } catch (error) {
        console.error("Get Following Error:", error);
        return { success: false, users: [] };
    }
}

export async function removeFollower(followerId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // I am the 'following', they are the 'follower'. Remove record.
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: followerId,
                    followingId: session.user.id
                }
            }
        });

        revalidatePath('/profile');
        revalidatePath('/feed');
        return { success: true, message: "Follower removed." };
    } catch (error) {
        console.error("Remove Follower Error:", error);
        return { success: false, message: "Failed to remove follower." };
    }
}
