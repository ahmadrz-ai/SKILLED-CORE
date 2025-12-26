'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();


// --- Profile Updates ---

export async function updateUserProfile(data: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        // 1. Prepare User Update Data
        const userUpdateData: any = {};
        if (data.name) userUpdateData.name = data.name;
        if (data.headline !== undefined) userUpdateData.headline = data.headline;
        if (data.location !== undefined) userUpdateData.location = data.location;
        if (data.bio !== undefined) userUpdateData.bio = data.bio;
        if (data.bannerUrl !== undefined) userUpdateData.bannerUrl = data.bannerUrl;
        if (data.resumeUrl !== undefined) userUpdateData.resumeUrl = data.resumeUrl;
        if (data.username !== undefined) userUpdateData.username = data.username ? data.username.toLowerCase().trim() : null;
        if (data.image !== undefined) userUpdateData.image = data.image;

        // Handle Skills (supports array or string)
        if (data.skills !== undefined) {
            userUpdateData.skills = typeof data.skills === 'string'
                ? data.skills
                : JSON.stringify(data.skills);
        }

        // Handle Custom Links
        if (data.customLinks !== undefined) {
            userUpdateData.customLinks = data.customLinks; // Expected valid JSON string
        }

        // Execute Basic Info Update
        if (Object.keys(userUpdateData).length > 0) {
            // Check for file deletion (Resume)
            if (userUpdateData.resumeUrl) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { resumeUrl: true }
                });

                if (currentUser?.resumeUrl) {
                    const oldKey = currentUser.resumeUrl.split('/').pop();
                    if (oldKey) {
                        try {
                            await utapi.deleteFiles(oldKey);
                            console.log(`Deleted old resume: ${oldKey}`);
                        } catch (error) {
                            console.error("Failed to delete old resume:", error);
                        }
                    }
                }
            }

            await prisma.user.update({
                where: { id: session.user.id },
                data: userUpdateData
            });
        }


        // 2. Update Experience (Atomic: Delete All & Re-create)
        if (data.experience && Array.isArray(data.experience)) {
            // Use array-based transaction for atomicity of this specific section if possible, 
            // or just sequential for now to avoid the error. Going sequential.
            await prisma.experience.deleteMany({ where: { userId: session.user.id } });
            if (data.experience.length > 0) {
                await prisma.experience.createMany({
                    data: data.experience.map((exp: any) => ({
                        userId: session.user.id!,
                        position: exp.position || exp.role || exp.title || "Unknown Role",
                        company: exp.company || "Unknown Company",
                        startDate: exp.startDate || exp.start || "",
                        endDate: exp.endDate || exp.end || "",
                        description: exp.description || exp.desc || ""
                    }))
                });
            }
        }

        // 3. Update Education (Atomic: Delete All & Re-create)
        if (data.education && Array.isArray(data.education)) {
            await prisma.education.deleteMany({ where: { userId: session.user.id } });
            if (data.education.length > 0) {
                await prisma.education.createMany({
                    data: data.education.map((edu: any) => ({
                        userId: session.user.id!,
                        school: edu.school || "Unknown School",
                        degree: edu.degree || "Unknown Degree",
                        fieldOfStudy: edu.fieldOfStudy || "",
                        startDate: edu.year || edu.startDate || "",
                        endDate: "",
                        description: ""
                    }))
                });
            }
        }

        revalidatePath('/profile');
        revalidatePath(`/profile/${session.user.id}`);
        revalidatePath('/profile/me');
        return { success: true };

    } catch (error: any) {
        console.error("Update Profile Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return { success: false, message: "Username already taken." };
        }
        return { success: false, message: "Failed to update profile." };
    }
}

// --- Project Management ---

export async function addProject(data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        await prisma.project.create({
            data: {
                userId: session.user.id,
                title: data.title,
                description: data.description,
                link: data.link,
                imageUrl: data.imageUrl
            }
        });
        revalidatePath('/profile/me');
        return { success: true };
    } catch (error) {
        console.error("Add Project Error:", error);
        return { success: false, message: "Failed to create project" };
    }
}

export async function updateProject(projectId: string, data: any) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // Verify ownership
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                title: data.title,
                description: data.description,
                link: data.link,
                imageUrl: data.imageUrl
            }
        });
        revalidatePath('/profile/me');
        return { success: true };
    } catch (error) {
        console.error("Update Project Error:", error);
        return { success: false, message: "Failed to update project" };
    }
}

export async function deleteProject(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        // Verify ownership
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.userId !== session.user.id) {
            return { success: false, message: "Unauthorized" };
        }

        await prisma.project.delete({ where: { id: projectId } });
        revalidatePath('/profile/me');
        return { success: true };
    } catch (error) {
        console.error("Delete Project Error:", error);
        return { success: false, message: "Failed to delete project" };
    }
}
