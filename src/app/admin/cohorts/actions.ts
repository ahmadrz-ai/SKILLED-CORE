"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const dataDir = path.join(process.cwd(), "src/data");
const filePath = path.join(dataDir, "partner-applications.json");

// Read existing applications
async function readApplications() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (e) {}

    try {
        const fileData = await fs.readFile(filePath, "utf-8");
        return JSON.parse(fileData);
    } catch (e) {
        return [];
    }
}

// Write applications back
async function writeApplications(data: any[]) {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
        return true;
    } catch (e) {
        console.error("Failed to write partner-applications.json:", e);
        return false;
    }
}

export async function getDesignPartnerApplications() {
    try {
        const applications = await readApplications();
        return { success: true, applications };
    } catch (error) {
        console.error("Failed to fetch applications:", error);
        return { success: false, applications: [], message: "Failed to read database." };
    }
}

export async function updateApplicationCohort(ticketId: string, cohort: string, status: string = "ACCEPTED") {
    try {
        const applications = await readApplications();
        const updated = applications.map((app: any) => {
            if (app.id === ticketId) {
                return {
                    ...app,
                    cohort,
                    status,
                    updatedAt: new Date().toISOString()
                };
            }
            return app;
        });

        const success = await writeApplications(updated);
        if (success) {
            revalidatePath("/admin/cohorts");
            return { success: true, message: `Successfully assigned to ${cohort}.` };
        }
        return { success: false, message: "Failed to write updates." };
    } catch (error) {
        console.error("Failed to update cohort:", error);
        return { success: false, message: "Server transaction error." };
    }
}

export async function dispatchSlaResponse(ticketId: string, responseNotes: string) {
    try {
        const applications = await readApplications();
        const updated = applications.map((app: any) => {
            if (app.id === ticketId) {
                return {
                    ...app,
                    status: "RESPONDED",
                    slaResponse: responseNotes,
                    respondedAt: new Date().toISOString()
                };
            }
            return app;
        });

        const success = await writeApplications(updated);
        if (success) {
            revalidatePath("/admin/cohorts");
            return { success: true, message: "Personalized SLA confirmation dispatched successfully!" };
        }
        return { success: false, message: "Failed to save response." };
    } catch (error) {
        console.error("Failed to dispatch SLA response:", error);
        return { success: false, message: "Server transaction error." };
    }
}
