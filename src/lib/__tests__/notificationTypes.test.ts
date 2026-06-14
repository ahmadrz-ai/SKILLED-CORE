import { describe, it, expect } from "vitest";
import { NOTIFICATION_TYPES, getNotifMeta, FALLBACK_NOTIF_META } from "../notificationTypes";

describe("notification type registry", () => {
    it("maps a known type to its group", () => {
        expect(getNotifMeta("BADGE_EARNED").group).toBe("interview");
        expect(getNotifMeta("MESSAGE").group).toBe("messages");
    });

    it("falls back gracefully for an unknown type", () => {
        expect(getNotifMeta("___NOPE___")).toBe(FALLBACK_NOTIF_META);
        expect(getNotifMeta("___NOPE___").label).toBe("Notification");
    });

    it("every registered type has an icon, a color, and a valid group", () => {
        const validGroups = new Set(["social", "network", "messages", "jobs", "interview", "billing", "system"]);
        for (const [key, meta] of Object.entries(NOTIFICATION_TYPES)) {
            expect(meta.Icon, `${key} missing Icon`).toBeTruthy();
            expect(meta.color, `${key} missing color`).toBeTruthy();
            expect(validGroups.has(meta.group), `${key} has invalid group ${meta.group}`).toBe(true);
            expect(meta.label, `${key} missing label`).toBeTruthy();
        }
    });
});
