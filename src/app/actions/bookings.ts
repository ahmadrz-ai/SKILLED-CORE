"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Role = "ADMIN" | "RECRUITER" | "CANDIDATE" | string;

async function getCaller() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, role: true },
    });
    return user;
}

/**
 * Recruiter (or admin) requests an interview with a candidate.
 * Creates a REQUESTED booking and notifies the candidate.
 */
export async function createBooking(input: {
    candidateId: string;
    proposedAt: string; // ISO datetime
    message?: string;
    jobId?: string;
}): Promise<{ success: boolean; bookingId?: string; message?: string }> {
    const caller = await getCaller();
    if (!caller) return { success: false, message: "Unauthorized" };

    if (caller.role !== "RECRUITER" && caller.role !== "ADMIN") {
        return { success: false, message: "Only recruiters can book interviews." };
    }
    if (caller.id === input.candidateId) {
        return { success: false, message: "You can't book an interview with yourself." };
    }
    const when = new Date(input.proposedAt);
    if (isNaN(when.getTime())) return { success: false, message: "Please choose a valid date and time." };
    if (when.getTime() < Date.now() - 60_000) {
        return { success: false, message: "Please choose a time in the future." };
    }

    try {
        const candidate = await prisma.user.findUnique({
            where: { id: input.candidateId },
            select: { id: true, name: true },
        });
        if (!candidate) return { success: false, message: "Candidate not found." };

        // Prevent duplicate active requests to the same candidate.
        const existing = await prisma.booking.findFirst({
            where: {
                recruiterId: caller.id,
                candidateId: input.candidateId,
                status: { in: ["REQUESTED", "CONFIRMED"] },
            },
        });
        if (existing) {
            return { success: false, message: "You already have an active interview with this candidate." };
        }

        const booking = await prisma.booking.create({
            data: {
                recruiterId: caller.id,
                candidateId: input.candidateId,
                jobId: input.jobId || null,
                proposedAt: when,
                message: input.message?.trim() || null,
                status: "REQUESTED",
            },
        });

        // Notify the candidate.
        try {
            await prisma.notification.create({
                data: {
                    userId: input.candidateId,
                    type: "BOOKING_REQUEST",
                    message: `<strong>${caller.name || "A recruiter"}</strong> requested an interview with you.`,
                    actorId: caller.id,
                    resourcePath: "/bookings",
                },
            });
        } catch (e) {
            console.error("Booking notification failed:", e);
        }

        revalidatePath("/bookings");
        revalidatePath("/", "layout");
        return { success: true, bookingId: booking.id };
    } catch (error) {
        console.error("createBooking failed:", error);
        return { success: false, message: "Could not create the booking. Please try again." };
    }
}

/** Bookings for the current user, split into ones they sent (recruiter) and received (candidate). */
export async function getMyBookings(): Promise<{
    asRecruiter: any[];
    asCandidate: any[];
}> {
    const caller = await getCaller();
    if (!caller) return { asRecruiter: [], asCandidate: [] };

    try {
        const [asRecruiter, asCandidate] = await Promise.all([
            prisma.booking.findMany({
                where: { recruiterId: caller.id },
                orderBy: { proposedAt: "desc" },
                include: { candidate: { select: { id: true, name: true, username: true, image: true, headline: true } } },
            }),
            prisma.booking.findMany({
                where: { candidateId: caller.id },
                orderBy: { proposedAt: "desc" },
                include: { recruiter: { select: { id: true, name: true, username: true, image: true, headline: true } } },
            }),
        ]);
        return {
            asRecruiter: JSON.parse(JSON.stringify(asRecruiter)),
            asCandidate: JSON.parse(JSON.stringify(asCandidate)),
        };
    } catch (error) {
        console.error("getMyBookings failed:", error);
        return { asRecruiter: [], asCandidate: [] };
    }
}

/** Candidate accepts or declines a booking request addressed to them. */
export async function respondToBooking(
    bookingId: string,
    decision: "CONFIRMED" | "DECLINED"
): Promise<{ success: boolean; message?: string }> {
    const caller = await getCaller();
    if (!caller) return { success: false, message: "Unauthorized" };

    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return { success: false, message: "Booking not found." };
        if (booking.candidateId !== caller.id) {
            return { success: false, message: "Only the candidate can respond to this request." };
        }
        if (booking.status !== "REQUESTED") {
            return { success: false, message: "This request has already been handled." };
        }

        await prisma.booking.update({ where: { id: bookingId }, data: { status: decision } });

        try {
            await prisma.notification.create({
                data: {
                    userId: booking.recruiterId,
                    type: decision === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_DECLINED",
                    message:
                        decision === "CONFIRMED"
                            ? `<strong>${caller.name || "The candidate"}</strong> accepted your interview request.`
                            : `<strong>${caller.name || "The candidate"}</strong> declined your interview request.`,
                    actorId: caller.id,
                    resourcePath: "/bookings",
                },
            });
        } catch (e) {
            console.error("Booking response notification failed:", e);
        }

        revalidatePath("/bookings");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("respondToBooking failed:", error);
        return { success: false, message: "Could not update the booking." };
    }
}

/** Either party cancels a booking (recruiter cancels a request, or anyone cancels a confirmed one). */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; message?: string }> {
    const caller = await getCaller();
    if (!caller) return { success: false, message: "Unauthorized" };

    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return { success: false, message: "Booking not found." };
        if (booking.recruiterId !== caller.id && booking.candidateId !== caller.id && caller.role !== "ADMIN") {
            return { success: false, message: "You can't cancel this booking." };
        }
        if (booking.status === "CANCELLED" || booking.status === "DECLINED") {
            return { success: false, message: "This booking is already closed." };
        }

        await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

        // Notify the other party.
        const otherUserId = caller.id === booking.recruiterId ? booking.candidateId : booking.recruiterId;
        try {
            await prisma.notification.create({
                data: {
                    userId: otherUserId,
                    type: "BOOKING_CANCELLED",
                    message: `<strong>${caller.name || "Someone"}</strong> cancelled an interview booking.`,
                    actorId: caller.id,
                    resourcePath: "/bookings",
                },
            });
        } catch (e) {
            console.error("Booking cancel notification failed:", e);
        }

        revalidatePath("/bookings");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("cancelBooking failed:", error);
        return { success: false, message: "Could not cancel the booking." };
    }
}
