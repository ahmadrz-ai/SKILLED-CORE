import { prisma } from "@/lib/prisma";
import VerificationsTable from "./VerificationsTable";

export const dynamic = 'force-dynamic';

export default async function AdminVerificationsPage() {
    const requests = await prisma.verificationRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: true },
        orderBy: { createdAt: 'asc' }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">Pending Verifications</h1>
            <p className="text-zinc-400">Review and validate agent credentials.</p>

            <VerificationsTable requests={requests} />
        </div>
    );
}
