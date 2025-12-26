'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, EyeOff, BellRing, CreditCard, ChevronRight,
    Lock, Smartphone, Download, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getSettings, updateGhostMode, deleteAccount, exportUserData, updateNotificationPreferences, updateNodeStatus } from './actions';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// --- TABS CONFIG ---
const TABS = [
    { id: 'account', label: 'Account Access', icon: ShieldCheck, description: 'Manage login credentials and security.' },
    { id: 'privacy', label: 'Privacy & Visibility', icon: EyeOff, description: 'Control your digital footprint.' },
    { id: 'notifications', label: 'Alert Preferences', icon: BellRing, description: 'Customize your communication channels.' },
];

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('account');
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [nodeType, setNodeType] = useState('OPEN');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    // Delete State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getSettings();
                if (data) {
                    setEmail(data.email || '');
                    setIsGhostMode(data.ghostMode || false);
                    setNodeType(data.nodeType || 'OPEN');
                    setEmailNotifications(data.emailNotifications ?? true);
                    setMarketingEmails(data.marketingEmails ?? false);
                }
            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleToggleGhost = async (checked: boolean) => {
        setIsGhostMode(checked); // Optimistic UI
        const result = await updateGhostMode(checked);
        if (result.success) {
            toast.success(checked ? "Ghost Protocol Activated" : "Profile Visible");
        } else {
            setIsGhostMode(!checked); // Revert
            toast.error("Failed to update status");
        }
    };

    const handleToggleNodeType = async (checked: boolean) => {
        const newValue = checked ? 'BROADCAST' : 'OPEN';
        setNodeType(newValue); // Optimistic UI
        const result = await updateNodeStatus(newValue);
        if (result.success) {
            toast.success(`Active Node: ${newValue}`);
        } else {
            setNodeType(checked ? 'OPEN' : 'BROADCAST'); // Revert
            toast.error("Failed to update architecture");
        }
    };

    const handleNotificationUpdate = async (type: 'email' | 'marketing', checked: boolean) => {
        if (type === 'email') setEmailNotifications(checked);
        else setMarketingEmails(checked);

        const result = await updateNotificationPreferences(type, checked);
        if (result.success) {
            toast.success("Preferences updated");
        } else {
            // Revert
            if (type === 'email') setEmailNotifications(!checked);
            else setMarketingEmails(!checked);
            toast.error("Failed to save preference");
        }
    };

    const handleExport = async () => {
        toast.info("Preparing data package...");
        const result = await exportUserData();
        if (result.success && result.data) {
            const blob = new Blob([result.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shadow-hire-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Download started");
        } else {
            toast.error("Export failed");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;
        setIsDeleting(true);
        const result = await deleteAccount();
        if (result.success) {
            toast.success("Account terminated. Good hunting.");
            await signOut({ callbackUrl: '/login' });
        } else {
            setIsDeleting(false);
            toast.error("Failed to delete account");
        }
    };

    // --- SUB-COMPONENTS ---

    // 1. ACCOUNT PANEL
    const AccountPanel = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-violet-500" />
                    Security Credentials
                </h2>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                    <Label className="text-zinc-400">Primary Identity (Email)</Label>
                    <div className="flex gap-2">
                        <Input value={isLoading ? "Loading..." : email} disabled className="bg-zinc-900 border-white/10 text-zinc-500" />
                        <Button variant="outline" size="icon" disabled className="border-white/10"><Lock className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* Password Change */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-bold text-zinc-300">Change Password</h3>
                    <div className="grid gap-4">
                        <Input type="password" placeholder="Current Password" className="bg-zinc-900/50 border-white/10" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="password" placeholder="New Password" className="bg-zinc-900/50 border-white/10" />
                            <Input type="password" placeholder="Confirm Password" className="bg-zinc-900/50 border-white/10" />
                        </div>
                        <Button className="w-fit bg-white/5 hover:bg-white/10 text-white border border-white/10">Update Password</Button>
                    </div>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Two-Factor Authentication</h4>
                            <p className="text-xs text-zinc-500">Secure your account with an authenticator app.</p>
                        </div>
                    </div>
                    <Switch disabled />
                </div>
            </div>
        </motion.div>
    );

    // 2. PRIVACY PANEL (GHOST PROTOCOL)
    const PrivacyPanel = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <EyeOff className="w-6 h-6 text-teal-500" />
                Stealth & Visibility
            </h2>

            {/* Network Mode (Open vs Broadcast) */}
            <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/40 flex flex-col md:flex-row gap-6 md:items-center justify-between mb-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">Network Architecture</h3>
                        <span className={cn(
                            "px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded border",
                            nodeType === 'BROADCAST' ? "bg-teal-500/10 text-teal-400 border-teal-500/30" : "bg-violet-500/10 text-violet-400 border-violet-500/30"
                        )}>
                            {nodeType} NODE
                        </span>
                    </div>
                    <p className="text-sm text-zinc-400 max-w-lg">
                        {nodeType === 'BROADCAST'
                            ? "Broadcast Node: 'Follow' is the primary action. Ideal for creators and executives."
                            : "Open Node: 'Connect' is the primary action. Ideal for standard professional networking."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold uppercase text-zinc-500">
                        {nodeType === 'BROADCAST' ? "BROADCAST" : "OPEN"}
                    </span>
                    <Switch
                        checked={nodeType === 'BROADCAST'}
                        onCheckedChange={handleToggleNodeType}
                        className="data-[state=checked]:bg-teal-500"
                    />
                </div>
            </div>

            {/* Discovery Mode */}
            <div className={cn(
                "p-6 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row gap-6 md:items-center justify-between",
                isGhostMode
                    ? "bg-black border-zinc-700 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
                    : "bg-zinc-900/40 border-white/10"
            )}>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">Ghost Protocol (Discovery Mode)</h3>
                        {isGhostMode && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] uppercase tracking-widest font-bold rounded border border-zinc-700">
                                ACTIVE
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-zinc-400 max-w-lg">
                        {isGhostMode
                            ? "You are currently invisible. Your profile is hidden from search results and recruiters cannot contact you."
                            : "Your profile is visible to the public. Recruiters can find you and send messages."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-mono font-bold uppercase", isGhostMode ? "text-zinc-500" : "text-teal-400")}>
                        {isGhostMode ? "INVISIBLE" : "VISIBLE"}
                    </span>
                    <Switch
                        checked={isGhostMode}
                        onCheckedChange={handleToggleGhost}
                        className="data-[state=checked]:bg-teal-500"
                    />
                </div>
            </div>

            {/* Data Export */}
            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-zinc-300">Data Sovereignty</h3>
                <div className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-zinc-900/20">
                    <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-zinc-500" />
                        <div>
                            <p className="text-sm font-medium text-white">Export Career Data</p>
                            <p className="text-xs text-zinc-500">Download a JSON file of your entire history.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport} className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5">
                        Download JSON
                    </Button>
                </div>
            </div>
        </motion.div>
    );

    // 3. DANGER ZONE
    const DangerZone = () => (
        <div className="mt-12 pt-8 border-t border-red-900/30">
            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <div className="border border-red-900/30 bg-red-950/10 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h4 className="font-bold text-white mb-1">Delete Account</h4>
                    <p className="text-sm text-zinc-500 max-w-md">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    DELETE ACCOUNT
                </Button>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-950 border border-red-900/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
                        >
                            {/* Alert Stripe */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-red-600" />

                            <h3 className="text-xl font-bold text-white mb-2">Final Confirmation</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                To confirm deletion, type <span className="text-white font-mono font-bold select-all">DELETE</span> below.
                            </p>

                            <Input
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                className="bg-zinc-900 border-red-900/30 text-white placeholder:text-zinc-600 mb-6 text-center font-mono tracking-widest"
                            />

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                                    disabled={deleteInput !== 'DELETE' || isDeleting}
                                    onClick={handleDeleteAccount}
                                >
                                    {isDeleting ? "DELETING..." : "PERMANENTLY DELETE"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="min-h-screen bg-obsidian text-white p-6 pb-20">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-cinzel text-white mb-8 tracking-wide">
                    GLOBAL SETTINGS
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT NAV */}
                    <nav className="lg:w-72 shrink-0 space-y-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border border-transparent",
                                    activeTab === tab.id
                                        ? "bg-white/5 border-l-4 border-l-violet-500 text-white shadow-lg"
                                        : "hover:bg-white/5 text-zinc-400 hover:text-white"
                                )}
                            >
                                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-violet-400" : "text-zinc-500")} />
                                <div>
                                    <div className="text-sm font-bold">{tab.label}</div>
                                    <div className="text-[10px] text-zinc-500 leading-tight mt-0.5 hidden md:block">{tab.description}</div>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform", activeTab === tab.id ? "text-violet-500 rotate-90 lg:rotate-0" : "opacity-0")} />
                            </button>
                        ))}
                    </nav>

                    {/* RIGHT CONTENT */}
                    <div className="flex-1 bg-zinc-950/50 border border-white/5 rounded-2xl p-6 md:p-10 shadow-xl min-h-[600px] flex flex-col">

                        <div className="flex-1">
                            {activeTab === 'account' && <AccountPanel />}
                            {activeTab === 'privacy' && <PrivacyPanel />}
                            {activeTab === 'notifications' && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <BellRing className="w-6 h-6 text-violet-500" />
                                        Communication Channels
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Security Alerts */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white">Security Alerts</h4>
                                                <p className="text-xs text-zinc-500">Receive emails about new logins and critical security events.</p>
                                            </div>
                                            <Switch
                                                checked={emailNotifications}
                                                onCheckedChange={(c) => handleNotificationUpdate('email', c)}
                                            />
                                        </div>

                                        {/* Marketing Emails */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-white/5">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white">Product Updates</h4>
                                                <p className="text-xs text-zinc-500">Stay informed about new features and ecosystem news.</p>
                                            </div>
                                            <Switch
                                                checked={marketingEmails}
                                                onCheckedChange={(c) => handleNotificationUpdate('marketing', c)}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <DangerZone />

                    </div>
                </div>
            </div>
        </div>
    );
}
