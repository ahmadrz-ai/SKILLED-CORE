'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import {
    Search, MoreHorizontal, Shield, ShieldAlert,
    Trash2, RefreshCw, CheckCircle2, Eye, EyeOff,
    ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { toggleUserRole, deleteUser, toggleUserGhostMode } from '../actions';
import { toast } from 'sonner';

interface UsersTableProps {
    users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [sortField, setSortField] = useState<'identity' | 'role' | 'status' | 'ghost' | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSort = (field: 'identity' | 'role' | 'status' | 'ghost') => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!sortField || !sortDirection) return 0;

        let valA = '';
        let valB = '';

        if (sortField === 'identity') {
            valA = a.name?.toLowerCase() || '';
            valB = b.name?.toLowerCase() || '';
        } else if (sortField === 'role') {
            valA = ((a as any).role || 'CANDIDATE').toLowerCase();
            valB = ((b as any).role || 'CANDIDATE').toLowerCase();
        } else if (sortField === 'status') {
            valA = 'active';
            valB = 'active';
        } else if (sortField === 'ghost') {
            const ghostA = a.ghostMode ? 1 : 0;
            const ghostB = b.ghostMode ? 1 : 0;
            return sortDirection === 'asc' ? ghostA - ghostB : ghostB - ghostA;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        setIsLoading(userId);
        const result = await toggleUserRole(userId, currentRole);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
            // Re-render the server component with fresh DB data so the row's role
            // updates immediately (the toast used to fire while the cell stayed stale).
            router.refresh();
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

    const handleGhostToggle = async (userId: string, currentGhostMode: boolean) => {
        setIsLoading(userId);
        const result = await toggleUserGhostMode(userId, currentGhostMode);
        setIsLoading(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">Total Operatives</span>
                    <span className="text-2xl font-bold text-text-heading font-mono mt-1">{users.length}</span>
                </div>
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">Ghosted IDs (Stealth Mode)</span>
                    <span className="text-2xl font-bold text-amber-500 font-mono mt-1">{users.filter(u => u.ghostMode).length}</span>
                </div>
                <div className="bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-center">
                    <span className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">Live in Find Talent (Visible)</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono mt-1">{users.filter(u => !u.ghostMode).length}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search operatives..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-bg-input border border-border-default rounded-lg pl-10 pr-4 py-2 text-sm text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-border-focus w-64"
                    />
                </div>
                <div className="text-xs text-text-tertiary font-mono">
                    TOTAL OPERATIVES: {users.length}
                </div>
            </div>

            {/* Table */}
            <div className="bg-bg-secondary-panel border border-border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-secondary-panel">
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('identity')}
                                title="Click to sort alphabetically"
                            >
                                <div className="flex items-center gap-1.5">
                                    Identity
                                    {sortField === 'identity' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'identity' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('role')}
                                title="Click to sort by Role"
                            >
                                <div className="flex items-center gap-1.5">
                                    Role
                                    {sortField === 'role' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'role' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('status')}
                                title="Click to sort by Status"
                            >
                                <div className="flex items-center gap-1.5">
                                    Status
                                    {sortField === 'status' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'status' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th 
                                className="p-4 font-medium text-text-secondary cursor-pointer select-none hover:text-text-heading transition-colors"
                                onClick={() => handleSort('ghost')}
                                title="Click to sort by Ghost Protocol status"
                            >
                                <div className="flex items-center gap-1.5">
                                    Ghost Protocol
                                    {sortField === 'ghost' && sortDirection === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : sortField === 'ghost' && sortDirection === 'desc' ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-sc-purple-600" />
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary hover:text-text-secondary" />
                                    )}
                                </div>
                            </th>
                            <th className="p-4 font-medium text-text-secondary text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map((user) => (
                            <tr key={user.id} className="border-b border-border-subtle hover:bg-bg-sidebar-hover transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-8 h-8 rounded-full bg-bg-secondary-panel flex items-center justify-center overflow-hidden border border-border-default">
                                            {user.image ? <Image src={user.image} alt="" fill sizes="32px" className="object-cover" /> : user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-text-heading">{user.name}</div>
                                            <div className="text-xs text-text-tertiary">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${(user as any).role === 'ADMIN'
                                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                            : (user as any).role === 'RECRUITER'
                                                ? 'bg-sc-purple-50 text-sc-purple-600 border-sc-purple-200'
                                                : 'bg-bg-secondary-panel text-text-tertiary border-border-default'}
                                    `}>
                                        {(user as any).role || 'CANDIDATE'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center text-emerald-600 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Active
                                    </div>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleGhostToggle(user.id, user.ghostMode)}
                                        disabled={isLoading === user.id}
                                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 border flex items-center gap-1.5 ${
                                            user.ghostMode
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                        title={user.ghostMode ? "Unghost this user (make them live)" : "Ghost this user (hide them from organizations)"}
                                    >
                                        {isLoading === user.id ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : user.ghostMode ? (
                                            <EyeOff className="w-3.5 h-3.5" />
                                        ) : (
                                            <Eye className="w-3.5 h-3.5" />
                                        )}
                                        {user.ghostMode ? 'GHOSTED' : 'LIVE'}
                                    </button>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleRoleToggle(user.id, (user as any).role || 'CANDIDATE')}
                                        disabled={isLoading === user.id}
                                        className="p-2 hover:bg-bg-sidebar-hover rounded-lg transition-colors text-text-secondary hover:text-text-heading disabled:opacity-50"
                                        title="Toggle Role (Candidate <-> Recruiter)"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoading === user.id ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        disabled={isLoading === user.id}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary hover:text-red-500 disabled:opacity-50"
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
                    <div className="p-12 text-center text-text-tertiary">
                        No operatives found matching search parameters.
                    </div>
                )}
            </div>
        </div>
    );
}
