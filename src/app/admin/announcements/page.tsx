import AnnouncementForm from "./AnnouncementForm";

export const metadata = { title: "Announcements | Admin" };

export default function AnnouncementsPage() {
    return (
        <div className="space-y-6">
            <div className="border-b border-border-default pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-text-heading">Announcements</h1>
                <p className="text-sm text-text-secondary mt-1">Broadcast a notification to your members. It appears in their bell and notifications inbox.</p>
            </div>
            <AnnouncementForm />
        </div>
    );
}
