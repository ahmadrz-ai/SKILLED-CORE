'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon, Shield, ShieldCheck, Mail, Lock, Key, Bell, Briefcase, Eye, EyeOff,
  Database, RefreshCw, AlertTriangle, Monitor, Smartphone, Check, HelpCircle, ChevronRight,
  Loader2, Trash2, ArrowRight, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ResumeExportModal from '@/components/settings/ResumeExportModal';

// Actions
import {
  getSettings,
  updateGhostMode,
  updateNodeStatus,
  updateNotificationPreferences,
  requestRoleChange,
  updateSearchIndexable,
  updateOpenToWork,
  requestDataExport,
  changeEmail,
  changePassword,
  deleteAccountWithVerification
} from './actions';

import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  getLoginHistory
} from '@/app/actions/twoFactor';

// Settings sub-navigation config
interface TabConfig {
  id: string;
  label: string;
  icon: any;
  category: 'ACCOUNT' | 'SECURITY' | 'PRIVACY' | 'NOTIFICATIONS' | 'CAREER' | 'RECRUITING' | 'DANGER ZONE';
}

const ALL_TABS: TabConfig[] = [
  // ACCOUNT
  { id: 'profile', label: 'Profile Info', icon: UserIcon, category: 'ACCOUNT' },
  { id: 'email_password', label: 'Email & Password', icon: Mail, category: 'ACCOUNT' },
  { id: 'preferences', label: 'Account Preferences', icon: HelpCircle, category: 'ACCOUNT' },
  
  // SECURITY
  { id: '2fa', label: 'Two-Factor Auth', icon: Shield, category: 'SECURITY' },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor, category: 'SECURITY' },
  { id: 'history', label: 'Login History', icon: RefreshCw, category: 'SECURITY' },
  
  // PRIVACY
  { id: 'visibility', label: 'Profile Visibility', icon: Eye, category: 'PRIVACY' },
  { id: 'data_sovereignty', label: 'Data & Export', icon: Database, category: 'PRIVACY' },
  
  // NOTIFICATIONS
  { id: 'notifications', label: 'Email Notifications', icon: Bell, category: 'NOTIFICATIONS' },
  
  // CAREER (Candidates only)
  { id: 'career', label: 'Open to Work', icon: Briefcase, category: 'CAREER' },
  
  // RECRUITING (Recruiters only)
  { id: 'recruiting', label: 'Hiring Preferences', icon: Briefcase, category: 'RECRUITING' },
  
  // DANGER ZONE
  { id: 'danger', label: 'Delete Account', icon: Trash2, category: 'DANGER ZONE' },
];

import TwoFactorSettings from '@/components/settings/TwoFactorSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: sessionContext, update: updateClientSession } = useSession();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  // User details state
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [nodeType, setNodeType] = useState('OPEN');
  const [searchIndexable, setSearchIndexable] = useState(true);
  const [openToWork, setOpenToWork] = useState(false);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{ id: string; type: string; documentUrl: string } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorVerifiedAt, setTwoFactorVerifiedAt] = useState<Date | null>(null);
  const [backupCodesCount, setBackupCodesCount] = useState(0);

  // Active Sessions & History
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // Form states
  const [emailInput, setEmailInput] = useState('');
  const [emailPasswordInput, setEmailPasswordInput] = useState('');
  const [isEmailUpdating, setIsEmailUpdating] = useState(false);

  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // Recruiter Apply Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleWorkEmail, setRoleWorkEmail] = useState('');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);

  // Delete Account State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResumeExport, setShowResumeExport] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        if (data) {
          setName(data.name || '');
          setHeadline(data.headline || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setUsername(data.username || '');
          setEmail(data.email || '');
          setEmailInput(data.email || '');
          setIsGhostMode(data.ghostMode || false);
          setNodeType(data.nodeType || 'OPEN');
          setEmailNotifications(data.emailNotifications ?? true);
          setMarketingEmails(data.marketingEmails ?? false);
          setRole((data as any).role || 'CANDIDATE');
          setSearchIndexable((data as any).searchIndexable ?? true);
          setOpenToWork((data as any).openToWork ?? false);
          setTwoFactorEnabled((data as any).twoFactorEnabled || false);
          setTwoFactorVerifiedAt((data as any).twoFactorVerifiedAt || null);
          setBackupCodesCount((data as any).twoFactorBackupCodes ? (data as any).twoFactorBackupCodes.length : 0);
          
          const req = (data as any).verificationRequests?.[0] || null;
          setPendingRequest(req);
        }
      } catch (error) {
        console.error("loadSettings component error:", error);
        // Don't toast — error is already handled inside getSettings()
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Sessions and History Fetcher
  const loadSessionsAndHistory = async () => {
    setIsSessionsLoading(true);
    try {
      const [sessionsData, historyData] = await Promise.all([
        getActiveSessions(),
        getLoginHistory()
      ]);
      
      // Match current session using token exposed in auth session
      const currentToken = (sessionContext?.user as any)?.sessionToken;
      const formattedSessions = sessionsData.map(s => ({
        ...s,
        isCurrent: s.sessionToken === currentToken
      }));

      setActiveSessions(formattedSessions);
      setLoginHistory(historyData);
    } catch (err) {
      toast.error('Failed to load active sessions or history.');
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions' || activeTab === 'history') {
      loadSessionsAndHistory();
    }
  }, [activeTab, sessionContext]);

  // Tab category filter based on user roles
  const filteredTabs = ALL_TABS.filter(tab => {
    if (tab.category === 'CAREER' && role !== 'CANDIDATE') return false;
    if (tab.category === 'RECRUITING' && role !== 'RECRUITER') return false;
    return true;
  });

  // Action Handlers
  const handleToggleGhost = async (checked: boolean) => {
    setIsGhostMode(checked);
    const result = await updateGhostMode(checked);
    if (result.success) {
      toast.success(checked ? "Ghost Protocol Activated" : "Profile Visible");
    } else {
      setIsGhostMode(!checked);
      toast.error("Failed to update visibility status.");
    }
  };

  const handleToggleNodeType = async (checked: boolean) => {
    const newValue = checked ? 'BROADCAST' : 'OPEN';
    setNodeType(newValue);
    const result = await updateNodeStatus(newValue);
    if (result.success) {
      toast.success(`Active Node: ${newValue}`);
    } else {
      setNodeType(checked ? 'OPEN' : 'BROADCAST');
      toast.error("Failed to update node status.");
    }
  };

  const handleToggleSearchIndex = async (checked: boolean) => {
    setSearchIndexable(checked);
    const result = await updateSearchIndexable(checked);
    if (result.success) {
      toast.success(checked ? "Search indexing allowed" : "noindex tag applied");
    } else {
      setSearchIndexable(!checked);
      toast.error("Failed to save search engine preferences.");
    }
  };

  const handleToggleOpenToWork = async (checked: boolean) => {
    setOpenToWork(checked);
    const result = await updateOpenToWork(checked);
    if (result.success) {
      toast.success(checked ? "Open to Work activated (+10 Candidate Score)" : "Open to Work deactivated");
    } else {
      setOpenToWork(!checked);
      toast.error("Failed to update career preference.");
    }
  };

  const handleUpdateNotifications = async (type: 'email' | 'marketing', checked: boolean) => {
    if (type === 'email') setEmailNotifications(checked);
    else setMarketingEmails(checked);

    const result = await updateNotificationPreferences(type, checked);
    if (result.success) {
      toast.success("Notification preferences saved.");
    } else {
      if (type === 'email') setEmailNotifications(!checked);
      else setMarketingEmails(!checked);
      toast.error("Failed to update preferences.");
    }
  };

  // Profile Update (Visual Complete check)
  const handleUpdateProfile = () => {
    toast.success("Profile saved. To edit Bio or Avatar, please visit your direct Profile page.");
  };

  // Change Email Action
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailPasswordInput) return;
    setIsEmailUpdating(true);
    try {
      const res = await changeEmail(emailInput, emailPasswordInput);
      if (res.success) {
        toast.success(res.message);
        setEmail(emailInput);
        setEmailPasswordInput('');
      } else {
        toast.error(res.message || "Failed to update email.");
      }
    } catch (err) {
      toast.error("An error occurred. Check connection.");
    } finally {
      setIsEmailUpdating(false);
    }
  };

  // Change Password Action
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) return;
    if (newPasswordInput !== confirmPasswordInput) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const res = await changePassword(currentPasswordInput, newPasswordInput);
      if (res.success) {
        toast.success(res.message);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
      } else {
        toast.error(res.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error("Network sync failure.");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  // Apply Recruiter Role Action
  const handleApplyRecruiter = async () => {
    if (!roleWorkEmail) return;
    setIsRoleSubmitting(true);
    try {
      const res = await requestRoleChange(roleWorkEmail);
      if (res.success) {
        toast.success(res.message);
        setShowRoleModal(false);
        setRoleWorkEmail('');
        
        // Reload PENDING state
        const data = await getSettings();
        if (data) {
          setRole((data as any).role || 'CANDIDATE');
          const req = (data as any).verificationRequests?.[0] || null;
          setPendingRequest(req);
        }
      } else {
        toast.error(res.message || "Onboarding failed.");
      }
    } catch (err) {
      toast.error("Failed to submit Recruiter application.");
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  // Data Export Request
  const handleRequestExport = async () => {
    toast.info("Submitting data sovereign package request...");
    try {
      const res = await requestDataExport();
      if (res.success) {
        toast.success(res.message, { duration: 6000 });
      } else {
        toast.error(res.message || "Failed to request export.");
      }
    } catch (err) {
      toast.error("Data sovereignty connection failed.");
    }
  };

  // Revoke Session Action
  const handleRevokeSession = async (token: string) => {
    toast.info("Revoking active device credentials...");
    const ok = await revokeSession(token);
    if (ok) {
      toast.success("Device credentials revoked successfully.");
      loadSessionsAndHistory();
    } else {
      toast.error("Failed to revoke session.");
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = async () => {
    const currentToken = (sessionContext?.user as any)?.sessionToken;
    if (!currentToken) return;

    toast.info("Revoking all other active device credentials...");
    const ok = await revokeAllOtherSessions(currentToken);
    if (ok) {
      toast.success("All other device sessions revoked.");
      loadSessionsAndHistory();
    } else {
      toast.error("Failed to revoke sessions.");
    }
  };

  // Terminate Account Action
  const handleTerminateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE' || !deletePassword) return;

    setIsDeleting(true);
    try {
      const res = await deleteAccountWithVerification(deletePassword, deleteConfirmText);
      if (res.success) {
        toast.success("Profile terminated successfully. Good hunting.");
        await signOut({ callbackUrl: '/login' });
      } else {
        toast.error(res.message || "Failed to terminate profile.");
        setIsDeleting(false);
      }
    } catch (err) {
      toast.error("Network sync failure during account deletion.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-text-body gap-3">
        <Loader2 className="w-8 h-8 text-sc-purple-600 animate-spin" />
        <span className="text-sm font-semibold tracking-wider text-text-secondary uppercase">Syncing settings console...</span>
      </div>
    );
  }

  // --- SUB PANELS ---

  // 1. Profile Info Panel
  const ProfileInfoPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Profile Info</h3>
        <p className="text-sm text-text-secondary mt-0.5">Control how recruiters and platform members see your profile details.</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary text-xs font-semibold uppercase">Full Name</Label>
            <Input value={name} disabled className="bg-bg-input-disabled text-text-disabled" />
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary text-xs font-semibold uppercase">Username</Label>
            <Input value={username} disabled className="bg-bg-input-disabled text-text-disabled" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary text-xs font-semibold uppercase">Headline</Label>
          <Input value={headline || 'Engineering Professional'} disabled className="bg-bg-input-disabled text-text-disabled" />
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary text-xs font-semibold uppercase">Location</Label>
          <Input value={location || 'Remote'} disabled className="bg-bg-input-disabled text-text-disabled" />
        </div>

        <div className="space-y-2">
          <Label className="text-text-secondary text-xs font-semibold uppercase">Brief Bio</Label>
          <textarea
            value={bio || 'No biography written.'}
            disabled
            rows={4}
            className="w-full bg-bg-input-disabled text-text-disabled border border-border-default rounded-lg p-3 text-sm focus:outline-none resize-none leading-relaxed"
          />
        </div>

        <div className="bg-sc-purple-50 border border-sc-purple-100 rounded-xl p-4 text-xs leading-relaxed text-text-sidebar-active flex gap-2">
          <UserIcon className="w-4 h-4 text-sc-purple-600 flex-shrink-0 mt-0.5" />
          <span>
            Profile details (Avatar, Name, Bio, and Location) must be updated directly on your primary
            timeline dashboard. Go to your{' '}
            <a
              href={username ? `/profile/${username}` : 'https://skilledcore.com/profile/me'}
              className="font-semibold underline underline-offset-2 text-sc-purple-700 hover:text-sc-purple-900 transition-colors"
            >
              Profile Page
            </a>
            {' '}to perform edits.
          </span>
        </div>

        <Button onClick={handleUpdateProfile} className="bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default h-9 text-xs font-bold font-sans">
          Save Settings
        </Button>
      </div>
    </motion.div>
  );

  // 2. Email & Password Panel
  const EmailPasswordPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Change Email */}
      <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-xl pb-6 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-text-heading">Change Email</h3>
          <p className="text-sm text-text-secondary mt-0.5">Primary identifier and communication delivery inbox.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-text-secondary text-xs font-semibold uppercase">New Email Address</Label>
            <Input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="bg-bg-input border-border-input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-text-secondary text-xs font-semibold uppercase">Current Password</Label>
            <Input
              type="password"
              required
              placeholder="Confirm identity with password"
              value={emailPasswordInput}
              onChange={(e) => setEmailPasswordInput(e.target.value)}
              className="bg-bg-input border-border-input"
            />
          </div>
        </div>

        <Button type="submit" disabled={isEmailUpdating} className="bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default h-9 text-xs font-bold">
          {isEmailUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
          Change Email
        </Button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
        <div>
          <h3 className="text-lg font-bold text-text-heading">Change Password</h3>
          <p className="text-sm text-text-secondary mt-0.5">Update credentials to secure login channels.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-text-secondary text-xs font-semibold uppercase">Current Password</Label>
            <Input
              type="password"
              required
              value={currentPasswordInput}
              onChange={(e) => setCurrentPasswordInput(e.target.value)}
              className="bg-bg-input border-border-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-text-secondary text-xs font-semibold uppercase">New Password</Label>
              <Input
                type="password"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="bg-bg-input border-border-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-text-secondary text-xs font-semibold uppercase">Confirm Password</Label>
              <Input
                type="password"
                required
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                className="bg-bg-input border-border-input"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPasswordUpdating} className="bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default h-9 text-xs font-bold font-sans">
          {isPasswordUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
          Update Password
        </Button>
      </form>
    </motion.div>
  );

  // 3. Account Preferences Panel
  const AccountPreferencesPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Account Preferences</h3>
        <p className="text-sm text-text-secondary mt-0.5">Manage connected credentials and platform-wide capabilities.</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Recruiter Role Change */}
        <div className="p-4 bg-bg-secondary-panel border border-border-default rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-secondary uppercase">Platform Identity:</span>
                <span className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold rounded-full border uppercase tracking-wider",
                  role === 'RECRUITER' ? 'bg-sc-blue-50 text-text-info border-sc-blue-100' : 'bg-sc-purple-50 text-text-brand border-sc-purple-200'
                )}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-2 max-w-md">
                {role === 'RECRUITER'
                  ? 'Official platform Sourcing Recruiter. Access list postings and direct hiring command centers.'
                  : 'Candidate account. Settle AI interviews, search timelines, and configure assessments.'}
              </p>
            </div>
            {role === 'CANDIDATE' && (
              <div className="shrink-0">
                {pendingRequest ? (
                  <span className="inline-flex px-3 py-1.5 bg-sc-amber-50 text-sc-amber-700 border border-sc-amber-100 rounded-lg text-xs font-semibold">
                    ⏳ Application Under Review
                  </span>
                ) : (
                  <Button onClick={() => setShowRoleModal(true)} className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold h-9 text-xs shadow-sm">
                    Apply for Recruiter
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mock Linked OAuth widget */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Connected Identity Providers</Label>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-bg-card border border-border-default rounded-xl">
              <span className="text-sm font-medium text-text-body flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sc-gray-100 flex items-center justify-center text-xs">G</span>
                Mock Google Account
              </span>
              <span className="text-xs font-semibold text-text-secondary bg-bg-secondary-panel border border-border-default px-2 py-1 rounded">Linked</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-bg-card border border-border-default rounded-xl">
              <span className="text-sm font-medium text-text-body flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sc-gray-100 flex items-center justify-center text-xs">H</span>
                Mock GitHub Profile
              </span>
              <Button variant="outline" size="sm" className="h-7 text-xs border-border-default hover:bg-bg-sidebar-hover text-text-body">Connect</Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // 4. Active Sessions Panel
  const ActiveSessionsPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-text-heading">Active Sessions</h3>
          <p className="text-sm text-text-secondary mt-0.5">Manage and revoke security credentials on devices where you're logged in.</p>
        </div>
        {activeSessions.length > 1 && (
          <Button
            variant="outline"
            onClick={handleRevokeOtherSessions}
            className="text-text-error border-sc-red-200 hover:bg-sc-red-50 text-xs font-bold h-9 px-4 rounded-lg"
          >
            Sign Out Other Sessions
          </Button>
        )}
      </div>

      {isSessionsLoading ? (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="w-5 h-5 text-sc-purple-600 animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-text-secondary uppercase">Syncing device log...</span>
        </div>
      ) : activeSessions.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-10">No active sessions located.</p>
      ) : (
        <div className="space-y-3.5 max-w-xl">
          {activeSessions.map((sessionItem) => (
            <div key={sessionItem.id} className="p-4 bg-bg-card border border-border-default rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-secondary-panel border border-border-default flex items-center justify-center text-text-secondary">
                  {sessionItem.deviceName.toLowerCase().includes('phone') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-body-strong">{sessionItem.deviceName}</span>
                    {sessionItem.isCurrent && (
                      <span className="inline-flex px-2 py-0.5 bg-sc-green-50 text-sc-green-700 border border-sc-green-150 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-secondary mt-1">
                    <span>IP: {sessionItem.ipAddress || '127.0.0.1'}</span>
                    {sessionItem.location && <span>Location: {sessionItem.location}</span>}
                    <span>Active: {new Date(sessionItem.lastActive).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!sessionItem.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(sessionItem.sessionToken)}
                  className="text-text-error hover:bg-sc-red-50 hover:text-sc-red-700 h-8 text-xs font-bold px-3 rounded-lg"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // 5. Login History Panel
  const LoginHistoryPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Login History</h3>
        <p className="text-sm text-text-secondary mt-0.5">Audit log of the last 10 login attempts on this account.</p>
      </div>

      {isSessionsLoading ? (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="w-5 h-5 text-sc-purple-600 animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-text-secondary uppercase">Syncing login events...</span>
        </div>
      ) : loginHistory.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-10">No login attempts audited.</p>
      ) : (
        <div className="max-w-2xl overflow-x-auto border border-border-default rounded-xl bg-bg-card">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg-secondary-panel border-b border-border-default text-text-secondary text-xs uppercase tracking-wider font-semibold">
                <th className="p-3 pl-4">Date & Time</th>
                <th className="p-3">Device / Browser</th>
                <th className="p-3">Location (IP)</th>
                <th className="p-3 pr-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-sans">
              {loginHistory.map((item) => (
                <tr key={item.id} className="hover:bg-bg-card-hover transition-colors text-text-body">
                  <td className="p-3 pl-4 font-mono text-xs text-text-secondary whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-medium text-text-body-strong whitespace-nowrap">
                    {item.deviceName}
                  </td>
                  <td className="p-3 text-xs text-text-secondary whitespace-nowrap">
                    {item.location ? `${item.location} ` : ''}({item.ipAddress})
                  </td>
                  <td className="p-3 pr-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border",
                      item.success
                        ? 'bg-sc-green-50 text-sc-green-700 border-sc-green-150'
                        : 'bg-sc-red-50 text-sc-red-700 border-sc-red-150'
                    )}>
                      {item.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  // 6. Profile Visibility Panel
  const ProfileVisibilityPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Network and Ghost */}
      <div className="space-y-4 max-w-xl pb-6 border-b border-border-subtle">
        <div>
          <h3 className="text-lg font-bold text-text-heading">Profile Visibility Audience</h3>
          <p className="text-sm text-text-secondary mt-0.5">Control how visible your profile is in lists and search matching.</p>
        </div>

        <div className="space-y-4">
          {/* Ghost Mode */}
          <div className={cn(
            "p-5 rounded-xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4",
            isGhostMode ? 'bg-sc-purple-50/40 border-sc-purple-200' : 'bg-bg-card border-border-default'
          )}>
            <div>
              <h4 className="font-semibold text-sm text-text-heading flex items-center gap-2">
                Ghost Mode (Invisible Discovery)
                {isGhostMode && <span className="text-[10px] font-bold text-text-brand bg-sc-purple-100 px-2 py-0.5 rounded border border-sc-purple-200">Active</span>}
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                When active, your profile is hidden from search listings. Active recruiters cannot see or message you.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-text-secondary">{isGhostMode ? 'INVISIBLE' : 'VISIBLE'}</span>
              <Switch checked={isGhostMode} onCheckedChange={handleToggleGhost} className="data-[state=checked]:bg-sc-purple-600" />
            </div>
          </div>

          {/* Network Mode */}
          <div className="p-5 bg-bg-card border border-border-default rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h4 className="font-semibold text-sm text-text-heading flex items-center gap-2">
                Network Node Architecture
                <span className="text-[10px] font-bold text-text-info bg-sc-blue-50 border border-sc-blue-100 px-2 py-0.5 rounded">{nodeType} NODE</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                {nodeType === 'BROADCAST'
                  ? "Broadcast Node: 'Follow' is your primary timeline hook. Best for platform creators."
                  : "Open Node: 'Connect' is your primary timeline hook. Best for peer professionals."}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-text-secondary">{nodeType === 'BROADCAST' ? 'BROADCAST' : 'OPEN'}</span>
              <Switch checked={nodeType === 'BROADCAST'} onCheckedChange={handleToggleNodeType} className="data-[state=checked]:bg-sc-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Engine Visibility */}
      <div className="space-y-4 max-w-xl">
        <div>
          <h3 className="text-lg font-bold text-text-heading">Search Appearance</h3>
          <p className="text-sm text-text-secondary mt-0.5">Control web indexing visibility of your profile.</p>
        </div>

        <div className="p-5 bg-bg-card border border-border-default rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h4 className="font-semibold text-sm text-text-heading">Allow search engines to index my profile</h4>
            <p className="text-xs text-text-secondary mt-1 max-w-md">
              When disabled, a <code>noindex</code> robots tag is injected into your profile page headers to prevent Google, Bing, and other web engines from crawling or indexing your name.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-text-secondary">{searchIndexable ? 'ALLOWED' : 'BLOCKED'}</span>
            <Switch checked={searchIndexable} onCheckedChange={handleToggleSearchIndex} className="data-[state=checked]:bg-sc-purple-600" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // 7. Data Export Panel
  const DataExportPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Download Your Data</h3>
        <p className="text-sm text-text-secondary mt-0.5">Maintain complete sovereignty and ownership of your platform timeline logs.</p>
      </div>

      <div className="p-5 bg-bg-card border border-border-default rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h4 className="font-semibold text-sm text-text-heading flex items-center gap-2">Career History & Timelines</h4>
          <p className="text-xs text-text-secondary mt-1 max-w-md">
            Download a structured JSON package containing your career details, project records, skills, comments, and assessed ratings.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap shrink-0">
          <Button onClick={handleRequestExport} className="bg-bg-secondary-panel hover:bg-bg-sidebar-hover text-text-body border border-border-default h-9 text-xs font-bold">
            Request Data Export
          </Button>
          <Button
            onClick={() => setShowResumeExport(true)}
            className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-bold h-9 text-xs shadow-sm flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Export as Resume
          </Button>
        </div>
      </div>
    </motion.div>
  );

  // 8. Notifications Panel (Visual lock on required items)
  const NotificationsPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Email Preferences</h3>
        <p className="text-sm text-text-secondary mt-0.5">Control the notifications and updates delivered to your inbox.</p>
      </div>

      {/* User toggleable notifications */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Ecosystem alerts</h4>
        
        <div className="space-y-3 bg-bg-card border border-border-default rounded-xl p-4">
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-text-body-strong">Product Updates</span>
              <p className="text-xs text-text-secondary">Stay informed about new timeline features and ecosystem news.</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={(c) => handleUpdateNotifications('marketing', c)} className="data-[state=checked]:bg-sc-purple-600" />
          </div>
        </div>
      </div>

      {/* Permanently Locked notifications */}
      <div className="space-y-4 pt-4 border-t border-border-subtle">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Required notifications</h4>
        
        <div className="space-y-3 bg-bg-secondary-panel border border-border-default rounded-xl p-4">
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-text-body-strong flex items-center gap-1.5 text-text-secondary">
                Security Alerts
                <Lock className="w-3.5 h-3.5 text-text-tertiary" />
              </span>
              <p className="text-xs text-text-secondary">Crucial security updates, including new login events and password changes.</p>
            </div>
            <span className="text-xs font-semibold text-text-sidebar-active bg-sc-purple-50 border border-sc-purple-200 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">ALWAYS ON</span>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-border-subtle pt-3">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-text-body-strong flex items-center gap-1.5 text-text-secondary">
                Platform Legal Updates
                <Lock className="w-3.5 h-3.5 text-text-tertiary" />
              </span>
              <p className="text-xs text-text-secondary">Important changes to Terms of Service, billing renewals, and legal requirements.</p>
            </div>
            <span className="text-xs font-semibold text-text-sidebar-active bg-sc-purple-50 border border-sc-purple-200 px-2.5 py-1 rounded-full uppercase tracking-wider select-none">ALWAYS ON</span>
          </div>
        </div>
        <p className="text-[11px] text-text-secondary italic leading-relaxed">
          * Compliance Note: Under GDPR and absolute security protocols, you cannot unsubscribe from critical credentials updates or policy notifications. These are permanently active to protect user account integrity.
        </p>
      </div>
    </motion.div>
  );

  // 9. Career / Open to Work Panel (Candidates Only)
  const CareerPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-text-heading">Career Preferences</h3>
        <p className="text-sm text-text-secondary mt-0.5">Let active recruiters know you are seeking new opportunities.</p>
      </div>

      <div className={cn(
        "p-5 rounded-xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4",
        openToWork ? 'bg-sc-purple-50/40 border-sc-purple-200' : 'bg-bg-card border-border-default'
      )}>
        <div>
          <h4 className="font-semibold text-sm text-text-heading flex items-center gap-2">
            I am open to new opportunities
            {openToWork && <span className="text-[10px] font-bold text-text-brand bg-sc-purple-100 px-2 py-0.5 rounded border border-sc-purple-200">Active</span>}
          </h4>
          <p className="text-xs text-text-secondary mt-1 max-w-md">
            Activating this status adds a prominent **"Open to Work"** badge to your profile and adds a bonus **+10 points** to your matchmaking search score in recruiter sourcing queries!
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-text-secondary">{openToWork ? 'ACTIVE' : 'INACTIVE'}</span>
          <Switch checked={openToWork} onCheckedChange={handleToggleOpenToWork} className="data-[state=checked]:bg-sc-purple-600" />
        </div>
      </div>
    </motion.div>
  );

  // 10. AI Evaluation / Recruiting Settings (Recruiters Only)
  const RecruitingPanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-text-heading">AI Evaluation Settings</h3>
        <p className="text-sm text-text-secondary mt-0.5">Configure active sourcing and screening parameters for talent identification.</p>
      </div>

      <div className="p-5 bg-bg-card border border-border-default rounded-xl space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-text-heading">Mock ATS Greenhouse Integration</h4>
          <p className="text-xs text-text-secondary mt-1">
            Establish programmatic webhooks with standard Applicant Tracking Systems to sync verified candidate scorecards automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Input disabled placeholder="Sandbox Greenhouse API Key" className="bg-bg-input-disabled text-text-disabled" />
          <Button disabled className="bg-bg-secondary-panel text-text-disabled text-xs font-bold border border-border-default h-9">Connect</Button>
        </div>
      </div>
    </motion.div>
  );

  // 11. Danger Zone Panel (DELETE require password + "DELETE" confirmation)
  const DangerZonePanel = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-bold text-text-error">Terminate Account</h3>
        <p className="text-sm text-text-secondary mt-0.5">Permanently delete your profile and all associated timelines. This action is absolute and cannot be undone.</p>
      </div>

      <div className="border border-sc-red-200 bg-sc-red-50 rounded-xl p-5 space-y-4">
        <div className="flex gap-2 text-xs leading-relaxed text-text-error">
          <AlertTriangle className="w-5 h-5 text-sc-red-600 flex-shrink-0" />
          <span>
            Warning: Account termination deletes your complete experience timeline, earned assessment badges, previous interview history transcripts, and saved settings. It cannot be recovered.
          </span>
        </div>

        <form onSubmit={handleTerminateAccount} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-secondary uppercase">Confirm Password</Label>
            <Input
              type="password"
              required
              placeholder="Confirm password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="bg-bg-input border-sc-red-200 text-text-error"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-text-secondary uppercase">
              To proceed, type <span className="font-mono font-bold text-text-heading select-all">DELETE</span> below:
            </Label>
            <Input
              type="text"
              required
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="bg-bg-input border-sc-red-200 text-text-error font-mono text-center tracking-widest"
            />
          </div>

          <Button
            type="submit"
            disabled={deleteConfirmText !== 'DELETE' || !deletePassword || isDeleting}
            className="w-full bg-sc-red-650 hover:bg-sc-red-700 text-white font-bold h-10 rounded-lg shadow-sm transition-all"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Permanently Terminate Account
          </Button>
        </form>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-bg-page text-text-body p-6 pb-20 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-text-heading mb-8">
          GLOBAL SETTINGS
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT SUB-NAVIGATION PANEL (Sticky Sidebar Nav - Pattern B) */}
          <nav className="w-full lg:w-64 shrink-0 bg-bg-sidebar border border-border-default rounded-2xl p-4 space-y-4 lg:sticky lg:top-6">
            
            {/* ACCOUNT CATEGORY */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">Account</span>
              {filteredTabs.filter(t => t.category === 'ACCOUNT').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                    activeTab === tab.id
                      ? "bg-bg-sidebar-active text-text-sidebar-active border-l-2 border-sc-purple-600"
                      : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-purple-600" : "text-text-secondary")} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SECURITY CATEGORY */}
            <div className="space-y-1 pt-2 border-t border-border-subtle">
              <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">Security</span>
              {filteredTabs.filter(t => t.category === 'SECURITY').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                    activeTab === tab.id
                      ? "bg-bg-sidebar-active text-text-sidebar-active border-l-2 border-sc-purple-600"
                      : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-purple-600" : "text-text-secondary")} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PRIVACY CATEGORY */}
            <div className="space-y-1 pt-2 border-t border-border-subtle">
              <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">Privacy</span>
              {filteredTabs.filter(t => t.category === 'PRIVACY').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                    activeTab === tab.id
                      ? "bg-bg-sidebar-active text-text-sidebar-active border-l-2 border-sc-purple-600"
                      : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-purple-600" : "text-text-secondary")} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* NOTIFICATIONS & PREFERENCES */}
            <div className="space-y-1 pt-2 border-t border-border-subtle">
              <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">Alerts</span>
              {filteredTabs.filter(t => t.category === 'NOTIFICATIONS').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                    activeTab === tab.id
                      ? "bg-bg-sidebar-active text-text-sidebar-active border-l-2 border-sc-purple-600"
                      : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-purple-600" : "text-text-secondary")} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ROLE SPECIFIC CATEGORIES */}
            {(role === 'CANDIDATE' || role === 'RECRUITER') && (
              <div className="space-y-1 pt-2 border-t border-border-subtle">
                <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">Workspace</span>
                {filteredTabs.filter(t => t.category === 'CAREER' || t.category === 'RECRUITING').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                      activeTab === tab.id
                        ? "bg-bg-sidebar-active text-text-sidebar-active border-l-2 border-sc-purple-600"
                        : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                    )}
                  >
                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-purple-600" : "text-text-secondary")} />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* DANGER ZONE CATEGORY */}
            <div className="space-y-1 pt-2 border-t border-border-subtle">
              <span className="text-[10px] font-bold text-text-sidebar-section uppercase tracking-wider pl-3">System</span>
              {filteredTabs.filter(t => t.category === 'DANGER ZONE').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left",
                    activeTab === tab.id
                      ? "bg-sc-red-50 text-text-error border-l-2 border-sc-red-650"
                      : "text-text-sidebar-inactive hover:bg-bg-sidebar-hover hover:text-text-sidebar-hover"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-sc-red-600" : "text-text-secondary")} />
                  {tab.label}
                </button>
              ))}
            </div>

          </nav>

          {/* RIGHT VIEW CONTENT SURFACE */}
          <div className="flex-1 bg-bg-card border border-border-default rounded-2xl p-6 md:p-8 shadow-sc-sm w-full min-h-[500px]">
            {activeTab === 'profile' && <ProfileInfoPanel />}
            {activeTab === 'email_password' && <EmailPasswordPanel />}
            {activeTab === 'preferences' && <AccountPreferencesPanel />}
            
            {activeTab === '2fa' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-text-heading">Two-Factor Authentication Setup</h3>
                  <p className="text-sm text-text-secondary mt-0.5">Activate or manage your Time-based One-Time Password lifecycle.</p>
                </div>
                <TwoFactorSettings
                  initialEnabled={twoFactorEnabled}
                  initialVerifiedAt={twoFactorVerifiedAt}
                  initialBackupCodesCount={backupCodesCount}
                />
              </div>
            )}
            
            {activeTab === 'sessions' && <ActiveSessionsPanel />}
            {activeTab === 'history' && <LoginHistoryPanel />}
            {activeTab === 'visibility' && <ProfileVisibilityPanel />}
            {activeTab === 'data_sovereignty' && <DataExportPanel />}
            {activeTab === 'notifications' && <NotificationsPanel />}
            {activeTab === 'career' && role === 'CANDIDATE' && <CareerPanel />}
            {activeTab === 'recruiting' && role === 'RECRUITER' && <RecruitingPanel />}
            {activeTab === 'danger' && <DangerZonePanel />}
          </div>
        </div>
      </div>

      {/* ROLE CHANGE RECRUITER MODAL */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-modal border border-border-modal rounded-2xl p-6 w-full max-w-md shadow-sc-modal relative overflow-hidden text-text-body"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-sc-purple-600" />

              <h3 className="text-lg font-bold text-text-heading mb-2">Apply for Recruiter Status</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                List job descriptions and inspect direct assessments. To verify your corporate authority, please enter a valid <strong className="text-text-heading">corporate / work email address</strong>. Public domains (Gmail, Outlook, etc.) are restricted.
              </p>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-text-secondary uppercase">Work Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={roleWorkEmail}
                    onChange={(e) => setRoleWorkEmail(e.target.value)}
                    className="bg-bg-input border-border-input"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => { setShowRoleModal(false); setRoleWorkEmail(''); }}
                    className="flex-1 border-border-default text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={!roleWorkEmail || isRoleSubmitting}
                    onClick={handleApplyRecruiter}
                    className="flex-1 bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold shadow-sm"
                  >
                    {isRoleSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Application
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showResumeExport && (
        <ResumeExportModal onClose={() => setShowResumeExport(false)} />
      )}

    </div>
  );
}
