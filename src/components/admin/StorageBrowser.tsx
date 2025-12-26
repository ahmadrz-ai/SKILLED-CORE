'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, HardDrive, FileText, Download, Trash2, ExternalLink, CheckSquare, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteFiles } from '@/app/admin/actions';

interface StorageBrowserProps {
    files: any[];
    dbStats: any;
}

export default function StorageBrowser({ files: initialFiles, dbStats }: StorageBrowserProps) {
    const [activeTab, setActiveTab] = useState<'neon' | 'uploadthing'>('neon');
    const [files, setFiles] = useState(initialFiles);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelect = (key: string) => {
        const next = new Set(selectedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelectedKeys(next);
    };

    const toggleSelectAll = () => {
        if (selectedKeys.size === files.length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(files.map(f => f.key)));
        }
    };

    const handleDelete = async () => {
        if (selectedKeys.size === 0) return;
        if (!confirm(`Permanently delete ${selectedKeys.size} files?`)) return;

        setIsDeleting(true);
        const keysArray = Array.from(selectedKeys);
        const res = await deleteFiles(keysArray);
        setIsDeleting(false);

        if (res.success) {
            toast.success(`Deleted ${selectedKeys.size} files`);
            setFiles(files.filter(f => !selectedKeys.has(f.key)));
            setSelectedKeys(new Set());
        } else {
            toast.error(res.message || "Deletion failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-zinc-900/50 border border-white/5 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('neon')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'neon' ? "bg-violet-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <Database className="w-4 h-4" /> Neon DB
                    </button>
                    <button
                        onClick={() => setActiveTab('uploadthing')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'uploadthing' ? "bg-red-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        <HardDrive className="w-4 h-4" /> UploadThing
                    </button>
                </div>

                {/* Bulk Actions */}
                {activeTab === 'uploadthing' && selectedKeys.size > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-red-900/20"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        DELETE SELECTION ({selectedKeys.size})
                    </motion.button>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'neon' ? (
                        <motion.div
                            key="neon"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            <StatCard label="Total Users" value={dbStats.users} icon={Database} color="violet" />
                            <StatCard label="Active Jobs" value={dbStats.jobs} icon={FileText} color="blue" />
                            <StatCard label="Applications" value={dbStats.applications} icon={FileText} color="emerald" />
                            <StatCard label="Total Posts" value={dbStats.posts} icon={FileText} color="amber" />

                            <div className="col-span-full mt-8 p-6 bg-zinc-900/30 border border-white/5 rounded-xl">
                                <h3 className="text-lg font-bold text-white mb-4">Database Health</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-zinc-400">Connection Pool</span>
                                        <span className="text-green-400 font-mono">OPTIMAL</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-zinc-400">Query Latency</span>
                                        <span className="text-green-400 font-mono">12ms (avg)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Region</span>
                                        <span className="text-white font-mono">us-east-1</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="uploadthing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                            title="Select All"
                                        >
                                            {selectedKeys.size > 0 && selectedKeys.size === files.length ? (
                                                <CheckSquare className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <h3 className="font-bold text-white text-sm">Recent Uploads</h3>
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500">{files.length} ITEMS FETCHED</span>
                                </div>
                                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                                    {files.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-500 italic">No files found.</div>
                                    ) : files.map((file) => {
                                        const isSelected = selectedKeys.has(file.key);
                                        return (
                                            <div
                                                key={file.key}
                                                className={cn(
                                                    "p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer",
                                                    isSelected && "bg-red-500/5 border-l-2 border-red-500"
                                                )}
                                                onClick={() => toggleSelect(file.key)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(file.key); }}>
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-red-500" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-sm font-medium transition-colors truncate max-w-[200px] md:max-w-[400px]", isSelected ? "text-red-200" : "text-white")}>
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 font-mono">{file.key}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-500 font-mono hidden md:block">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <a
                                                        href={`https://utfs.io/f/${file.key}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors = {
        violet: "text-violet-500 bg-violet-500/10 border-violet-500/20",
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        red: "text-red-500 bg-red-500/10 border-red-500/20",
    };

    // @ts-ignore
    const theme = colors[color] || colors.violet;

    return (
        <div className={cn("p-6 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-105", theme)}>
            <Icon className="w-8 h-8 mb-2 opacity-80" />
            <h3 className="text-3xl font-black">{value}</h3>
            <p className="text-xs uppercase tracking-widest opacity-70 font-mono">{label}</p>
        </div>
    );
}

