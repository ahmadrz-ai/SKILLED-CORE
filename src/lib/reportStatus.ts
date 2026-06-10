// Canonical support-ticket / report status system (shared client + server).
// Stored Report.status values are normalized to these 4 keys; legacy values
// (UNDER_REVIEW/RESOLVED/DISMISSED) map onto them so old rows still sort/display.

export type ReportStatusKey = "PENDING" | "RESOLVING" | "COMPLETED" | "JUNK";

export const REPORT_STATUSES: { key: ReportStatusKey; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "RESOLVING", label: "Resolving" },
    { key: "COMPLETED", label: "Completed" },
    { key: "JUNK", label: "Junk" },
];

export function normalizeReportStatus(raw?: string | null): ReportStatusKey {
    const v = (raw || "").toUpperCase();
    if (v === "RESOLVING" || v === "UNDER_REVIEW") return "RESOLVING";
    if (v === "COMPLETED" || v === "RESOLVED") return "COMPLETED";
    if (v === "JUNK" || v === "DISMISSED") return "JUNK";
    return "PENDING";
}

export function reportStatusLabel(raw?: string | null): string {
    const key = normalizeReportStatus(raw);
    return REPORT_STATUSES.find((s) => s.key === key)!.label;
}

// Tailwind classes per status (uses registered status tokens).
export function reportStatusClasses(raw?: string | null): string {
    switch (normalizeReportStatus(raw)) {
        case "RESOLVING": return "bg-sc-amber-50 text-sc-amber-700 border-sc-amber-100";
        case "COMPLETED": return "bg-sc-green-50 text-sc-green-700 border-sc-green-100";
        case "JUNK": return "bg-bg-secondary-panel text-text-tertiary border-border-default";
        default: return "bg-sc-purple-50 text-sc-purple-700 border-sc-purple-200"; // Pending
    }
}
