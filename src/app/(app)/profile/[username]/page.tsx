
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

interface PageProps {
    params: Promise<{
        username: string;
    }>;
}

export default async function ProfilePage({ params }: PageProps) {
    try {
        const session = await auth();
        console.log("ProfilePage: Session loaded", session?.user?.id);
        const { username } = await params;
        console.log("ProfilePage: Username", username);

        let user;
        let isOwner = false;

        // Resolve 'me' to current user
        if (username === 'me') {
            if (!session?.user?.id) {
                console.log("ProfilePage: No session, redirecting");
                redirect('/login');
            }
            console.log("ProfilePage: Fetching user", session.user.id);
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: {
                    experience: true,
                    education: true,
                    projects: true,
                    interviews: { orderBy: { createdAt: 'desc' } }, // Fetch all for owner
                    posts: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            author: {
                                select: {
                                    name: true,
                                    image: true,
                                    username: true,
                                    headline: true,
                                    nodeType: true,
                                    role: true
                                }
                            },
                            likes: true,
                            _count: {
                                select: { comments: true }
                            },
                            poll: {
                                include: {
                                    options: true,
                                }
                            }
                        }
                    }
                }
            });
            isOwner = true;
        } else {
            console.log("ProfilePage: Fetching public profile", username);
            user = await prisma.user.findFirst({
                where: { username },
                include: {
                    experience: true,
                    education: true,
                    projects: true,
                    interviews: {
                        where: { isPublic: true },
                        orderBy: { createdAt: 'desc' }
                    },
                    _count: {
                        select: { followers: true, following: true }
                    },
                    posts: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            author: {
                                select: {
                                    name: true,
                                    image: true,
                                    username: true,
                                    headline: true,
                                    nodeType: true,
                                    role: true
                                }
                            },
                            likes: true,
                            _count: {
                                select: { comments: true }
                            },
                            poll: {
                                include: {
                                    options: true,
                                }
                            }
                        }
                    }
                }
            });

            if (user && session?.user?.id && user.id !== session.user.id) {
                // Log view if searching for someone else
                const { logProfileView } = await import("../../feed/actions");
                await logProfileView(user.id);
            } else if (user && session?.user?.id && user.id === session.user.id) {
                isOwner = true;
            }
        }

        let isFollowing = false;
        if (session?.user?.id && user && user.id !== session.user.id) {
            const followCheck = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: session.user.id,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!followCheck;
        }

        if (username === 'me' && user) {
            // Fetch counts for self too if not fetched above
            // The logic above for 'me' didn't include _count. Let's fix that.
            const counts = await prisma.user.findUnique({
                where: { id: session!.user!.id },
                select: { _count: { select: { followers: true, following: true } } }
            });
            (user as any)._count = counts?._count;
        }

        if (!user) {
            console.log("ProfilePage: User not found");
            redirect('/feed');
        }

        // Fetch connection status
        let connectionStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' = 'NONE';
        if (session?.user?.id && user.id !== session.user.id) {
            const { getConnectionStatus } = await import('../../network/actions');
            connectionStatus = await getConnectionStatus(user.id) as any;
        }

        console.log("ProfilePage: Rendering client");
        return (
            <ProfileClient
                user={JSON.parse(JSON.stringify(user))}
                isOwner={isOwner}
                isFollowing={isFollowing}
                connectionStatus={connectionStatus}
                posts={user.posts || []}
                counts={(user as any)._count || { followers: 0, following: 0 }}
            />
        );
    } catch (e: any) {
        if (e?.digest?.startsWith('NEXT_REDIRECT')) {
            throw e;
        }
        console.error("CRITICAL ERROR IN PROFILE PAGE:", e);
        throw e;
    }
}
