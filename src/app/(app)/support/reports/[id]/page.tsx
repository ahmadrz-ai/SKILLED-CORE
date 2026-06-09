import UserReportThread from "./UserReportThread";

export const dynamic = "force-dynamic";

export default async function UserReportThreadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <UserReportThread reportId={id} />;
}
