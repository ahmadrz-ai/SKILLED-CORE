import { prisma } from "@/lib/prisma";
import ReportsDashboard from "./ReportsDashboard";

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
    // 1. Fetch incident reports
    const incidentReports = await prisma.report.findMany({
        include: {
            reporter: true,
            reportedUser: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch system support reports
    const systemReports = await prisma.systemReport.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <ReportsDashboard 
            incidentReports={incidentReports} 
            systemReports={systemReports} 
        />
    );
}
