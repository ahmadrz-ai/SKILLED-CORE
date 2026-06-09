import AdminReportDetail from "./AdminReportDetail";

export const dynamic = "force-dynamic";

export default async function AdminReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <AdminReportDetail reportId={id} />;
}
