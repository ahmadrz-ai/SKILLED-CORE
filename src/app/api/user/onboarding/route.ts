
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            role, name, username, image, headline, bio, skills,
            companyName, industry, workEmail,
            location, portfolio, linkedin, github, experience
        } = body;

        // Build update data based on role
        let updateData: any = {
            role,
            name,
            username: username ? username.toLowerCase().trim() : null, // Store sanitized username
            image,
            headline,
            bio,
            skills: Array.isArray(skills) ? JSON.stringify(skills) : skills,
            // resumeUrl removed
            location,
            portfolio,
            linkedin,
            github
        };

        // Handle Experience (Reset & Recreate)
        if (experience && Array.isArray(experience)) {
            await prisma.experience.deleteMany({ where: { userId: session.user.id } });

            // Filter out empty entries if any
            const validExperience = experience.filter((e: any) => e.role && e.company);

            if (validExperience.length > 0) {
                await prisma.experience.createMany({
                    data: validExperience.map((e: any) => ({
                        userId: session.user.id,
                        position: e.role, // Frontend uses 'role', DB uses 'position'
                        company: e.company,
                        startDate: e.start || "",
                        endDate: e.end || null,
                        description: e.desc || ""
                    }))
                });
            }
        }

        // If Recruiter, Create/Connect Company
        if (role === 'recruiter' && companyName) {
            // Try to find existing company
            let company = await prisma.company.findFirst({
                where: { name: companyName }
            });

            if (!company) {
                company = await prisma.company.create({
                    data: {
                        name: companyName,
                        description: industry
                    }
                });
            }

            updateData.companyId = company.id;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        // AUTOMATIC VERIFICATION REQUEST
        // Check if one exists to avoid duplicates
        const existingRequest = await prisma.verificationRequest.findFirst({
            where: { userId: session.user.id, status: 'PENDING' }
        });

        if (!existingRequest) {
            await prisma.verificationRequest.create({
                data: {
                    userId: session.user.id,
                    type: 'ACCOUNT_REVIEW',
                    documentUrl: 'AUTO_GENERATED', // Placeholder for implementation simplicity
                    status: 'PENDING'
                }
            });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error("Onboarding error:", error);

        // Handle Unique Username Constraint
        if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
            return NextResponse.json(
                { error: "Username already taken." },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to save profile" },
            { status: 500 }
        );
    }
}
