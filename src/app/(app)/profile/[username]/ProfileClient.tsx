'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, CloudUpload, FileText, Github, Globe, Link as LinkIcon, Linkedin, MapPin, MessageSquare, Pencil, Plus, Sparkles, Trash2, Users, Eye, MoreHorizontal, UserPlus, Send, Flag, Download, Share2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfileEditModals from '@/components/profile/ProfileEditModals';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toggleFollow } from '@/app/(app)/feed/actions';
import { sendConnectionRequest, updateConnectionStatus } from '@/app/(app)/network/actions';
import { toast } from 'sonner';
import * as SiIcons from 'react-icons/si';
import * as FaIcons from 'react-icons/fa';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,

    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FollowListDialog } from '@/components/profile/FollowListDialog';
import { PlanBadge } from '@/components/credits/PlanBadge';

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
}

export default function ProfileClient({ user, isOwner, posts, isFollowing = false, connectionStatus = 'NONE', counts = { followers: 0, following: 0 } }: ProfileClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'interviews'>('overview');

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

    // Parse Data
    let parsedSkills: string[] = [];
    try {
        if (user.skills) {
            // Handle both CSV and JSON
            if (user.skills.startsWith('[')) parsedSkills = JSON.parse(user.skills);
            else parsedSkills = user.skills.split(',').filter(Boolean);
        }
    } catch { parsedSkills = []; }

    let parsedLinks: { title: string; url: string; icon?: string }[] = [];
    try {
        if (user.customLinks) parsedLinks = JSON.parse(user.customLinks);
    } catch { parsedLinks = []; }

    // Helper to render brand icons
    const renderLinkIcon = (iconName?: string) => {
        if (!iconName) return <Globe className="w-4 h-4 text-violet-400" />;
        const IconComponent = (SiIcons as any)[iconName] || (FaIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent className="w-4 h-4 text-violet-400" />;
        }
        return <Globe className="w-4 h-4 text-violet-400" />;
    };

    // Helpers
    const openModal = (section: any, project: any = null) => {
        setProjectToEdit(project);
        setEditSection(section);
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

    return (
        <div className="min-h-screen bg-obsidian text-white pb-20 font-sans">

            {/* --- Modals Manager --- */}
            {isOwner && (
                <ProfileEditModals
                    user={user}
                    isOpen={!!editSection}
                    section={editSection}
                    onClose={() => setEditSection(null)}
                    projectToEdit={projectToEdit}
                />
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
                        <img src={user.bannerUrl} alt="Cover" className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-violet-900 via-zinc-900 to-teal-900 opacity-50" />
                    )}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-obsidian to-transparent" />

                {/* Back Button */}
                <div className="absolute top-6 left-6 z-10">
                    <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10">
                        ← Back
                    </Button>
                </div>

                {/* Edit Banner Trigger */}
                {isOwner && (
                    <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" onClick={() => openModal('banner')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none">
                            <Pencil className="w-4 h-4 mr-2" /> Edit Banner
                        </Button>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-6 relative -mt-32">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* --- LEFT COLUMN: IDENTITY & SIDEBAR --- */}
                    <div className="w-full md:w-80 space-y-6">

                        {/* Identity Card */}
                        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden group">

                            {/* Edit Identity Trigger */}
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openModal('identity')}
                                    className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Avatar */}
                            <div className="relative mx-auto w-32 h-32 mb-4 group/avatar cursor-pointer" onClick={() => isOwner && openModal('identity')}>
                                <div className={cn(
                                    "w-32 h-32 rounded-full border-4 overflow-hidden relative z-10 bg-zinc-800 flex items-center justify-center text-4xl font-bold border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
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
                                <div className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase shadow-lg">
                                    {user.role}
                                </div>
                            </div>

                            {/* Plan Badge (Top Right) */}
                            <div className="absolute top-4 right-4">
                                <PlanBadge plan={user.plan || "BASIC"} />
                            </div>

                            <h1 className="text-2xl font-bold font-cinzel tracking-wide mb-1 flex items-center justify-center gap-2">
                                {user.name}
                                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                            </h1>
                            {user.username && (
                                <p className="text-sm text-zinc-500 mb-1">@{user.username}</p>
                            )}
                            <p className="text-sm text-zinc-400 mb-4 h-6 overflow-hidden text-ellipsis whitespace-nowrap">{user.headline || "No headline set"}</p>

                            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 mb-4 font-mono">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.location || "Unknown"}</span>
                            </div>

                            {/* STATS */}
                            <div className="flex justify-center gap-6 text-sm mb-6 pb-6 border-b border-white/5">
                                <button
                                    onClick={() => setListType('followers')}
                                    className="text-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                                >
                                    <div className="font-bold text-white text-lg group-hover:text-violet-400 transition-colors">{followerCount}</div>
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider">Followers</div>
                                </button>
                                <button
                                    onClick={() => setListType('following')}
                                    className="text-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                                >
                                    <div className="font-bold text-white text-lg group-hover:text-violet-400 transition-colors">{counts.following}</div>
                                    <div className="text-zinc-500 text-xs uppercase tracking-wider">Following</div>
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                {isOwner ? (
                                    <>
                                        {/* Resume Section - Hidden for Recruiters */}
                                        {user.role !== 'RECRUITER' && (
                                            <>
                                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 mt-2 w-full text-center">Resume</h3>
                                                <div className="flex gap-2 w-full">
                                                    {user.resumeUrl ? (
                                                        <Button
                                                            variant="outline"
                                                            asChild
                                                            className="flex-1 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                        >
                                                            <Link href={user.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                                <Eye className="w-4 h-4 mr-2" /> View
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            disabled
                                                            className="flex-1 border-dashed border-zinc-700 text-zinc-400 opacity-50 cursor-not-allowed"
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" /> View
                                                        </Button>
                                                    )}

                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => openModal('resume')}
                                                                    className="flex-1 border-dashed border-violet-500/30 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                                                >
                                                                    <FileText className="w-4 h-4 mr-2" /> Update
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-zinc-800 border-white/10 text-zinc-300 text-xs shadow-xl">
                                                                <p>Update your resume with new achievements</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setEditSection('share')}
                                                        className="border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                    >
                                                        <Share2 className="w-4 h-4" />
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
                                                    className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Share2 className="w-4 h-4 mr-2" /> Share Profile
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            {/* PRIMARY ACTION LOGIC */}
                                            {connStatus === 'CONNECTED' ? (
                                                <Button className="flex-1 bg-zinc-800 hover:bg-zinc-700" onClick={() => router.push(`/messages?userId=${user.id}`)}>
                                                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                                                </Button>
                                            ) : connStatus === 'PENDING_SENT' ? (
                                                <Button disabled className="flex-1 bg-zinc-800 text-zinc-400">
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Pending
                                                </Button>
                                            ) : connStatus === 'PENDING_RECEIVED' ? (
                                                <Button className="flex-1 bg-violet-600 hover:bg-violet-500" onClick={() => router.push('/network')}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Respond
                                                </Button>
                                            ) : (
                                                // NOT CONNECTED
                                                <>
                                                    {/* If OPEN Node & Not Recruiter -> Primary Connect */}
                                                    {user.nodeType !== 'BROADCAST' && user.role !== 'RECRUITER' ? (
                                                        <Button
                                                            className="flex-1 bg-violet-600 hover:bg-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
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
                                                                "flex-1 shadow-lg transition-all",
                                                                followingState
                                                                    ? "bg-zinc-800 hover:bg-red-900/20 hover:text-red-400 text-zinc-400"
                                                                    : "bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]"
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

                                            {/* SECONDARY ACTION */}
                                            {/* If we showed Connect as Primary, Show Follow as Secondary (if not already following) */}
                                            {connStatus === 'NONE' && user.nodeType !== 'BROADCAST' && user.role !== 'RECRUITER' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn("border border-white/10", followingState ? "text-violet-400" : "text-zinc-400")}
                                                    onClick={handleFollow}
                                                >
                                                    {followingState ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </Button>
                                            )}

                                            {/* If we showed Follow as Primary (Broadcast), Show Connect as Secondary */}
                                            {connStatus === 'NONE' && (user.nodeType === 'BROADCAST' || user.role === 'RECRUITER') && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="border border-white/10 text-zinc-400 hover:bg-white/5">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                                                        <DropdownMenuItem onClick={handleConnect}>
                                                            <UserPlus className="w-4 h-4 mr-2" /> Connect
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/profile/${user.username}`);
                                                            toast.success("Profile link copied");
                                                        }}>
                                                            <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                        {/* MORE MENU & VIEW RESUME */}
                                        <div className="flex gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="border-zinc-700 text-zinc-400 hover:text-white">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5">
                                                        <Send className="w-4 h-4" /> Send profile via message
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5" onClick={() => setEditSection('share')}>
                                                        <Share2 className="w-4 h-4" /> Share Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5" onClick={() => window.print()}>
                                                        <Download className="w-4 h-4" /> Save to PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-2 hover:bg-white/5 text-red-400">
                                                        <Flag className="w-4 h-4" /> Report User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {/* Resume View for Visitors - Only show for Candidates with resume */}
                                            {user.role !== 'RECRUITER' && user.resumeUrl && (
                                                <Button
                                                    variant="outline"
                                                    asChild
                                                    className="flex-1 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                >
                                                    <Link href={user.resumeUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="w-4 h-4 mr-2" /> View Resume
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Socials & Custom Links */}
                        <div className="bg-zinc-900/50 rounded-xl border border-white/5 p-6 space-y-4 group relative">
                            {/* Edit Links Trigger */}
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openModal('links')}
                                    className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}

                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Connect</h3>
                            <div className="space-y-3">
                                {user.linkedin && (
                                    <Link href={user.linkedin} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white">
                                            <Linkedin className="w-4 h-4 mr-2 text-[#0077b5]" /> LinkedIn
                                        </Button>
                                    </Link>
                                )}
                                {user.github && (
                                    <Link href={user.github} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white">
                                            <Github className="w-4 h-4 mr-2 text-white" /> GitHub
                                        </Button>
                                    </Link>
                                )}
                                {parsedLinks.map((link, i) => (
                                    <Link key={i} href={link.url} target="_blank" className="block">
                                        <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white">
                                            {renderLinkIcon(link.icon)} <span className="ml-2">{link.title}</span>
                                        </Button>
                                    </Link>
                                ))}
                                {(!user.linkedin && !user.github && parsedLinks.length === 0) && (
                                    <p className="text-zinc-500 text-xs italic">No links added.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* --- RIGHT COLUMN: MAIN CONTENT --- */}
                    <div className="flex-1 space-y-8 pb-12">

                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-white/10 px-2 sticky top-0 bg-obsidian/80 backdrop-blur-md z-40 pt-4">
                            {(['overview', 'projects', 'interviews'] as const).map((tab) => {
                                if (tab === 'projects' && user.role === 'RECRUITER') return null;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "pb-4 text-sm font-bold tracking-wide transition-all relative uppercase",
                                            activeTab === tab ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {tab === 'interviews' ? 'AI Interviews' : tab}
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
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
                                    <section className="bg-zinc-900/30 rounded-xl p-6 border border-white/5 group relative">
                                        {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('about')} className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></Button>}
                                        <h2 className="text-lg font-bold text-white mb-4">About</h2>
                                        <p className="text-zinc-400 leading-relaxed text-sm whitespace-pre-wrap">
                                            {user.bio || "No bio info available."}
                                        </p>
                                    </section>

                                    {user.role !== 'RECRUITER' && (
                                        <section className="bg-zinc-900/30 rounded-xl p-6 border border-white/5 group relative">
                                            {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('education')} className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></Button>}
                                            <h2 className="text-lg font-bold text-white mb-6">Education</h2>
                                            <div className="space-y-6 border-l border-white/10 ml-3 pl-8 py-2">
                                                {educationData.map((edu: any, i) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-zinc-900 border-2 border-teal-500/50 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-bold text-md">{edu.school}</h3>
                                                            <p className="text-zinc-400 text-sm mb-1">{edu.degree}</p>
                                                            <p className="text-zinc-500 text-sm">{edu.startDate}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {educationData.length === 0 && <p className="text-zinc-500 text-sm italic">No education recorded.</p>}
                                            </div>
                                        </section>
                                    )}

                                    {user.role !== 'RECRUITER' && (
                                        <section className="bg-zinc-900/30 rounded-xl p-6 border border-white/5 group relative">
                                            {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('skills')} className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></Button>}
                                            <h2 className="text-lg font-bold text-white mb-4">Skills & Arsenal</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {parsedSkills.map((skill, i) => {
                                                    const isVerified = skill.includes("(Verified)");
                                                    const cleanSkill = skill.replace(" (Verified)", "").replace("(Verified)", "");
                                                    return (
                                                        <div key={i} className={cn(
                                                            "px-3 py-1.5 rounded-md text-xs font-mono font-medium border flex items-center gap-2",
                                                            isVerified
                                                                ? "bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                                                : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                                                        )}>
                                                            {cleanSkill}
                                                            {isVerified && <CheckCircle2 className="w-3 h-3 text-violet-400" />}
                                                        </div>
                                                    );
                                                })}
                                                {parsedSkills.length === 0 && <p className="text-zinc-500 text-xs italic">No skills listed.</p>}
                                            </div>
                                        </section>
                                    )}

                                    {/* Experience Section */}
                                    <section className="bg-zinc-900/30 rounded-xl p-6 border border-white/5 group relative">
                                        {isOwner && <Button variant="ghost" size="icon" onClick={() => openModal('experience')} className="absolute top-2 right-2 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></Button>}
                                        <h2 className="text-lg font-bold text-white mb-6">Experience</h2>
                                        <div className="space-y-8 border-l border-white/10 ml-3 pl-8 py-2">
                                            {experienceData.map((exp: any, i) => (
                                                <div key={i} className="relative">
                                                    <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-zinc-900 border-2 border-violet-500/50 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-md">{exp.position}</h3>
                                                        <p className="text-zinc-400 text-sm mb-1">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                                                        <p className="text-zinc-500 text-sm leading-relaxed mt-2">{exp.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {experienceData.length === 0 && <p className="text-zinc-500 text-sm italic">No experience recorded.</p>}
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
                                        <Button onClick={() => openModal('projects')} className="w-full border border-dashed border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white py-8">
                                            <Plus className="w-5 h-5 mr-2" /> Add New Project
                                        </Button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.projects && user.projects.map((project: any) => (
                                            <div key={project.id} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden group relative hover:border-violet-500/30 transition-all">
                                                {isOwner && (
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => openModal('projects', project)}
                                                        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {project.imageUrl && (
                                                    <div className="h-32 w-full overflow-hidden">
                                                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    <h3 className="font-bold text-lg text-white mb-1">{project.title}</h3>
                                                    <p className="text-zinc-400 text-sm mb-4 line-clamp-3">{project.description}</p>
                                                    {project.link && (
                                                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:text-violet-300 flex items-center">
                                                            <LinkIcon className="w-3 h-3 mr-1" /> View Project
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(!user.projects || user.projects.length === 0) && !isOwner && (
                                        <div className="text-center py-20 text-zinc-600">
                                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(user as any).interviews?.map((interview: any) => {
                                            // Grade Helper
                                            const getGrade = (score: number) => {
                                                if (score >= 97) return "S";
                                                if (score >= 90) return "A";
                                                if (score >= 80) return "B";
                                                if (score >= 70) return "C";
                                                return "F";
                                            };
                                            const grade = getGrade(interview.score);

                                            return (
                                                <div key={interview.id} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden group relative hover:border-cyan-500/30 transition-all p-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-lg text-white uppercase tracking-wider">{interview.role}</h3>
                                                            <span className="text-xs font-mono text-zinc-500">LVL {interview.difficulty} • {new Date(interview.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl",
                                                            grade === 'S' || grade === 'A' ? "bg-cyan-500/20 text-cyan-400" :
                                                                grade === 'B' ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                                                        )}>
                                                            {grade}
                                                        </div>
                                                    </div>

                                                    <p className="text-zinc-400 text-sm italic mb-4 line-clamp-2">"{interview.feedback}"</p>

                                                    <div className="flex justify-between items-center text-xs font-mono text-zinc-500 border-t border-white/5 pt-3">
                                                        <span>SCORE: {interview.score}/100</span>
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="w-3 h-3" /> Public
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!(user as any).interviews || (user as any).interviews.length === 0) && (
                                            <div className="col-span-full text-center py-20 text-zinc-600">
                                                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p>No interview simulations recorded.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>

                    </div>
                </div>
            </div>
        </div>
    );
}
