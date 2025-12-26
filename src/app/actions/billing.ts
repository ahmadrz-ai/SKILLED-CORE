'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createPaymentRequest(
    amount: number,
    credits: number,
    trxId: string,
    provider: string,
    type: 'CREDITS' | 'PLAN' = 'CREDITS',
    planName?: string
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    if (!trxId.trim()) return { success: false, message: "Transaction ID is required" };

    try {
        await prisma.transaction.create({
            data: {
                userId: session.user.id,
                amount,
                credits,
                status: 'PENDING',
                provider,
                refId: trxId,
                type,
                planName
            }
        });

        revalidatePath('/settings');
        revalidatePath('/credits');
        return { success: true, message: "Payment request submitted. Admin will approve shortly." };
    } catch (error) {
        console.error("Create Payment Request Error (Detailed):", JSON.stringify(error, null, 2));
        console.error("Original Error:", error);
        return { success: false, message: "Failed to submit request. (Tip: Try restarting the server if DB fields are missing)" };
    }
}

// --- Admin Actions ---

export async function getAdminTransactions() {
    const session = await auth();
    // In real app, strictly check session.user.role === 'ADMIN'
    // For now, assuming current user is admin or we check specific ID if needed.
    // Better: const user = await prisma.user.findUnique({where: {id: session.user.id}}); if (user.role !== 'ADMIN') ...

    if (!session?.user?.id) return { success: false, transactions: [] };

    // STRICT ADMIN CHECK
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== 'ADMIN') return { success: false, message: "Unauthorized", transactions: [] };

    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true, image: true } } }
        });
        return { success: true, transactions };
    } catch (error) {
        return { success: false, transactions: [] };
    }
}

export async function approveTransaction(transactionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (admin?.role !== 'ADMIN') return { success: false, message: "Admins only" };

        const trx = await prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!trx || trx.status !== 'PENDING') return { success: false, message: "Invalid transaction" };

        const updates: any[] = [
            prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' }
            })
        ];

        // Handle Type
        if (trx.type === 'PLAN' && trx.planName) {
            updates.push(prisma.user.update({
                where: { id: trx.userId },
                data: { plan: trx.planName }
            }));
        } else {
            // Default to credits
            updates.push(prisma.user.update({
                where: { id: trx.userId },
                data: { credits: { increment: trx.credits } }
            }));
        }

        await prisma.$transaction(updates);

        revalidatePath('/admin/billing');
        return { success: true, message: "Transaction approved." };
    } catch (error) {
        console.error("Approve Transaction Error:", error);
        return { success: false, message: "Failed to approve" };
    }
}

export async function rejectTransaction(transactionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Unauthorized" };

    try {
        const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (admin?.role !== 'ADMIN') return { success: false, message: "Admins only" };

        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'REJECTED' }
        });

        revalidatePath('/admin/billing');
        return { success: true, message: "Transaction rejected." };
    } catch (error) {
        return { success: false, message: "Failed to reject" };
    }
}

export async function getTransactions() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, transactions: [] };

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, transactions };
    } catch (error) {
        return { success: false, transactions: [] };
    }
}
