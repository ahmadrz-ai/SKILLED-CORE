
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        username: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params;
    
    let targetUserId: string | null = null;
    try {
        if (username === 'me') {
            const session = await auth();
            targetUserId = session?.user?.id || null;
        } else {
            const resolvedUserByUsername = await prisma.user.findFirst({
                where: { username },
                select: { id: true }
            });
            if (resolvedUserByUsername) {
                targetUserId = resolvedUserByUsername.id;
            } else {
                const resolvedUserById = await prisma.user.findUnique({
                    where: { id: username },
                    select: { id: true }
                }).catch(() => null);
                if (resolvedUserById) {
                    targetUserId = resolvedUserById.id;
                }
            }
        }

        if (targetUserId) {
            const user = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { name: true, searchIndexable: true }
            });

            if (user && user.searchIndexable === false) {
                return {
                    title: `${user.name}'s Profile | SkilledCore`,
                    robots: {
                        index: false,
                        follow: false,
                    }
                };
            }
            if (user) {
                return {
                    title: `${user.name}'s Profile | SkilledCore`,
                    description: `Explore ${user.name}'s verified professional portfolio, skills assessments, and timeline on SkilledCore.`
                };
            }
        }
    } catch (e) {
        console.error("Failed to generate profile metadata:", e);
    }

    return {
        title: 'Profile | SkilledCore',
    };
}

export default async function ProfilePage({ params }: PageProps) {
    try {
        const session = await auth();
        console.log("ProfilePage: Session loaded", session?.user?.id);
        const { username } = await params;
        console.log("ProfilePage: Username", username);

        let isAdmin = false;
        let callerRole: string | null = null;
        if (session?.user?.id) {
            const caller = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { role: true }
            });
            callerRole = caller?.role ?? null;
            isAdmin = caller?.role === "ADMIN" || caller?.role === "Admin";
        }

        let targetUserId: string | null = null;
        if (username === 'me') {
            targetUserId = session?.user?.id || null;
        } else {
            const resolvedUserByUsername = await prisma.user.findFirst({
                where: { username },
                select: { id: true }
            });
            if (resolvedUserByUsername) {
                targetUserId = resolvedUserByUsername.id;
            } else {
                const resolvedUserById = await prisma.user.findUnique({
                    where: { id: username },
                    select: { id: true }
                }).catch(() => null);
                if (resolvedUserById) {
                    targetUserId = resolvedUserById.id;
                }
            }
        }

        const isOwner = !!(session?.user?.id && targetUserId && session.user.id === targetUserId);

        let user = null;
        if (targetUserId) {
            user = await prisma.user.findUnique({
                where: { id: targetUserId },
                include: {
                    experience: true,
                    education: true,
                    projects: true,
                    interviews: {
                        where: (isOwner || isAdmin) ? undefined : { isPublic: true },
                        orderBy: { createdAt: 'desc' }
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
                    },
                    _count: {
                        select: { followers: true, following: true }
                    }
                }
            });
        }

        if (!user) {
            console.log("ProfilePage: User not found");
            redirect('/feed');
        }

        if (session?.user?.id && user.id !== session.user.id) {
            // Log view if searching for someone else
            const { logProfileView } = await import("../../feed/actions");
            await logProfileView(user.id);
        }

        let isFollowing = false;
        if (session?.user?.id && user.id !== session.user.id) {
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

        // Fetch connection status
        let connectionStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' = 'NONE';
        if (session?.user?.id && user.id !== session.user.id) {
            const { getConnectionStatus } = await import('../../network/actions');
            connectionStatus = await getConnectionStatus(user.id) as any;
        }

        // Recruiters must book interviews to access a candidate's resume / socials /
        // direct contact. Candidates and admins are never restricted; viewing your own
        // profile or another recruiter is unrestricted.
        const isRestrictedViewer =
            callerRole === "RECRUITER" && !isOwner && !isAdmin && user.role !== "RECRUITER";

        console.log("ProfilePage: Rendering client");
        return (
            <ProfileClient
                user={JSON.parse(JSON.stringify(user))}
                isOwner={isOwner}
                isFollowing={isFollowing}
                connectionStatus={connectionStatus}
                posts={user.posts || []}
                counts={user._count || { followers: 0, following: 0 }}
                isAdmin={isAdmin}
                isRestrictedViewer={isRestrictedViewer}
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

