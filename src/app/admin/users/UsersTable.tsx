'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import {
    Search, MoreHorizontal, Shield, ShieldAlert,
    Trash2, RefreshCw, CheckCircle2
} from 'lucide-react';
import { toggleUserRole, deleteUser } from '../actions';
import { toast } from 'sonner';

interface UsersTableProps {
    users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        setIsLoading(userId);
        const result = await toggleUserRole(userId, currentRole);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) return;

        setIsLoading(userId);
        const result = await deleteUser(userId);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search operatives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 w-64"
                    />
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    TOTAL OPERATIVES: {users.length}
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="p-4 font-medium text-zinc-400">Identity</th>
                            <th className="p-4 font-medium text-zinc-400">Role</th>
                            <th className="p-4 font-medium text-zinc-400">Status</th>
                            <th className="p-4 font-medium text-zinc-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                                            {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{user.name}</div>
                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${(user as any).role === 'ADMIN'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : (user as any).role === 'RECRUITER'
                                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}
                                    `}>
                                        {(user as any).role || 'CANDIDATE'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center text-teal-500 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Active
                                    </div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleRoleToggle(user.id, (user as any).role || 'CANDIDATE')}
                                        disabled={isLoading === user.id}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
                                        title="Toggle Role (Candidate <-> Recruiter)"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoading === user.id ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        disabled={isLoading === user.id}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-400 hover:text-red-500 disabled:opacity-50"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center text-zinc-500">
                        No operatives found matching search parameters.
                    </div>
                )}
            </div>
        </div>
    );
}
