"use server";

import fs from "fs/promises";
import path from "path";

export async function applyDesignPartnerPilot(formData: {
    name: string;
    company: string;
    teamSize: number;
    mistake: string;
}) {
    if (!formData.name || !formData.company || !formData.teamSize || !formData.mistake) {
        return { success: false, message: "All 4 fields are mandatory for pilot registration." };
    }

    try {
        const ticketId = `SC-DP-${Math.floor(1000 + Math.random() * 9000)}`;
        const timestamp = new Date().toISOString();
        
        const newApplication = {
            id: ticketId,
            ...formData,
            status: "PENDING",
            createdAt: timestamp
        };

        const dataDir = path.join(process.cwd(), "src/data");
        const filePath = path.join(dataDir, "partner-applications.json");

        // Ensure directory exists
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (e) {}

        // Read existing applications
        let applications = [];
        try {
            const fileData = await fs.readFile(filePath, "utf-8");
            applications = JSON.parse(fileData);
        } catch (e) {
            // File does not exist yet or corrupted
        }

        // Add and save
        applications.push(newApplication);
        await fs.writeFile(filePath, JSON.stringify(applications, null, 2), "utf-8");

        console.log(`[Design Partner App] Created ticket ${ticketId} for ${formData.name} (${formData.company})`);

        return {
            success: true,
            ticketId,
            name: formData.name,
            company: formData.company,
            teamSize: formData.teamSize,
            mistake: formData.mistake,
            message: "Design Partner application registered successfully!"
        };

    } catch (error: any) {
        console.error("Design Partner Action Error:", error);
        return { success: false, message: "System transmission error. Please retry." };
    }
}
