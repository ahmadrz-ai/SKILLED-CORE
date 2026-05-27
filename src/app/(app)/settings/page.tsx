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
import { getSettings, updateGhostMode, deleteAccount, exportUserData, updateNotificationPreferences, updateNodeStatus, requestRoleChange } from './actions';
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

    // Onboarding Role Change State
    const [role, setRole] = useState('CANDIDATE');
    const [pendingRequest, setPendingRequest] = useState<{ id: string; type: string; documentUrl: string } | null>(null);
    const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
    const [workEmailInput, setWorkEmailInput] = useState('');
    const [isSubmittingRoleChange, setIsSubmittingRoleChange] = useState(false);

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
                    setRole((data as any).role || 'CANDIDATE');
                    const req = (data as any).verificationRequests?.[0] || null;
                    setPendingRequest(req);
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

    const handleSubmitRoleChange = async () => {
        if (!workEmailInput) return;
        setIsSubmittingRoleChange(true);
        try {
            const res = await requestRoleChange(workEmailInput);
            if (res.success) {
                toast.success(res.message);
                setShowRoleChangeModal(false);
                setWorkEmailInput('');
                
                // Reload settings to refresh status
                const data = await getSettings();
                if (data) {
                    setRole((data as any).role || 'CANDIDATE');
                    const req = (data as any).verificationRequests?.[0] || null;
                    setPendingRequest(req);
                }
            } else {
                toast.error(res.message || "Failed to submit request.");
            }
        } catch (error) {
            toast.error("Pipeline failure requesting role change.");
        } finally {
            setIsSubmittingRoleChange(false);
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
                <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-sc-purple-600" />
                    Security Credentials
                </h2>

                {/* Email (Read Only) */}
                <div className="space-y-2">
                    <Label className="text-text-secondary">Primary Identity (Email)</Label>
                    <div className="flex gap-2">
                        <Input value={isLoading ? "Loading..." : email} disabled className="bg-bg-input border-border-input text-text-disabled" />
                        <Button variant="outline" size="icon" disabled className="border-border-default"><Lock className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* Platform Role & Corporate Onboarding */}
                <div className="space-y-4 pt-4 border-t border-border-subtle">
                    <h3 className="text-sm font-bold text-text-heading">Platform Identity & Onboarding</h3>
                    <div className="p-4 bg-bg-secondary-panel border border-border-default rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-text-secondary uppercase">CURRENT ROLE:</span>
                                <span className={cn(
                                    "px-2 py-0.5 text-xs font-bold rounded border uppercase tracking-wider",
                                    role === 'RECRUITER' ? "bg-sc-blue-50 text-text-info border-sc-blue-100" : "bg-sc-purple-50 text-text-brand border-sc-purple-200"
                                )}>
                                    {role}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-1.5 max-w-md">
                                {role === 'RECRUITER' 
                                    ? "You are onboarded as an official platform Recruiter. You possess job posting and talent sourcing privileges."
                                    : "You are currently onboarded as a Candidate. You can search jobs, complete AI interview simulations, and display your career timeline."}
                            </p>
                        </div>
                        {role === 'CANDIDATE' && (
                            <>
                                {pendingRequest ? (
                                    <div className="px-3 py-1.5 bg-sc-amber-50 text-sc-amber-700 border border-sc-amber-100 rounded-lg text-xs font-semibold text-center md:text-left leading-relaxed">
                                        ⏳ Review Pending ({pendingRequest.documentUrl})
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={() => setShowRoleChangeModal(true)}
                                        className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold shrink-0 text-xs shadow-sc-sm"
                                    >
                                        Apply for Recruiter Role
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Password Change */}
                <div className="space-y-4 pt-4 border-t border-border-subtle">
                    <h3 className="text-sm font-bold text-text-heading">Change Password</h3>
                    <div className="grid gap-4">
                        <Input type="password" placeholder="Current Password" className="bg-bg-input border-border-input text-text-body" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="password" placeholder="New Password" className="bg-bg-input border-border-input text-text-body" />
                            <Input type="password" placeholder="Confirm Password" className="bg-bg-input border-border-input text-text-body" />
                        </div>
                        <Button className="w-fit bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default">Update Password</Button>
                    </div>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-4 bg-bg-secondary-panel rounded-xl border border-border-default">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-bg-sidebar-active flex items-center justify-center text-text-brand">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-text-heading">Two-Factor Authentication</h4>
                            <p className="text-xs text-text-secondary">Secure your account with an authenticator app.</p>
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
            <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
                <EyeOff className="w-6 h-6 text-sc-purple-600" />
                Stealth & Visibility
            </h2>

            {/* Network Mode (Open vs Broadcast) */}
            <div className="p-6 rounded-2xl border border-border-default bg-bg-secondary-panel flex flex-col md:flex-row gap-6 md:items-center justify-between mb-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-text-heading">Network Architecture</h3>
                        <span className={cn(
                            "px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded border",
                            nodeType === 'BROADCAST' ? "bg-sc-purple-50 text-text-brand border-sc-purple-200" : "bg-sc-blue-50 text-text-info border-sc-blue-100"
                        )}>
                            {nodeType} NODE
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary max-w-lg">
                        {nodeType === 'BROADCAST'
                            ? "Broadcast Node: 'Follow' is the primary action. Ideal for creators and executives."
                            : "Open Node: 'Connect' is the primary action. Ideal for standard professional networking."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold uppercase text-text-secondary">
                        {nodeType === 'BROADCAST' ? "BROADCAST" : "OPEN"}
                    </span>
                    <Switch
                        checked={nodeType === 'BROADCAST'}
                        onCheckedChange={handleToggleNodeType}
                        className="data-[state=checked]:bg-sc-purple-600"
                    />
                </div>
            </div>

            {/* Discovery Mode */}
            <div className={cn(
                "p-6 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row gap-6 md:items-center justify-between",
                isGhostMode
                    ? "bg-bg-secondary-panel border-sc-purple-300 shadow-[inset_0_0_10px_rgba(91,53,213,0.05)]"
                    : "bg-bg-card border-border-default hover:border-sc-purple-200"
            )}>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-text-heading">Ghost Protocol (Discovery Mode)</h3>
                        {isGhostMode && (
                            <span className="px-2 py-0.5 bg-sc-purple-50 text-text-brand text-[10px] uppercase tracking-widest font-bold rounded border border-sc-purple-200">
                                ACTIVE
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-text-secondary max-w-lg">
                        {isGhostMode
                            ? "You are currently invisible. Your profile is hidden from search results and recruiters cannot contact you."
                            : "Your profile is visible to the public. Recruiters can find you and send messages."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-mono font-bold uppercase", isGhostMode ? "text-text-secondary" : "text-text-brand")}>
                        {isGhostMode ? "INVISIBLE" : "VISIBLE"}
                    </span>
                    <Switch
                        checked={isGhostMode}
                        onCheckedChange={handleToggleGhost}
                        className="data-[state=checked]:bg-sc-purple-600"
                    />
                </div>
            </div>

            {/* Data Export */}
            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-text-heading">Data Sovereignty</h3>
                <div className="flex items-center justify-between p-4 border border-border-default rounded-xl bg-bg-secondary-panel">
                    <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-text-secondary" />
                        <div>
                            <p className="text-sm font-medium text-text-heading">Export Career Data</p>
                            <p className="text-xs text-text-secondary">Download a JSON file of your entire history.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport} className="border-border-default text-text-secondary hover:text-text-heading hover:bg-bg-sidebar-hover">
                        Download JSON
                    </Button>
                </div>
            </div>
        </motion.div>
    );

    // 3. DANGER ZONE
    const DangerZone = () => (
        <div className="mt-12 pt-8 border-t border-border-subtle">
            <h3 className="text-text-error font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <div className="border border-sc-red-200 bg-sc-red-50 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h4 className="font-bold text-text-heading mb-1">Delete Account</h4>
                    <p className="text-sm text-text-secondary max-w-md">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    className="bg-sc-red-100 hover:bg-sc-red-200 text-text-error border border-sc-red-200"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    DELETE ACCOUNT
                </Button>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-bg-modal border border-sc-red-200 rounded-2xl p-6 w-full max-w-md shadow-sc-modal relative overflow-hidden"
                        >
                            {/* Alert Stripe */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-sc-red-600" />

                            <h3 className="text-xl font-bold text-text-heading mb-2">Final Confirmation</h3>
                            <p className="text-sm text-text-secondary mb-6">
                                To confirm deletion, type <span className="text-text-heading font-mono font-bold select-all">DELETE</span> below.
                            </p>

                            <Input
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                className="bg-bg-input border-sc-red-200 text-text-error placeholder:text-text-placeholder mb-6 text-center font-mono tracking-widest"
                            />

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-sc-red-650 hover:bg-sc-red-700 text-white font-bold"
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
        <div className="min-h-screen bg-transparent text-text-body p-6 pb-20">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-text-heading mb-8 tracking-wide">
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
                                        ? "bg-bg-sidebar-active border-l-4 border-l-sc-purple-600 text-text-sidebar-active shadow-sc-sm"
                                        : "hover:bg-bg-sidebar-hover text-text-sidebar-inactive hover:text-text-sidebar-hover"
                                )}
                            >
                                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-sc-purple-600" : "text-sc-gray-400")} />
                                <div>
                                    <div className="text-sm font-bold">{tab.label}</div>
                                    <div className="text-[10px] text-text-secondary leading-tight mt-0.5 hidden md:block">{tab.description}</div>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform", activeTab === tab.id ? "text-sc-purple-600 rotate-90 lg:rotate-0" : "opacity-0")} />
                            </button>
                        ))}
                    </nav>

                    {/* RIGHT CONTENT */}
                    <div className="flex-1 bg-bg-card border border-border-card rounded-2xl p-6 md:p-10 shadow-sc-md min-h-[600px] flex flex-col">

                        <div className="flex-1">
                            {activeTab === 'account' && <AccountPanel />}
                            {activeTab === 'privacy' && <PrivacyPanel />}
                            {activeTab === 'notifications' && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
                                        <BellRing className="w-6 h-6 text-sc-purple-600" />
                                        Communication Channels
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Security Alerts */}
                                        <div className="flex items-center justify-between p-4 bg-bg-secondary-panel rounded-xl border border-border-default">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-text-heading">Security Alerts</h4>
                                                <p className="text-xs text-text-secondary">Receive emails about new logins and critical security events.</p>
                                            </div>
                                            <Switch
                                                checked={emailNotifications}
                                                onCheckedChange={(c) => handleNotificationUpdate('email', c)}
                                            />
                                        </div>

                                        {/* Marketing Emails */}
                                        <div className="flex items-center justify-between p-4 bg-bg-secondary-panel rounded-xl border border-border-default">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-text-heading">Product Updates</h4>
                                                <p className="text-xs text-text-secondary">Stay informed about new features and ecosystem news.</p>
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

            {/* ROLE CHANGE MODAL */}
            <AnimatePresence>
                {showRoleChangeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-bg-modal border border-border-modal rounded-2xl p-6 w-full max-w-md shadow-sc-modal relative overflow-hidden"
                        >
                            {/* Accent line */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-sc-purple-600" />

                            <h3 className="text-xl font-bold text-text-heading mb-2 flex items-center gap-2">
                                Become a Recruiter
                            </h3>
                            <p className="text-xs text-text-secondary mb-6 leading-relaxed font-medium">
                                Change your profile role to list job postings and source elite engineering talent. 
                                To maintain ecosystem integrity, you must submit a **verified corporate/work email**. Public email domains like Gmail or Yahoo are restricted.
                            </p>

                            <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-text-secondary text-xs font-bold uppercase tracking-wider">Corporate Work Email</Label>
                                    <Input
                                        type="email"
                                        required
                                        value={workEmailInput}
                                        onChange={(e) => setWorkEmailInput(e.target.value)}
                                        placeholder="you@company.com"
                                        className="bg-bg-input border-border-input text-text-body placeholder:text-text-placeholder text-sm py-2.5 shadow-sc-sm focus:border-border-focus"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-bg-secondary-panel border border-border-default hover:bg-bg-sidebar-hover text-text-body text-xs font-bold"
                                    disabled={isSubmittingRoleChange}
                                    onClick={() => {
                                        setShowRoleChangeModal(false);
                                        setWorkEmailInput('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold shadow-sc-sm"
                                    disabled={!workEmailInput || isSubmittingRoleChange}
                                    onClick={handleSubmitRoleChange}
                                >
                                    {isSubmittingRoleChange ? "SUBMITTING..." : "SUBMIT APPLICATION"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
