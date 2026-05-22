import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SinglePostClient } from "./SinglePostClient";

export default async function SinglePostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Fetch the post from Neon DB
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    username: true,
                    headline: true,
                    nodeType: true,
                    role: true,
                    plan: true
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

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <SinglePostClient post={post} currentUserId={session.user.id} />
            </div>
        </div>
    );
}
