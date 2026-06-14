import { getNotifications, getMutedGroups } from "@/app/actions/notifications";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
    const [{ notifications }, mutedGroups] = await Promise.all([getNotifications(), getMutedGroups()]);

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
        <div className="w-full min-h-[calc(100vh-120px)] rounded-2xl">
            <NotificationsClient initialData={sanitizedNotifications} mutedGroups={mutedGroups} />
        </div>
    );
}
