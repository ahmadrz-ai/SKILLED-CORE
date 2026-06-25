
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid request body.", field: "body" }, { status: 400 });
        }

        const {
            role, name, username, image, headline, bio, skills,
            companyName, industry, workEmail,
            location, portfolio, linkedin, github, experience, education
        } = body as Record<string, any>;

        // Explicit input validation — return a structured 400 for bad input so the
        // frontend can show a useful message, instead of letting Prisma throw a bare 500.
        if (typeof role !== "string" || !role.trim()) {
            return NextResponse.json({ error: "A role is required to complete onboarding.", field: "role" }, { status: 400 });
        }
        if (username != null && typeof username !== "string") {
            return NextResponse.json({ error: "Username must be text.", field: "username" }, { status: 400 });
        }
        if (skills != null && !Array.isArray(skills) && typeof skills !== "string") {
            return NextResponse.json({ error: "Skills must be a list.", field: "skills" }, { status: 400 });
        }
        if (experience != null && !Array.isArray(experience)) {
            return NextResponse.json({ error: "Experience must be a list.", field: "experience" }, { status: 400 });
        }
        if (education != null && !Array.isArray(education)) {
            return NextResponse.json({ error: "Education must be a list.", field: "education" }, { status: 400 });
        }

        // Build update data based on role.
        // onboardedAt marks completion explicitly so "Skip" works even when the user
        // hasn't filled a headline (previously the layout gate relied on headline and
        // bounced skippers back to onboarding).
        const updateData: any = {
            role,
            onboardedAt: new Date(),
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

        // Handle Education (Reset & Recreate)
        if (education && Array.isArray(education)) {
            await prisma.education.deleteMany({ where: { userId: session.user.id } });

            const validEducation = education.filter((e: any) => e.school && e.degree);

            if (validEducation.length > 0) {
                await prisma.education.createMany({
                    data: validEducation.map((e: any) => ({
                        userId: session.user.id,
                        school: e.school,
                        degree: e.degree,
                        startDate: e.start || null,
                        endDate: e.end || null,
                    }))
                });
            }
        }

        // If Recruiter, Create/Connect Company (role may arrive as "RECRUITER" or "recruiter")
        if (typeof role === 'string' && role.toLowerCase() === 'recruiter' && companyName) {
            // Try to find existing company by name
            let company = await prisma.company.findFirst({
                where: { name: companyName }
            });

            if (!company) {
                // Build a URL-safe, unique slug for the public /company/[slug] page.
                const base = String(companyName)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-+|-+$)/g, "")
                    .slice(0, 50) || "company";
                let slug = base;
                let n = 1;
                // Ensure uniqueness against the @unique slug column.
                while (await prisma.company.findUnique({ where: { slug } })) {
                    slug = `${base}-${n++}`;
                }

                company = await prisma.company.create({
                    data: {
                        name: companyName,
                        slug,
                        industry: industry || null,
                        location: location || null,
                        description: null,
                    }
                });
            } else if (!company.slug) {
                // Backfill a slug for a pre-existing company record that never had one.
                const base = String(company.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-+|-+$)/g, "")
                    .slice(0, 50) || "company";
                let slug = base;
                let n = 1;
                while (await prisma.company.findUnique({ where: { slug } })) {
                    slug = `${base}-${n++}`;
                }
                await prisma.company.update({ where: { id: company.id }, data: { slug } });
            }

            updateData.companyId = company.id;
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });

        // AUTOMATIC VERIFICATION REQUEST (non-critical)
        // The profile is already saved and onboarding is marked complete above. This
        // verification insert is a nice-to-have, so a failure here must NOT turn a
        // successful onboarding into a 500. Wrap it defensively.
        try {
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
        } catch (verificationError) {
            console.error("Onboarding: verification request creation failed (non-fatal):", verificationError);
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
