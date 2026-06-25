"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/ably";
import { spendCredit } from "@/lib/credits";
import { currentPlanCode } from "@/lib/plans";

const DEFAULT_EXPIRY_DAYS = 7;

/** Mark any REQUESTED bookings whose accept-window has passed as EXPIRED. */
async function expireStaleBookings(userId: string) {
    try {
        const stale = await prisma.booking.findMany({
            where: { candidateId: userId, status: "REQUESTED", expiresAt: { lt: new Date() } },
            select: { id: true, recruiterId: true, candidate: { select: { name: true } } },
        });
        if (stale.length === 0) return;

        await prisma.booking.updateMany({
            where: { id: { in: stale.map((s) => s.id) } },
            data: { status: "EXPIRED" },
        });

        // Let each recruiter know their request lapsed before it was accepted.
        for (const b of stale) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: b.recruiterId,
                        type: "BOOKING_EXPIRED",
                        message: `⏳ Your interview request to <strong>${b.candidate?.name || "a candidate"}</strong> expired before it was accepted.`,
                        resourcePath: "/bookings",
                        read: false,
                    },
                });
                await notifyUser(b.recruiterId);
            } catch (e) { console.error("BOOKING_EXPIRED notify failed:", e); }
        }
    } catch (e) {
        console.error("expireStaleBookings failed:", e);
    }
}

type Role = "ADMIN" | "RECRUITER" | "CANDIDATE" | string;

async function getCaller() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, role: true, plan: true },
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
    expiresInDays?: number; // accept window; default 7 days
}): Promise<{ success: boolean; bookingId?: string; message?: string }> {
    const caller = await getCaller();
    if (!caller) return { success: false, message: "Unauthorized" };

    if (caller.role !== "RECRUITER" && caller.role !== "ADMIN") {
        return { success: false, message: "Only recruiters can book interviews." };
    }
    // Soft paywall: a recruiter needs an active recruiter plan to book interviews.
    // Admins bypass. Mirrors the /hire gate so the wall can't be skipped via profile.
    if (caller.role === "RECRUITER" && !currentPlanCode(caller.plan, "recruiter")) {
        return { success: false, message: "An active recruiter plan is required to book interviews. Choose a plan on the Plans & Billing page." };
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

        // Accept window: recruiter-set (clamped 1–30 days) or default 7 days.
        const days = Math.min(30, Math.max(1, Math.round(input.expiresInDays || DEFAULT_EXPIRY_DAYS)));
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const booking = await prisma.booking.create({
            data: {
                recruiterId: caller.id,
                candidateId: input.candidateId,
                jobId: input.jobId || null,
                proposedAt: when,
                message: input.message?.trim() || null,
                status: "REQUESTED",
                expiresAt,
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
        await notifyUser(input.candidateId); // realtime badge nudge

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

    // Lazily expire stale requests so the list (and counts) stay honest.
    await expireStaleBookings(caller.id);

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
        // Accept window closed?
        if (decision === "CONFIRMED" && booking.expiresAt && booking.expiresAt.getTime() < Date.now()) {
            await prisma.booking.update({ where: { id: bookingId }, data: { status: "EXPIRED" } }).catch(() => {});
            return { success: false, message: "This interview request has expired." };
        }

        // Accepting costs 1 General credit (general → topUp). Declining is free.
        let creditUsed: "general" | "topup" | undefined;
        if (decision === "CONFIRMED" && !booking.acceptCostCharged) {
            const spend = await spendCredit(caller.id, "general");
            if (!spend.success) {
                return { success: false, message: "You need at least 1 General credit to accept this interview." };
            }
            creditUsed = spend.used as "general" | "topup";
        }

        // On confirm, generate a ready-to-use video room. Jitsi public rooms need no API
        // key or setup, so the link works immediately; the cuid bookingId keeps it
        // unguessable. Swap this for a managed provider (Daily/100ms/Zoom) later by
        // changing only this line.
        const meetingUrl = decision === "CONFIRMED" ? `https://meet.jit.si/skilledcore-${bookingId}` : null;

        try {
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: decision,
                    ...(meetingUrl ? { meetingUrl } : {}),
                    ...(decision === "CONFIRMED" ? { acceptCostCharged: true } : {}),
                },
            });
        } catch (updateErr) {
            // Refund the General credit if the confirm couldn't be saved.
            if (creditUsed) {
                const field = creditUsed === "topup" ? "topUpCredits" : "generalCredits";
                await prisma.user.update({ where: { id: caller.id }, data: { [field]: { increment: 1 } } }).catch(() => {});
            }
            throw updateErr;
        }

        try {
            await prisma.notification.create({
                data: {
                    userId: booking.recruiterId,
                    type: decision === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_DECLINED",
                    message:
                        decision === "CONFIRMED"
                            ? `<strong>${caller.name || "The candidate"}</strong> accepted your interview request. A video room is ready in your bookings.`
                            : `<strong>${caller.name || "The candidate"}</strong> declined your interview request.`,
                    actorId: caller.id,
                    resourcePath: "/bookings",
                },
            });
        } catch (e) {
            console.error("Booking response notification failed:", e);
        }

        revalidatePath("/bookings");
        revalidatePath("/credits");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("respondToBooking failed:", error);
        return { success: false, message: "Could not update the booking." };
    }
}

/** Recruiter marks a confirmed interview as a successful hire (outcome loop). */
export async function markHired(bookingId: string): Promise<{ success: boolean; message?: string }> {
    const caller = await getCaller();
    if (!caller) return { success: false, message: "Unauthorized" };

    try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return { success: false, message: "Booking not found." };
        if (booking.recruiterId !== caller.id && caller.role !== "ADMIN") {
            return { success: false, message: "Only the recruiter can mark this hire." };
        }
        if (booking.status !== "CONFIRMED") {
            return { success: false, message: "You can only mark a confirmed interview as hired." };
        }

        await prisma.booking.update({ where: { id: bookingId }, data: { status: "HIRED", hiredAt: new Date() } });

        try {
            await prisma.notification.create({
                data: {
                    userId: booking.candidateId,
                    type: "HIRED",
                    message: `🎉 <strong>${caller.name || "A recruiter"}</strong> marked you as hired. Congratulations!`,
                    actorId: caller.id,
                    resourcePath: "/bookings",
                },
            });
        } catch (e) {
            console.error("Hire notification failed:", e);
        }
        await notifyUser(booking.candidateId);

        revalidatePath("/bookings");
        return { success: true };
    } catch (error) {
        console.error("markHired failed:", error);
        return { success: false, message: "Could not update the hire status." };
    }
}

/** Public social-proof counter: total successful hires made via SkilledCore. */
export async function getHireCount(): Promise<number> {
    try {
        return await prisma.booking.count({ where: { status: "HIRED" } });
    } catch {
        return 0;
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
