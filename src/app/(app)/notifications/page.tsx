import { getNotifications } from "@/app/actions/notifications";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
    const { notifications } = await getNotifications();

    // Map to ensure types (handle nulls if any)
    const sanitizedNotifications = (notifications || []).map(n => ({
        ...n,
        actor: n.actor ? {
            name: n.actor.name,
            image: n.actor.image,
            role: n.actor.role
        } : null
    }));

    return (
        <div className="min-h-screen bg-obsidian">
            <NotificationsClient initialData={sanitizedNotifications} />
        </div>
    );
}
