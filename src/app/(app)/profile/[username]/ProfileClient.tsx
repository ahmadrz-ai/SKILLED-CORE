'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, CloudUpload, FileText, Github, Globe, Link as LinkIcon, Linkedin, MapPin, MessageSquare, Pencil, Plus, Sparkles, Trash2, Users, Eye, MoreHorizontal, UserPlus, Send, Flag, Download, Share2, BadgeCheck, FolderOpen, Star, StarHalf, ArrowRight, Loader2, Lock, X } from "lucide-react";
import { RecruiterGate } from "@/components/hire/RecruiterGate";
import { BookingModal } from "@/components/hire/BookingModal";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { FollowListDialog } from "@/components/profile/FollowListDialog";
import { Tag as SharedTag } from "@/components/ui/tag";
import dynamic from 'next/dynamic';
import ProfileEditModals from '@/components/profile/ProfileEditModals';
const ResumeProfileBuilder = dynamic(() => import('@/components/profile/ResumeProfileBuilder').then(m => ({ default: m.ResumeProfileBuilder })), { ssr: false });
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toggleFollow } from '@/app/(app)/feed/actions';
import { sendConnectionRequest, updateConnectionStatus } from '@/app/(app)/network/actions';
import { toast } from 'sonner';
import { iconMap } from '@/lib/icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,

    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteInterview } from '@/app/actions/interview';
import { PlanBadge } from '@/components/credits/PlanBadge';
import { SocialIcon } from '@/components/shared/SocialIcon';

// --- Types ---
// Matches the updated schema and server fetch
interface ProfileClientProps {
    user: {
        id: string;
        name: string | null;
        surname?: string | null;
        username?: string | null;
        headline: string | null;
        bio: string | null;
        skills: string | null;
        location?: string | null;
        image: string | null;
        bannerUrl?: string | null;
        linkedin?: string | null;
        github?: string | null;
        portfolio?: string | null;
        resumeUrl?: string | null;
        customLinks?: string | null; // JSON String
        experience: any[];
        education: any[];
        projects: any[];
        nodeType?: string;
        role?: string;
        plan?: string;
    };
    isOwner: boolean;
    isFollowing?: boolean;
    connectionStatus?: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';
    posts: any[];
    counts?: {
        followers: number;
        following: number;
    };
    isAdmin?: boolean;
    isRestrictedViewer?: boolean;
}

export default function ProfileClient({ user, isOwner, posts, isFollowing = false, connectionStatus = 'NONE', counts = { followers: 0, following: 0 }, isAdmin = false, isRestrictedViewer = false }: ProfileClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'interviews'>('overview');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Social State
    const [followingState, setFollowingState] = useState(isFollowing);
    const [followerCount, setFollowerCount] = useState(counts.followers);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    // Connection State
    const [connStatus, setConnStatus] = useState(connectionStatus);
    const [isConnectLoading, setIsConnectLoading] = useState(false);

    // List Dialog State
    const [listType, setListType] = useState<'followers' | 'following' | null>(null);

    // Modal State
    const [editSection, setEditSection] = useState<'identity' | 'about' | 'experience' | 'education' | 'skills' | 'projects' | 'links' | 'banner' | 'resume' | 'share' | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
    const searchParams = useSearchParams();
    const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(() => {
        return searchParams.get('builder') === 'open';
    });
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);

    // Recruiter access gate (book-interview-to-unlock) + real PDF export state
    const [gateAction, setGateAction] = useState<string | null>(null);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);

    // Sync builder open state from URL search params (Task 6)
    useEffect(() => {
        const isOpenParam = searchParams.get('builder') === 'open';
        setIsResumeBuilderOpen(isOpenParam);
    }, [searchParams]);

    const handleOpenResumeBuilder = () => {
        setIsResumeBuilderOpen(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('builder', 'open');
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    const handleCloseResumeBuilder = () => {
        setIsResumeBuilderOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('builder');
        params.delete('tab');
        params.delete('popup');
        params.delete('popupState');
        router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    };

    // Parse Data
    let parsedSkills: string[] = [];
    try {
        if (user.skills) {
            const trimmed = user.skills.trim();
            if (trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    parsedSkills = parsed.map((s: any) => {
                        if (s && typeof s === 'object') return String(s.name || '');
                        return String(s);
                    }).map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
                }
            } else {
                parsedSkills = trimmed.split(',').map((s: string) => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
            }
        }
    } catch { parsedSkills = []; }

    let parsedLinks: { title: string; url: string; icon?: string }[] = [];
    try {
        if (user.customLinks) parsedLinks = JSON.parse(user.customLinks);
    } catch { parsedLinks = []; }

    const candidateForGate = {
        id: user.id,
        name: user.name || 'This candidate',
        image: user.image,
        headline: user.headline,
        location: user.location,
    };

    // AI-Verified signal (public — this is what makes recruiters book an interview).
    const aiInterviews: any[] = (user as any).interviews || [];
    const topInterviewScore = aiInterviews.length ? Math.max(...aiInterviews.map((i: any) => i.score || 0)) : 0;
    const interviewRoles = Array.from(new Set(aiInterviews.map((i: any) => i.role).filter(Boolean)));

    // Build resume data from the loaded profile and generate a real, text-based PDF
    // via the SkilledCore template (replaces the old window.print() screenshot).
    const buildResumeData = () => ({
        name: user.name || '',
        headline: user.headline || '',
        location: user.location || '',
        email: '',
        phone: '',
        summary: user.bio || '',
        socials: [
            ...(user.linkedin ? [{ label: 'LinkedIn', url: user.linkedin }] : []),
            ...(user.github ? [{ label: 'GitHub', url: user.github }] : []),
            ...parsedLinks.map((l) => ({ label: l.title, url: l.url })),
        ],
        experience: (user.experience || []).map((e: any) => ({
            title: e.position || e.title || '',
            company: e.company || '',
            location: e.location || '',
            startDate: e.startDate || '',
            endDate: e.endDate || 'Present',
            bullets: e.description ? [e.description] : [],
        })),
        education: (user.education || []).map((e: any) => ({
            degree: e.degree || '',
            institution: e.school || e.institution || '',
            startYear: e.startDate || e.startYear || '',
            endYear: e.endDate || e.endYear || '',
            honors: e.honors || '',
        })),
        skills: parsedSkills,
        projects: (user.projects || []).map((p: any) => ({
            name: p.title || p.name || '',
            description: p.description || '',
            technologies: p.technologies || [],
            url: p.link || p.url || '',
        })),
        aiInterviewScore: null,
        verifiedBadges: [],
    });

    const handleSaveToPdf = async () => {
        try {
            setIsSavingPdf(true);
            const res = await fetch('/api/resume-export/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeData: buildResumeData() }),
            });
            if (!res.ok) throw new Error('Failed to generate PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(user.name || 'profile').replace(/\s+/g, '_')}_SkilledCore.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Could not generate the PDF. Please try again.');
        } finally {
            setIsSavingPdf(false);
        }
    };

    // Helper to render brand icons
    const renderLinkIcon = (iconName?: string) => {
        if (!iconName) return <Globe className="w-4 h-4 text-[var(--sc-purple-600)]" />;
        const IconComponent = iconMap[iconName];
        if (IconComponent) {
            return <IconComponent className="w-4 h-4 text-[var(--sc-purple-600)]" />;
        }
        return <Globe className="w-4 h-4 text-[var(--sc-purple-600)]" />;
    };

    // Helpers
    const openModal = (section: any, project: any = null) => {
        setProjectToEdit(project);
        setEditSection(section);
    };

    const handleDeleteInterview = async (interviewId: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!window.confirm("Are you sure you want to permanently delete this AI Interview Report? This action cannot be undone.")) {
            return;
        }

        setDeletingId(interviewId);
        try {
            const res = await deleteInterview(interviewId);
            if (res.success) {
                toast.success("AI Interview Report successfully deleted.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete interview report.");
            }
        } catch (err) {
            console.error("Delete interview error:", err);
            toast.error("An unexpected error occurred.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFollow = async () => {
        setIsFollowLoading(true);
        // Optimistic
        const newState = !followingState;
        setFollowingState(newState);
        setFollowerCount(prev => newState ? prev + 1 : prev - 1);

        try {
            const res = await toggleFollow(user.id);
            if (!res.success) {
                // Revert
                setFollowingState(!newState);
                setFollowerCount(prev => !newState ? prev + 1 : prev - 1);
                toast.error(res.message);
            } else {
                toast.success(res.following ? "Following" : "Unfollowed");
            }
        } catch (error) {
            setFollowingState(!newState);
            setFollowerCount(prev => !newState ? prev + 1 : prev - 1);
            toast.error("Action failed");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleConnect = async () => {
        setIsConnectLoading(true);
        setConnStatus('PENDING_SENT'); // Optimistic
        try {
            const res = await sendConnectionRequest(user.id);
            if (!res.success) {
                setConnStatus('NONE');
                toast.error(res.message);
            } else {
                toast.success("Connection request sent");
            }
        } catch (e) {
            setConnStatus('NONE');
            toast.error("Failed to send request");
        } finally {
            setIsConnectLoading(false);
        }
    };

    const handleAccept = async () => {
        setIsConnectLoading(true);
        // Optimistic
        setConnStatus('CONNECTED');
        try {
            // We need connection ID? Or just user ID? 
            // The action updateConnectionStatus expects connectionID. 
            // But here we only have userId. 
            // Ideally we should have connectionId passed, OR update action to take userId.
            // Let's refactor action briefly? No, sticking to safe route, assume we need to find connection first.
            // Actually, usually accepting is done from Network page.
            // FROM PROFILE: We can't easily accept without ID unless we look it up.
            // I'll update `sendConnectionRequest` to be smart but `updateConnectionStatus` needs ID.
            // I'll make a new action `respondToFriendRequest(userId, action)` in `network/actions` or just use what I have.
            // For expediency, I will update `network/actions` to include `acceptRequestFromUser`.

            // Let's temporarily block "Accept" from profile or implement it properly.
            // I will re-implement this correctly.

            toast.info("Please accept from network page for now.");

        } catch (e) { }
    }


    // Sort experience
    const experienceData = user.experience
        ? [...user.experience].sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
        : [];

    const educationData = user.education
        ? [...user.education].sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
        : [];

    const isProfileIncomplete = isOwner && user.role !== 'RECRUITER' && (!user.bio || experienceData.length === 0 || parsedSkills.length < 3);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">

            {/* --- Modals Manager --- */}
            {isOwner && (
                <>
                    <ProfileEditModals
                        user={user}
                        isOpen={!!editSection}
                        section={editSection}
                        onClose={() => setEditSection(null)}
                        projectToEdit={projectToEdit}
                    />
                    <ResumeProfileBuilder
                        user={user}
                        isOpen={isResumeBuilderOpen}
                        onClose={handleCloseResumeBuilder}
                        context="profile"
                    />
                </>
            )}

            <FollowListDialog
                userId={user.id}
                type={listType}
                isOpen={!!listType}
                onClose={() => setListType(null)}
                isOwner={isOwner}
            />

            {/* --- HERO BANNER --- */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden group">
                {/* Cover Image */}
                <div className="absolute inset-0 bg-zinc-900">
                    {user.bannerUrl ? (
                        <img src={user.bannerUrl} alt="Cover" className="w-full h-full object-cover opacity-100" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-violet-900 via-zinc-900 to-teal-900 opacity-50" />
                    )}
                </div>

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-full font-bold px-4 py-2 transition-all">
                        ← Back
                    </Button>
                </div>

                {/* Edit Banner Trigger */}
                {isOwner && (
                    <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" onClick={() => openModal('banner')} className="bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/10 rounded-full font-bold px-4 py-2 transition-all">
                            <Pencil className="w-4 h-4 mr-2" /> Edit Banner
                        </Button>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-6 relative -mt-32">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">

                    {/* --- LEFT COLUMN: IDENTITY & SIDEBAR --- */}
                    <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-6">

                        {/* Identity Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden group">

                            {/* Edit Identity Trigger */}
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openModal('identity')}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Avatar */}
                            <div className="relative mx-auto w-32 h-32 mb-4 group/avatar cursor-pointer" onClick={() => isOwner && openModal('identity')}>
                                <div className={cn(
                                    "w-32 h-32 rounded-full border-4 overflow-hidden relative z-10 bg-slate-100 flex items-center justify-center text-4xl font-bold border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] text-slate-700"
                                )}>
                                    {user.image ? <img src={user.image} alt="Avatar" className="w-full h-full object-cover" /> : user.name?.charAt(0)}

                                    {/* Edit Overlay */}
                                    {isOwner && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all z-20">
                                            <Camera className="w-8 h-8 text-white/80" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Role Badge (Top Left) */}
                            <div className="absolute top-4 left-4">
                                <div className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 uppercase shadow-sm">
                                    {user.role}
                                </div>
                            </div>

                            {/* Plan Badge (Top Right) - Only for Paid Plans */}
                            {(user.plan === 'PRO' || user.plan === 'ULTRA') && (
                                <div className="absolute top-4 right-4">
                                    <PlanBadge plan={user.plan} />
                                </div>
                            )}

                            <h1 className="text-2xl font-bold font-cinzel tracking-wide text-slate-950 mb-1 flex items-center justify-center gap-2">
                                {user.name}
                                {(user.plan === 'PRO' || user.plan === 'ULTRA') && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <BadgeCheck className="w-5 h-5 text-sky-500 fill-sky-500/10" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{user.plan === 'ULTRA' ? 'Elite Verified' : 'Verified Pro'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </h1>
                            {user.username && (
                                <p className="text-sm text-slate-400 mb-1">@{user.username}</p>
                            )}
                            <p className="text-sm text-slate-600 mb-4 h-6 overflow-hidden text-ellipsis whitespace-nowrap font-medium">{user.headline || "No headline set"}</p>

                            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mb-4 font-mono">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-450" /> {user.location || "Unknown"}</span>
                            </div>

                            {/* STATS */}
                            <div className="flex justify-center gap-6 text-sm mb-6 pb-6 border-b border-slate-100">
                                <button
                                    onClick={() => setListType('followers')}
                                    className="text-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                >
                                    <div className="font-bold text-slate-900 text-lg group-hover:text-sc-purple-600 transition-colors">{followerCount}</div>
                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Followers</div>
                                </button>
                                <button
                                    onClick={() => setListType('following')}
                                    className="text-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                >
                                    <div className="font-bold text-slate-900 text-lg group-hover:text-sc-purple-600 transition-colors">{counts.following}</div>
                                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Following</div>
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                {isOwner ? (
                                    <>
                                        {/* Resume Section - Hidden for Recruiters */}
                                        {user.role !== 'RECRUITER' && (
                                            <>
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2 w-full text-center">Resume</h3>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleOpenResumeBuilder}
                                                    style={{ color: '#5B35D5', border: '1px solid #B4A3F3', backgroundColor: '#FFFFFF' }}
                                                    className="w-full border-[var(--sc-purple-300)] text-[var(--sc-purple-700)] bg-white hover:bg-[var(--sc-purple-50)] hover:text-[var(--sc-purple-800)] hover:border-[var(--sc-purple-400)] shadow-sm font-semibold py-2 transition-all flex items-center justify-center gap-2 mb-3 text-xs rounded-xl"
                                                >
                                                    <Sparkles className="w-4 h-4 text-[var(--sc-purple-600)]" /> Build Profile with AI Resume
                                                </Button>
                                                <div className="flex gap-2 w-full">
                                                    {user.resumeUrl ? (
                                                        <Button
                                                            variant="outline"
                                                            asChild
                                                            className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm font-medium transition-all"
                                                        >
                                                            <Link href={user.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="w-4 h-4 mr-2 text-slate-500" /> View
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            disabled
                                                            className="flex-1 border border-slate-100 text-slate-300 bg-slate-50/50 cursor-not-allowed"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2 text-slate-350" /> View
                                                        </Button>
                                                    )}

                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => openModal('resume')}
                                                                    className="flex-1 border border-sc-purple-200 text-sc-purple-600 bg-sc-purple-50/30 hover:bg-sc-purple-50 hover:text-sc-purple-700 hover:border-sc-purple-300 shadow-sm font-medium transition-all"
                                                                >
                                                                    <FileText className="w-4 h-4 mr-2 text-sc-purple-500" /> Update
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-slate-800 border-white/10 text-slate-300 text-xs shadow-xl">
                                                                <p>Update your resume with new achievements</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setEditSection('share')}
                                                        className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
                                                    >
                                                        <Share2 className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}

                                        {/* For Recruiters, just show Share button if needed, or nothing in this slot. 
                                            Actually, Recruiters might want to Share Profile too. */}
                                        {user.role === 'RECRUITER' && (
                                            <div className="flex gap-2 w-full mt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setEditSection('share')}
                                                    className="w-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold py-2 transition-all"
                                                >
                                                    <Share2 className="w-4 h-4 mr-2 text-slate-500" /> Share Profile
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {isRestrictedViewer ? (
                                            <Button
                                                className="w-full bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold py-2 shadow-sm"
                                                onClick={() => setBookingOpen(true)}
                                            >
                                                <Lock className="w-4 h-4 mr-2" /> Book Interview
                                            </Button>
                                        ) : (
                                        <div className="flex gap-2">
                                            {/* PRIMARY ACTION LOGIC */}
                                            {connStatus === 'CONNECTED' ? (
                                                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 shadow-sm" onClick={() => router.push(`/messages?userId=${user.id}`)}>
                                                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                                                </Button>
                                            ) : connStatus === 'PENDING_SENT' ? (
                                                <Button disabled className="flex-1 bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed font-medium">
                                                    <CheckCircle2 className="w-4 h-4 mr-2 text-slate-400" /> Pending
                                                </Button>
                                            ) : connStatus === 'PENDING_RECEIVED' ? (
                                                <Button className="flex-1 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold py-2 shadow-sm" onClick={() => router.push('/network')}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Respond
                                                </Button>
                                            ) : (
                                                // NOT CONNECTED
                                                <>
                                                    {/* If OPEN Node & Not Recruiter -> Primary Connect */}
                                                    {user.nodeType !== 'BROADCAST' && user.role !== 'RECRUITER' ? (
                                                        <Button
                                                            className="flex-1 bg-sc-purple-600 hover:bg-sc-purple-700 text-white font-semibold py-2 shadow-md shadow-indigo-100"
                                                            onClick={handleConnect}
                                                            disabled={isConnectLoading}
                                                        >
                                                            {isConnectLoading ? <span className="animate-spin text-xl mr-2">⟳</span> : <UserPlus className="w-4 h-4 mr-2" />}
                                                            Connect
                                                        </Button>
                                                    ) : (
                                                        // If BROADCAST/RECRUITER -> Primary Follow
                                                        <Button
                                                            className={cn(
                                                                "flex-1 font-semibold py-2 shadow-sm transition-all border",
                                                                followingState
                                                                    ? "bg-slate-100 hover:bg-red-50 hover:text-red-650 hover:border-red-200 text-slate-700 border-slate-200"
                                                                    : "bg-teal-650 hover:bg-teal-700 text-white border-transparent"
                                                            )}
                                                            onClick={handleFollow}
                                                            disabled={isFollowLoading}
                                                        >
                                                            {isFollowLoading ? <span className="animate-spin text-xl mr-2">⟳</span> : followingState ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                                            {followingState ? "Following" : "Follow"}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        )}
                                        {/* MORE MENU & VIEW RESUME */}
                                        <div className="flex gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-white shadow-sm">
                                                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white border border-slate-200 text-slate-750 shadow-lg font-medium">
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-slate-50 focus:bg-slate-50 text-slate-700">
                                                        <Send className="w-4 h-4 text-slate-400" /> Send profile via message
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-slate-50 focus:bg-slate-50 text-slate-700" onClick={() => setEditSection('share')}>
                                                        <Share2 className="w-4 h-4 text-slate-400" /> Share Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer gap-2 hover:bg-slate-50 focus:bg-slate-50 text-slate-700"
                                                        onClick={() => isRestrictedViewer ? setGateAction('download this resume') : handleSaveToPdf()}
                                                    >
                                                        <Download className="w-4 h-4 text-slate-400" /> {isSavingPdf ? 'Preparing PDF…' : 'Save to PDF'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-red-50 focus:bg-red-50 text-red-650">
                                                        <Flag className="w-4 h-4 text-red-500" /> Report User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Resume View for Visitors - Only show for Candidates with resume */}
                                            {user.role !== 'RECRUITER' && user.resumeUrl && (
                                                isRestrictedViewer ? (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setGateAction('view this resume')}
                                                        className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold transition-all"
                                                    >
                                                        <Lock className="w-4 h-4 mr-2 text-slate-500" /> View Resume
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                        className="flex-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm font-semibold transition-all"
                                                    >
                                                        <Link href={user.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="w-4 h-4 mr-2 text-slate-500" /> View Resume
                                                        </Link>
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI-Verified highlight — the recruiter-facing signal (never gated) */}
                        {user.role !== 'RECRUITER' && aiInterviews.length > 0 && (
                            <div className="bg-white rounded-xl border border-[var(--sc-purple-200)] p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <BadgeCheck className="w-5 h-5 text-[var(--sc-purple-600)]" />
                                    <h3 className="text-sm font-bold text-[var(--text-heading)]">AI-Verified</h3>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-[var(--text-heading)]">{topInterviewScore}</span>
                                    <span className="text-sm text-[var(--text-secondary)] mb-1">/ 100 top score</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    {aiInterviews.length} verified assessment{aiInterviews.length > 1 ? 's' : ''}
                                </p>
                                {interviewRoles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {interviewRoles.slice(0, 4).map((r: any, idx: number) => (
                                            <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-[var(--sc-purple-50)] text-[var(--sc-purple-700)] border border-[var(--sc-purple-100)] px-2 py-0.5 rounded">{r}</span>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => setActiveTab('interviews')}
                                    className="mt-4 text-xs font-bold text-[var(--sc-purple-600)] hover:text-[var(--sc-purple-800)] flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                                >
                                    View AI interviews <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Sidebar: Socials & Custom Links */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 group relative shadow-sm">
                            {/* Edit Links Trigger */}
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openModal('links')}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}

                            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Connect</h3>
                            <div className="relative">
                            {isRestrictedViewer && (user.linkedin || user.github || parsedLinks.length > 0) && (
                                <button
                                    onClick={() => setGateAction('view contact & social links')}
                                    className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
                                >
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sc-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
                                        <Lock className="w-3.5 h-3.5" /> Book interview to view
                                    </span>
                                </button>
                            )}
                            <div className={cn("space-y-3", isRestrictedViewer && (user.linkedin || user.github || parsedLinks.length > 0) && "blur-sm pointer-events-none select-none")}>
                                {user.linkedin && (
                                    <Link href={user.linkedin} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-body)] hover:text-[var(--text-heading)] font-semibold shadow-sm rounded-lg flex items-center gap-1.5 p-2">
                                            <SocialIcon platform="linkedin" /> LinkedIn
                                        </Button>
                                    </Link>
                                )}
                                {user.github && (
                                    <Link href={user.github} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-body)] hover:text-[var(--text-heading)] font-semibold shadow-sm rounded-lg flex items-center gap-1.5 p-2">
                                            <SocialIcon platform="github" /> GitHub
                                        </Button>
                                    </Link>
                                )}
                                {parsedLinks.map((link, i) => (
                                    <Link key={i} href={link.url} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border border-[var(--border-default)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-body)] hover:text-[var(--text-heading)] font-semibold shadow-sm rounded-lg flex items-center gap-1.5 p-2">
                                            <SocialIcon platform={link.icon ? link.icon.replace(/^Si/, '').replace(/^Fa/, '').toLowerCase() : 'globe'} /> <span className="ml-0.5">{link.title}</span>
                                        </Button>
                                    </Link>
                                ))}
                                {(!user.linkedin && !user.github && parsedLinks.length === 0) && (
                                    <p className="text-[var(--text-secondary)] text-xs italic font-medium">No links added.</p>
                                )}
                            </div>
                            </div>
                        </div>

                    </div>

                    {/* --- RIGHT COLUMN: MAIN CONTENT --- */}
                    <div className="flex-1 space-y-8 pb-12">
                        {isProfileIncomplete && !isBannerDismissed && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-[var(--sc-purple-50)] border border-[var(--sc-purple-200)] rounded-xl p-4 flex items-start gap-3 relative shadow-sm"
                            >
                                <Sparkles className="w-5 h-5 text-[var(--sc-purple-600)] shrink-0 mt-0.5" />
                                <div className="flex-1 pr-6">
                                    <h4 className="text-sm font-bold text-[var(--sc-purple-900)] mb-1">Complete your SkilledCore identity</h4>
                                    <p className="text-xs text-[var(--sc-purple-700)] leading-relaxed font-medium mb-2">
                                        Having an elaborated bio, experience records, and at least 3 skills makes your profile significantly more discoverable to recruiters and unlocks deep talent analysis.
                                    </p>
                                    <button
                                        onClick={handleOpenResumeBuilder}
                                        className="text-xs font-bold text-[var(--sc-purple-600)] hover:text-[var(--sc-purple-800)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                    >
                                        Upload resume to build profile with AI in seconds →
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsBannerDismissed(true)}
                                    className="absolute top-3 right-3 text-[var(--sc-purple-400)] hover:text-[var(--sc-purple-650)] transition-colors cursor-pointer bg-transparent border-none"
                                    title="Dismiss"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-slate-200 px-2 sticky top-0 bg-slate-50/80 backdrop-blur-md z-40 pt-4">
                            {(['overview', 'projects', 'interviews'] as const).map((tab) => {
                                if (tab === 'projects' && user.role === 'RECRUITER') return null;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "pb-4 text-sm font-bold tracking-wide transition-all relative uppercase",
                                            activeTab === tab ? "text-sc-purple-700" : "text-slate-500 hover:text-slate-800"
                                        )}
                                    >
                                        {tab === 'interviews' ? 'AI Interviews' : tab}
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sc-purple-700"
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    {/* About Section */}
                                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm group relative">
                                        {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('about')} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-full transition-all"><Pencil className="w-4 h-4" /></Button>}
                                        <h2 className="text-lg font-bold text-slate-900 mb-4">About</h2>
                                        <p className="text-slate-650 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                                            {user.bio || "No bio info available."}
                                        </p>
                                    </section>

                                    {user.role !== 'RECRUITER' && (
                                        <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm group relative">
                                            {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('education')} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-full transition-all"><Pencil className="w-4 h-4" /></Button>}
                                            <h2 className="text-lg font-bold text-slate-900 mb-6">Education</h2>
                                            <div className="space-y-6 border-l border-slate-150 ml-3 pl-8 py-2">
                                                {educationData.map((edu: any, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-slate-50 border-2 border-teal-500/50 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-slate-900 font-bold text-md">{edu.school}</h3>
                                                            <p className="text-slate-600 text-sm font-semibold mb-1">{edu.degree}</p>
                                                            <p className="text-slate-450 text-xs font-medium">{edu.startDate}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {educationData.length === 0 && <p className="text-slate-400 text-sm italic">No education recorded.</p>}
                                            </div>
                                        </section>
                                    )}

                                    {user.role !== 'RECRUITER' && (
                                        <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm group relative">
                                            {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('skills')} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-full transition-all"><Pencil className="w-4 h-4" /></Button>}
                                            <h2 className="text-lg font-bold text-slate-900 mb-4">Skills & Arsenal</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {parsedSkills.map((skill, i) => {
                                                    const isVerified = skill.includes("(Verified)");
                                                    const cleanSkill = skill.replace(" (Verified)", "").replace("(Verified)", "");
                                                    return (
                                                        <SharedTag 
                                                            key={i} 
                                                            variant={isVerified ? "branded" : "neutral"}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {cleanSkill}
                                                            {isVerified && <CheckCircle2 className="w-3 h-3" />}
                                                        </SharedTag>
                                                    );
                                                })}
                                                {parsedSkills.length === 0 && <p className="text-slate-400 text-xs italic">No skills listed.</p>}
                                            </div>
                                        </section>
                                    )}

                                    {/* Experience Section */}
                                    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm group relative">
                                        {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('experience')} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 rounded-full transition-all"><Pencil className="w-4 h-4" /></Button>}
                                        <h2 className="text-lg font-bold text-slate-900 mb-6">Experience</h2>
                                        <div className="space-y-8 border-l border-slate-150 ml-3 pl-8 py-2">
                                            {experienceData.map((exp: any, i) => (
                                                <div key={i} className="relative">
                                                    <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-slate-50 border-2 border-violet-500/50 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-slate-900 font-bold text-md">{exp.position}</h3>
                                                        <p className="text-slate-600 text-sm font-semibold mb-1">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                                                        <p className="text-slate-500 text-sm leading-relaxed font-medium mt-2">{exp.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {experienceData.length === 0 && <p className="text-slate-400 text-sm italic">No experience recorded.</p>}
                                        </div>
                                    </section>

                                </motion.div>
                            )}

                            {activeTab === 'projects' && (
                                <motion.div
                                    key="projects"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {isOwner && (
                                        <Button onClick={() => openModal('projects')} className="w-full border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-sc-purple-700 font-semibold py-8 transition-all shadow-sm">
                                            <Plus className="w-5 h-5 mr-2" /> Add New Project
                                        </Button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.projects && user.projects.map((project: any) => (
                                            <div key={project.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group relative hover:border-sc-purple-300 hover:shadow-sm transition-all flex flex-col shadow-sm">
                                                {isOwner && (
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openModal('projects', project);
                                                        }}
                                                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md rounded-full border-none transition-all shadow-sm"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                )}

                                                <Link href={`/project/${project.id}`} className="block h-32 w-full overflow-hidden">
                                                    {project.imageUrl ? (
                                                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <FolderOpen className="w-8 h-8 opacity-50" />
                                                        </div>
                                                    )}
                                                </Link>

                                                <div className="p-4 flex flex-col flex-1">
                                                    <Link href={`/project/${project.id}`}>
                                                        <h3 className="font-bold text-lg text-slate-900 mb-1 hover:text-sc-purple-700 transition-colors">{project.title}</h3>
                                                    </Link>

                                                    <p className="text-slate-650 text-sm mb-4 line-clamp-3 flex-1 font-medium">{project.description}</p>

                                                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-100">
                                                        <Link href={`/project/${project.id}`} className="text-xs text-sc-purple-600 hover:text-sc-purple-800 font-bold flex items-center transition-colors">
                                                            View Details
                                                        </Link>
                                                        {project.link && (
                                                            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-700 flex items-center ml-auto transition-colors font-medium">
                                                                <LinkIcon className="w-3 h-3 mr-1" /> External Link
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(!user.projects || user.projects.length === 0) && !isOwner && (
                                        <div className="text-center py-20 text-slate-400 font-medium">
                                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30 text-sc-purple-600" />
                                            <p>No projects declassified.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'interviews' && (
                                <motion.div
                                    key="interviews"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(user as any).interviews?.map((interview: any) => {
                                            // Title case formatting helper inline
                                            const roleTitle = (() => {
                                                const r = interview.role || "General";
                                                const lower = r.toLowerCase();
                                                if (lower === "frontend") return "FrontEnd Interview";
                                                if (lower === "backend") return "BackEnd Interview";
                                                if (lower === "fullstack") return "FullStack Interview";
                                                return r
                                                    .split(/[-_\s]+/)
                                                    .map((word: string) => {
                                                        if (word.toLowerCase() === "frontend") return "FrontEnd";
                                                        if (word.toLowerCase() === "backend") return "BackEnd";
                                                        if (word.toLowerCase() === "fullstack") return "FullStack";
                                                        return word.charAt(0).toUpperCase() + word.slice(1);
                                                    })
                                                    .join(" ") + " Interview";
                                            })();

                                            // Rating calculator out of 5 stars
                                            const starRating = interview.score / 20;

                                            // Render Stars helper
                                            const renderStars = () => {
                                                const stars = [];
                                                const fullStars = Math.floor(starRating);
                                                const hasHalf = starRating % 1 >= 0.25 && starRating % 1 < 0.75;
                                                const roundedFull = starRating % 1 >= 0.75 ? fullStars + 1 : fullStars;

                                                for (let i = 1; i <= 5; i++) {
                                                    if (i <= roundedFull) {
                                                        stars.push(<Star key={i} size={15} className="fill-sc-purple-500 text-sc-purple-500 stroke-sc-purple-700" />);
                                                    } else if (i === roundedFull + 1 && hasHalf) {
                                                        stars.push(<StarHalf key={i} size={15} className="fill-sc-purple-500 text-sc-purple-500 stroke-sc-purple-700" />);
                                                    } else {
                                                        stars.push(<Star key={i} size={15} className="text-slate-200 fill-slate-100 stroke-slate-200" />);
                                                    }
                                                }
                                                return <div className="flex items-center gap-0.5">{stars}</div>;
                                            };

                                            return (
                                                <div key={interview.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-sc-purple-300 hover:shadow-sm transition-all flex flex-col h-full shadow-sm">
                                                    {/* Top banner graphic */}
                                                    <div className="w-full h-24 bg-gradient-to-br from-sc-purple-50/50 via-slate-50 to-teal-50/50 relative flex flex-col justify-end p-4 border-b border-slate-150 overflow-hidden">
                                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sc-purple-500/5 via-transparent to-transparent pointer-events-none" />
                                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                                            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold">
                                                                AI EVALUATED
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-sc-purple-600 uppercase tracking-widest font-bold mb-1">
                                                            SkilledCore Talent AI
                                                        </div>
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900 font-heading tracking-tight leading-snug group-hover:text-sc-purple-700 transition-colors">
                                                                {roleTitle}
                                                            </h3>
                                                            
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {renderStars()}
                                                                <span className="text-xs font-mono font-bold text-sc-purple-600 pl-1">
                                                                    {starRating.toFixed(1)} / 5.0
                                                                </span>
                                                            </div>

                                                            <p className="text-xs font-mono text-slate-500 mt-2 font-medium">
                                                                Difficulty: Level {interview.difficulty} • {new Date(interview.createdAt).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-slate-650 text-sm italic mt-3.5 leading-relaxed line-clamp-3 pl-1 font-medium">
                                                                &ldquo;{interview.feedback}&rdquo;
                                                            </p>
                                                        </div>

                                                        <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                                                            <Link 
                                                                href={`/interview/${interview.id}`}
                                                                className="text-sm font-bold text-sc-purple-600 hover:text-sc-purple-800 flex items-center gap-1.5 transition-colors group/btn"
                                                            >
                                                                <FileText className="w-4 h-4 text-sc-purple-500" />
                                                                Open Interview Details
                                                                <ArrowRight className="w-4 h-4 text-sc-purple-500 group-hover/btn:translate-x-0.5 transition-transform" />
                                                            </Link>

                                                            <div className="flex items-center gap-2">
                                                                {isAdmin && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        disabled={deletingId === interview.id}
                                                                        onClick={(e) => handleDeleteInterview(interview.id, e)}
                                                                        className="h-8 w-8 text-red-600 hover:text-red-500 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300 transition-all compact-btn shrink-0"
                                                                    >
                                                                        {deletingId === interview.id ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <span className="text-xs font-mono font-bold text-slate-650 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                                                                    SCORE: {interview.score}/100
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!(user as any).interviews || (user as any).interviews.length === 0) && (
                                            <div className="col-span-full text-center py-20 text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl">
                                                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30 text-sc-purple-600" />
                                                <p className="font-mono text-sm tracking-widest uppercase font-semibold">No interview simulations recorded.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>

                    </div>
                </div>
            </div>

            <RecruiterGate
                open={!!gateAction}
                onClose={() => setGateAction(null)}
                candidate={candidateForGate}
                action={gateAction || undefined}
                onBook={() => setBookingOpen(true)}
            />
            <BookingModal
                open={bookingOpen}
                onClose={() => setBookingOpen(false)}
                candidate={candidateForGate}
            />
        </div>
    );
}
