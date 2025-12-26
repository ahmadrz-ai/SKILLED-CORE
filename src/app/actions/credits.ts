"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCredits() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });
        return user?.credits || 0;
    } catch (error) {
        console.error("Get Credits Error (returning 0):", error);
        return 0;
    }
}

export async function addCredits(amount: number) {
    const session = await auth();
    if (!session?.user?.id) return;

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { increment: amount } }
        });
        revalidatePath("/credits");
    } catch (error) {
        console.error("Add Credits Error:", error);
    }
}

export async function deductCredits(amount: number) {
    const session = await auth();
    if (!session?.user?.id) return false;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });

        if (!user || user.credits < amount) {
            return { success: false, remaining: user?.credits || 0 };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: amount } }
        });

        const updatedUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });

        revalidatePath("/credits");
        return { success: true, remaining: updatedUser?.credits || 0 };
    } catch (error) {
        console.error("Deduct Credits Error:", error);
        return { success: false, remaining: 0 };
    }
}

export async function getPlan() {
    const session = await auth();
    if (!session?.user?.id) return "BASIC";

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true }
        });
        return user?.plan || "BASIC";
    } catch (error) {
        console.error("Get Plan Error (returning BASIC):", error);
        return "BASIC";
    }
}

export async function upgradePlan(plan: "BASIC" | "PRO" | "ULTRA") {
    const session = await auth();
    if (!session?.user?.id) return;

    const creditsToAdd = plan === "ULTRA" ? 100 : plan === "PRO" ? 50 : 0;

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            plan,
            credits: { increment: creditsToAdd }
        }
    });

    revalidatePath("/credits");
    revalidatePath("/analytics");
    revalidatePath("/feed");
    revalidatePath("/profile");
    revalidatePath("/", "layout"); // Revalidate sidebar
}
