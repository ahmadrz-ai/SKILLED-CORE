import { prisma } from "@/lib/prisma";
import UsersTable from "./UsersTable";

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    // Fetch all users sorted by most recently created
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        // include: { role: true } // Role is direct on User on this schema variant
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">User Database</h1>

            <UsersTable users={users} />
        </div>
    );
}
