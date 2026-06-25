'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, HardDrive, Cloud, FileText, Download, Trash2,
    ExternalLink, CheckSquare, Square, Loader2, Search, Copy, Check, Image,
    ScanSearch, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteFiles, scanStorageForOrphans, getStorageFiles, getCloudinaryFiles } from '@/app/admin/actions';

interface StorageBrowserProps {
    uploadthingFiles: any[];
    cloudinaryFiles: any[];
    dbStats: any;
}

export default function StorageBrowser({ 
    uploadthingFiles: initialUtFiles, 
    cloudinaryFiles: initialClFiles, 
    dbStats 
}: StorageBrowserProps) {
    const [activeTab, setActiveTab] = useState<'neon' | 'uploadthing' | 'cloudinary'>('neon');
    const [utFiles, setUtFiles] = useState(initialUtFiles);
    const [clFiles, setClFiles] = useState(initialClFiles);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Orphan scan: keys flagged not-referenced-in-DB (safe to delete). Live files are
    // never included, so the admin can never accidentally delete the in-use copy.
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [orphanKeys, setOrphanKeys] = useState<Set<string>>(new Set());
    const [orphanBytes, setOrphanBytes] = useState(0);

    // Lazy-load: storage listings are fetched the first time their tab is opened,
    // not on dashboard load (Phase 4 — keeps /admin fast).
    const [utLoaded, setUtLoaded] = useState(initialUtFiles.length > 0);
    const [clLoaded, setClLoaded] = useState(initialClFiles.length > 0);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Plan capacities in bytes
    const NEON_CAPACITY = 512 * 1024 * 1024;       // 512 MB
    const UT_CAPACITY = 2 * 1024 * 1024 * 1024;     // 2 GB
    const CLOUDINARY_CAPACITY = 10 * 1024 * 1024 * 1024; // 10 GB

    const getStorageStats = () => {
        switch (activeTab) {
            case 'neon':
                return {
                    name: 'Neon DB',
                    used: dbStats?.dbSize || 0,
                    total: NEON_CAPACITY,
                    colorClass: 'bg-sc-purple-600',
                    gradientClass: 'from-sc-purple-500 to-sc-purple-700',
                    textClass: 'text-sc-purple-600',
                };
            case 'uploadthing':
                return {
                    name: 'Documents Repository',
                    used: utFiles.reduce((acc, f) => acc + (f.size || 0), 0),
                    total: UT_CAPACITY,
                    colorClass: 'bg-sc-purple-600',
                    gradientClass: 'from-sc-purple-500 to-sc-purple-700',
                    textClass: 'text-sc-purple-600',
                };
            case 'cloudinary':
                return {
                    name: 'Cloudinary',
                    used: clFiles.reduce((acc, f) => acc + (f.size || 0), 0),
                    total: CLOUDINARY_CAPACITY,
                    colorClass: 'bg-sc-purple-600',
                    gradientClass: 'from-sc-purple-500 to-sc-purple-700',
                    textClass: 'text-sc-purple-600',
                };
        }
    };

    const stats = getStorageStats();
    const percent = Math.min(100, Math.max(0, (stats.used / stats.total) * 100));

    // Get files based on active tab
    const getActiveFilesList = () => {
        if (activeTab === 'uploadthing') return utFiles;
        if (activeTab === 'cloudinary') return clFiles;
        return [];
    };

    const activeFiles = getActiveFilesList();

    // Filter files based on search query
    const filteredFiles = activeFiles.filter(file => {
        const query = searchQuery.toLowerCase();
        return (
            file.name?.toLowerCase().includes(query) ||
            file.key?.toLowerCase().includes(query)
        );
    });

    const toggleSelect = (key: string) => {
        const next = new Set(selectedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelectedKeys(next);
    };

    const toggleSelectAll = () => {
        if (selectedKeys.size === filteredFiles.length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(filteredFiles.map(f => f.key)));
        }
    };

    const handleDelete = async () => {
        if (selectedKeys.size === 0) return;
        if (!confirm(`Permanently delete ${selectedKeys.size} selected files?`)) return;

        setIsDeleting(true);
        const keysArray = Array.from(selectedKeys);
        const res = await deleteFiles(keysArray, activeTab === 'neon' ? undefined : activeTab);
        setIsDeleting(false);

        if (res.success) {
            toast.success(res.message);
            if (activeTab === 'uploadthing') {
                setUtFiles(prev => prev.filter(f => !selectedKeys.has(f.key)));
            } else if (activeTab === 'cloudinary') {
                setClFiles(prev => prev.filter(f => !selectedKeys.has(f.key)));
            }
            setSelectedKeys(new Set());
        } else {
            toast.error(res.message || "Deletion failed");
        }
    };

    const handleTabChange = async (tab: 'neon' | 'uploadthing' | 'cloudinary') => {
        setActiveTab(tab);
        setSelectedKeys(new Set());
        setSearchQuery('');

        // Fetch the provider's files the first time its tab is opened.
        if (tab === 'uploadthing' && !utLoaded) {
            setIsLoadingFiles(true);
            const res = await getStorageFiles();
            if (res.success) setUtFiles([...res.files]);
            setUtLoaded(true);
            setIsLoadingFiles(false);
        } else if (tab === 'cloudinary' && !clLoaded) {
            setIsLoadingFiles(true);
            const res = await getCloudinaryFiles();
            if (res.success) setClFiles(res.files);
            setClLoaded(true);
            setIsLoadingFiles(false);
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        const res = await scanStorageForOrphans();
        setIsScanning(false);
        if (!res.success) {
            toast.error("Scan failed. Please try again.");
            return;
        }
        const keys = new Set<string>(res.orphanKeys.map((o: any) => o.key));
        setOrphanKeys(keys);
        setOrphanBytes(res.orphanBytes || 0);
        setScanned(true);
        toast.success(`${res.orphanCount} orphan file(s) found across storage — live files are protected.`);
    };

    // Select only the orphan files visible in the current tab (never live files).
    const selectOrphansInTab = () => {
        const tabOrphans = filteredFiles.filter(f => orphanKeys.has(f.key)).map(f => f.key);
        setSelectedKeys(new Set(tabOrphans));
        if (tabOrphans.length === 0) toast.info("No orphan files in this tab.");
    };

    const copyToClipboard = (url: string, key: string) => {
        navigator.clipboard.writeText(url);
        setCopiedKey(key);
        toast.success("Direct link copied");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 1;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const isImage = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-bg-secondary-panel border border-border-default rounded-xl w-fit relative overflow-hidden">
                    <button
                        onClick={() => handleTabChange('neon')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10",
                            activeTab === 'neon' ? "text-white" : "text-text-tertiary hover:text-text-body"
                        )}
                    >
                        {activeTab === 'neon' && (
                            <motion.div 
                                layoutId="active-tab-indicator" 
                                className="absolute inset-0 bg-sc-purple-600 rounded-lg -z-10 shadow-lg shadow-sc-sm" 
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                        <Database className="w-4 h-4" /> Neon DB
                    </button>
                    <button
                        onClick={() => handleTabChange('uploadthing')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10",
                            activeTab === 'uploadthing' ? "text-white" : "text-text-tertiary hover:text-text-body"
                        )}
                    >
                        {activeTab === 'uploadthing' && (
                            <motion.div 
                                layoutId="active-tab-indicator" 
                                className="absolute inset-0 bg-sc-purple-600 rounded-lg -z-10 shadow-lg shadow-sc-sm"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                        <HardDrive className="w-4 h-4" /> UploadThing
                    </button>
                    <button
                        onClick={() => handleTabChange('cloudinary')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative z-10",
                            activeTab === 'cloudinary' ? "text-white" : "text-text-tertiary hover:text-text-body"
                        )}
                    >
                        {activeTab === 'cloudinary' && (
                            <motion.div 
                                layoutId="active-tab-indicator" 
                                className="absolute inset-0 bg-sc-purple-600 rounded-lg -z-10 shadow-lg shadow-sc-sm"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                        )}
                        <Cloud className="w-4 h-4" /> Cloudinary
                    </button>

                </div>

                {/* Search & Actions Area */}
                {activeTab !== 'neon' && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'uploadthing' ? 'documents' : 'media'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-bg-input border border-border-default rounded-xl py-2 pl-9 pr-4 text-sm text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-sc-purple-300 transition-all font-sans"
                            />
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            title="Scan storage and mark duplicate/orphan files that are no longer referenced in the database. Live files are never marked."
                            className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold cursor-pointer h-[38px] transition-colors shrink-0"
                        >
                            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                            <span className="hidden md:inline">Scan Duplicates</span>
                        </button>

                        {selectedKeys.size > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-red-900/25 border border-red-400/10 cursor-pointer h-[38px] transition-colors"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                <span className="hidden md:inline">Delete Selected</span> ({selectedKeys.size})
                            </motion.button>
                        )}
                    </div>
                )}
            </div>

            {/* Storage Intelligence Meter & Pie Chart Section */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-bg-card border border-border-default rounded-2xl p-6 backdrop-blur-md relative overflow-hidden"
            >
                {/* Visual Accent/Glow behind */}
                <div className={cn(
                    "absolute -right-24 -top-24 w-48 h-48 rounded-full filter blur-[80px] opacity-20 pointer-events-none transition-all duration-500",
                    activeTab === 'neon' ? "bg-sc-purple-600" : activeTab === 'uploadthing' ? "bg-sc-purple-600" : activeTab === 'cloudinary' ? "bg-sc-purple-600" : "bg-amber-500"
                )} />

                {/* Storage Meter Column */}
                <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-bg-secondary-panel font-sans",
                                activeTab === 'neon' ? "text-sc-purple-600 border-sc-purple-200" :
                                activeTab === 'uploadthing' ? "text-sc-purple-600 border-sc-purple-200" :
                                activeTab === 'cloudinary' ? "text-sc-purple-600 border-sc-purple-200" :
                                "text-amber-400 border-amber-500/25"
                            )}>
                                Active Allocation
                            </span>
                            <span className="text-text-tertiary text-xs font-mono">• {stats.name} Capacity</span>
                        </div>
                        <h2 className="text-2xl font-black text-text-heading tracking-tight font-sans">
                            Storage Overview
                        </h2>
                        <p className="text-sm text-text-secondary mt-1 max-w-md font-sans">
                            {activeTab === 'neon' && "Real-time database footprints tracking operational records and tables."}
                            {activeTab === 'uploadthing' && "Active file upload bandwidth representing onboarding documents and recruiter attachments."}
                            {activeTab === 'cloudinary' && "Visual media storage showing branding elements, profile banners, and recruiters images."}
                        </p>
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <div className="flex items-baseline gap-1.5 font-sans">
                                <span className="text-3xl font-extrabold text-text-heading">{formatBytes(stats.used)}</span>
                                <span className="text-text-tertiary text-xs font-medium">used out of {formatBytes(stats.total)}</span>
                            </div>
                            <span className={cn("text-lg font-black font-mono", stats.textClass)}>
                                {percent.toFixed(2)}%
                            </span>
                        </div>

                        {/* Linear Progress Bar */}
                        <div className="h-3 w-full bg-bg-secondary-panel border border-border-default rounded-full overflow-hidden p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={cn("h-full rounded-full bg-gradient-to-r shadow-lg shadow-sc-sm", stats.gradientClass)}
                            />
                        </div>

                        <div className="flex justify-between text-xs font-mono text-text-tertiary">
                            <span>0% (Empty)</span>
                            <span>Remaining: {formatBytes(Math.max(0, stats.total - stats.used))}</span>
                            <span>100% (Limit)</span>
                        </div>
                    </div>
                </div>

                {/* SVG Pie Chart Column */}
                <div className="flex flex-col items-center justify-center p-4 border-t lg:border-t-0 lg:border-l border-border-default min-h-[220px]">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* SVG Gradients definitions */}
                            <defs>
                                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#c084fc" />
                                </linearGradient>
                                <linearGradient id="utGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#5B35D5" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                                <linearGradient id="clGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#5B35D5" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>

                            {/* Background Circle representing Total */}
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                className="stroke-gray-200 fill-none"
                                strokeWidth="8"
                            />
                            
                            {/* Background border circle to add luxury edge */}
                            <circle
                                cx="50"
                                cy="50"
                                r="38"
                                className="stroke-gray-200 fill-none"
                                strokeWidth="8.5"
                            />

                            {/* Active Used Segment */}
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="38"
                                className="fill-none"
                                strokeWidth="8"
                                strokeDasharray={238.76} // 2 * Math.PI * 38
                                initial={{ strokeDashoffset: 238.76 }}
                                animate={{ strokeDashoffset: 238.76 - (238.76 * percent) / 100 }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                                stroke={
                                    activeTab === 'neon' ? "url(#neonGrad)" :
                                    activeTab === 'uploadthing' ? "url(#utGrad)" :
                                    "url(#clGrad)"
                                }
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Center text of Doughnut Pie Chart */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-text-tertiary text-[10px] uppercase font-bold tracking-widest font-sans">Used</span>
                            <span className="text-lg font-black text-text-heading font-mono">{percent.toFixed(1)}%</span>
                            <span className="text-text-secondary text-[9px] font-medium font-sans mt-0.5">{formatBytes(stats.used)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className={cn("w-2.5 h-2.5 rounded-full", stats.colorClass)} />
                            <span className="text-text-secondary">Used ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-bg-secondary-panel border border-border-default" />
                            <span className="text-text-tertiary">Free ({(100 - percent).toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'neon' ? (
                        <motion.div
                            key="neon"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            <StatCard label="Total Users" value={dbStats.users} icon={Database} color="violet" />
                            <StatCard label="Active Jobs" value={dbStats.jobs} icon={FileText} color="blue" />
                            <StatCard label="Applications" value={dbStats.applications} icon={FileText} color="emerald" />
                            <StatCard label="Total Posts" value={dbStats.posts} icon={FileText} color="amber" />

                            <div className="col-span-full mt-4 p-6 bg-bg-card border border-border-default rounded-2xl backdrop-blur-md">
                                <h3 className="text-base font-bold text-text-heading mb-4 tracking-tight">Database Connectivity</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-border-subtle pb-2.5">
                                        <span className="text-text-secondary">Connection Pool</span>
                                        <span className="text-emerald-400 font-sans font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-xs">OPTIMAL</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-border-subtle pb-2.5">
                                        <span className="text-text-secondary">Query Latency</span>
                                        <span className="text-emerald-400 font-sans font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-xs">12ms (avg)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-secondary">Region</span>
                                        <span className="text-text-heading font-mono font-medium">us-east-1 (AWS)</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {scanned && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="font-semibold text-amber-200">
                                            {filteredFiles.filter(f => orphanKeys.has(f.key)).length} orphan file(s) in this tab
                                        </span>
                                        <span className="text-amber-200/70 font-mono text-xs">
                                            • ~{formatBytes(orphanBytes)} reclaimable across all storage • live files protected
                                        </span>
                                    </div>
                                    <button
                                        onClick={selectOrphansInTab}
                                        className="text-xs font-bold text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                                    >
                                        Select orphans
                                    </button>
                                </div>
                            )}
                            <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden backdrop-blur-md">
                                <div className="p-4 border-b border-border-default flex justify-between items-center bg-bg-secondary-panel">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="text-text-tertiary hover:text-text-body transition-colors cursor-pointer"
                                            title="Select All"
                                        >
                                            {selectedKeys.size > 0 && selectedKeys.size === filteredFiles.length ? (
                                                <CheckSquare className="w-5 h-5 text-sc-purple-600" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <h3 className="font-bold text-text-heading text-sm font-sans tracking-tight">
                                            {activeTab === 'uploadthing' ? 'Documents Repository' : 'Cloudinary Assets'}
                                        </h3>
                                    </div>
                                    <span className="text-xs font-mono text-text-tertiary">{filteredFiles.length} OF {activeFiles.length} FILES</span>
                                </div>
                                <div className="divide-y divide-zinc-800/60 max-h-[500px] overflow-y-auto">
                                    {isLoadingFiles ? (
                                        <div className="p-12 flex items-center justify-center gap-2 text-text-tertiary text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading files…
                                        </div>
                                    ) : filteredFiles.length === 0 ? (
                                        <div className="p-12 text-center text-text-tertiary italic text-sm">No files found matching search.</div>
                                    ) : filteredFiles.map((file) => {
                                         const isSelected = selectedKeys.has(file.key);
                                         const fileUrl = activeTab === 'uploadthing' ? `https://utfs.io/f/${file.key}` : file.url;
                                         const fileIsImage = activeTab === 'cloudinary' || isImage(file.name);

                                        return (
                                            <div
                                                key={file.key}
                                                className={cn(
                                                    "p-4 flex items-center justify-between hover:bg-bg-sidebar-hover transition-colors group cursor-pointer border-l-2 border-transparent",
                                                    isSelected && "bg-sc-purple-50 border-sc-purple-600"
                                                )}
                                                onClick={() => toggleSelect(file.key)}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(file.key); }}>
                                                        {isSelected ? (
                                                            <CheckSquare className="w-5 h-5 text-sc-purple-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-text-placeholder group-hover:text-text-secondary" />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Dynamic Preview Thumbnail */}
                                                    <div className="w-10 h-10 rounded-lg bg-bg-secondary-panel border border-border-default flex items-center justify-center text-text-secondary overflow-hidden relative flex-shrink-0">
                                                        {fileIsImage ? (
                                                            /* raw img: relies on an onError handler that mutates the DOM element's style (hide-on-fail) — incompatible with next/image's wrapper, so left as raw */
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={fileUrl}
                                                                alt={file.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback if image fails to load
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-text-tertiary" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className={cn("text-sm font-medium transition-colors truncate max-w-[200px] md:max-w-[400px]", isSelected ? "text-sc-purple-700 font-semibold" : "text-text-heading")}>
                                                            {file.name}
                                                        </p>
                                                        <p className="text-[10px] text-text-tertiary font-mono truncate max-w-[250px] md:max-w-[500px]" title={file.key}>{file.key}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 ml-4">
                                                    {scanned && (
                                                        orphanKeys.has(file.key) ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded-full px-2 py-0.5">
                                                                <AlertTriangle className="w-3 h-3" /> Orphan
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 rounded-full px-2 py-0.5">
                                                                <ShieldCheck className="w-3 h-3" /> Live
                                                            </span>
                                                        )
                                                    )}
                                                    <span className="text-xs text-text-tertiary font-mono hidden md:block">
                                                        {formatBytes(file.size)}
                                                    </span>
                                                    <span className="text-xs text-text-placeholder font-mono hidden lg:block">
                                                        {(() => {
                                                            const ts = file.createdAt || file.uploadedAt;
                                                            const d = ts ? new Date(ts) : null;
                                                            return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : '—';
                                                        })()}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(fileUrl, file.key);
                                                            }}
                                                            className="p-2 hover:bg-bg-sidebar-hover rounded-lg text-text-tertiary hover:text-text-heading transition-colors cursor-pointer"
                                                            title="Copy direct link"
                                                        >
                                                            {copiedKey === file.key ? (
                                                                <Check className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-bg-sidebar-hover rounded-lg text-text-tertiary hover:text-text-heading transition-colors cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="View file"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </div>
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
        violet: "text-sc-purple-600 bg-sc-purple-50 border-sc-purple-200",
        blue: "text-sc-purple-600 bg-sc-purple-50 border-sc-purple-200",
        emerald: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
        amber: "text-amber-400 bg-amber-500/5 border-amber-500/20",
    };

    // @ts-ignore
    const theme = colors[color] || colors.violet;

    return (
        <div className={cn("p-6 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-bg-sidebar-hover hover:scale-[1.02] bg-bg-card backdrop-blur-md", theme)}>
            <div className="p-3 rounded-xl bg-bg-secondary-panel border border-border-default mb-2">
                <Icon className="w-6 h-6 opacity-90" />
            </div>
            <h3 className="text-3xl font-black text-text-heading font-sans tracking-tight">{value}</h3>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary font-sans font-semibold">{label}</p>
        </div>
    );
}
