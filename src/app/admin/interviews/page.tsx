import { prisma } from "@/lib/prisma";
import InterviewsTable from "./InterviewsTable";

export const dynamic = 'force-dynamic';

export default async function AdminInterviewsPage() {
    // Fetch all interviews with user information, sorted by newest first
    const interviews = await prisma.interview.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                    username: true,
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">AI Interview Simulations</h1>
            <InterviewsTable interviews={interviews} />
        </div>
    );
}
