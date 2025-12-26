import { prisma } from "@/lib/prisma";
import ReportsTable from "./ReportsTable";

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
    const reports = await prisma.report.findMany({
        where: { status: 'PENDING' },
        include: {
            reporter: true,
            reportedUser: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">Incident Reports</h1>
            <p className="text-zinc-400">Monitor and resolve community violations.</p>

            <ReportsTable reports={reports} />
        </div>
    );
}
