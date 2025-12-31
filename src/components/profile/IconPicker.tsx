'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import * as SiIcons from 'react-icons/si';
import * as FaIcons from 'react-icons/fa';
import { Globe } from 'lucide-react';

// Brand icons collection (200+ icons)
const brandIcons = [
    // Social Media
    { name: 'LinkedIn', icon: 'SiLinkedin', category: 'Social' },
    { name: 'Twitter/X', icon: 'SiX', category: 'Social' },
    { name: 'Facebook', icon: 'SiFacebook', category: 'Social' },
    { name: 'Instagram', icon: 'SiInstagram', category: 'Social' },
    { name: 'YouTube', icon: 'SiYoutube', category: 'Social' },
    { name: 'TikTok', icon: 'SiTiktok', category: 'Social' },
    { name: 'Discord', icon: 'SiDiscord', category: 'Social' },
    { name: 'Telegram', icon: 'SiTelegram', category: 'Social' },
    { name: 'WhatsApp', icon: 'SiWhatsapp', category: 'Social' },
    { name: 'Snapchat', icon: 'SiSnapchat', category: 'Social' },
    { name: 'Reddit', icon: 'SiReddit', category: 'Social' },
    { name: 'Pinterest', icon: 'SiPinterest', category: 'Social' },
    { name: 'Threads', icon: 'SiThreads', category: 'Social' },
    { name: 'Mastodon', icon: 'SiMastodon', category: 'Social' },
    { name: 'Bluesky', icon: 'SiBluesky', category: 'Social' },

    // Development
    { name: 'GitHub', icon: 'SiGithub', category: 'Development' },
    { name: 'GitLab', icon: 'SiGitlab', category: 'Development' },
    { name: 'Stack Overflow', icon: 'SiStackoverflow', category: 'Development' },
    { name: 'CodePen', icon: 'SiCodepen', category: 'Development' },
    { name: 'Dev.to', icon: 'SiDevdotto', category: 'Development' },
    { name: 'npm', icon: 'SiNpm', category: 'Development' },
    { name: 'Docker', icon: 'SiDocker', category: 'Development' },
    { name: 'Kubernetes', icon: 'SiKubernetes', category: 'Development' },
    { name: 'Bitbucket', icon: 'SiBitbucket', category: 'Development' },
    { name: 'Vercel', icon: 'SiVercel', category: 'Development' },
    { name: 'Netlify', icon: 'SiNetlify', category: 'Development' },
    { name: 'Heroku', icon: 'SiHeroku', category: 'Development' },
    { name: 'AWS', icon: 'SiAmazonaws', category: 'Development' },
    { name: 'Azure', icon: 'SiMicrosoftazure', category: 'Development' },
    { name: 'Google Cloud', icon: 'SiGooglecloud', category: 'Development' },
    { name: 'DigitalOcean', icon: 'SiDigitalocean', category: 'Development' },
    { name: 'Firebase', icon: 'SiFirebase', category: 'Development' },
    { name: 'Supabase', icon: 'SiSupabase', category: 'Development' },
    { name: 'MongoDB', icon: 'SiMongodb', category: 'Development' },
    { name: 'PostgreSQL', icon: 'SiPostgresql', category: 'Development' },
    { name: 'MySQL', icon: 'SiMysql', category: 'Development' },
    { name: 'Redis', icon: 'SiRedis', category: 'Development' },
    { name: 'Cloudflare', icon: 'SiCloudflare', category: 'Development' },

    // Design & Creative
    { name: 'Figma', icon: 'SiFigma', category: 'Design' },
    { name: 'Adobe', icon: 'SiAdobe', category: 'Design' },
    { name: 'Sketch', icon: 'SiSketch', category: 'Design' },
    { name: 'Dribbble', icon: 'SiDribbble', category: 'Design' },
    { name: 'Behance', icon: 'SiBehance', category: 'Design' },
    { name: 'Canva', icon: 'SiCanva', category: 'Design' },
    { name: 'Framer', icon: 'SiFramer', category: 'Design' },
    { name: 'InVision', icon: 'SiInvision', category: 'Design' },

    // Content & Blogging
    { name: 'Medium', icon: 'SiMedium', category: 'Content' },
    { name: 'Substack', icon: 'SiSubstack', category: 'Content' },
    { name: 'Hashnode', icon: 'SiHashnode', category: 'Content' },
    { name: 'WordPress', icon: 'SiWordpress', category: 'Content' },
    { name: 'Ghost', icon: 'SiGhost', category: 'Content' },
    { name: 'Blogger', icon: 'SiBlogger', category: 'Content' },
    { name: 'Notion', icon: 'SiNotion', category: 'Content' },

    // Music & Video
    { name: 'Spotify', icon: 'SiSpotify', category: 'Media' },
    { name: 'Apple Music', icon: 'SiApplemusic', category: 'Media' },
    { name: 'SoundCloud', icon: 'SiSoundcloud', category: 'Media' },
    { name: 'Twitch', icon: 'SiTwitch', category: 'Media' },
    { name: 'Vimeo', icon: 'SiVimeo', category: 'Media' },
    { name: 'Patreon', icon: 'SiPatreon', category: 'Media' },

    // Professional
    { name: 'Slack', icon: 'SiSlack', category: 'Professional' },
    { name: 'Microsoft Teams', icon: 'SiMicrosoftteams', category: 'Professional' },
    { name: 'Zoom', icon: 'SiZoom', category: 'Professional' },
    { name: 'Google Meet', icon: 'SiGooglemeet', category: 'Professional' },
    { name: 'Trello', icon: 'SiTrello', category: 'Professional' },
    { name: 'Asana', icon: 'SiAsana', category: 'Professional' },
    { name: 'Jira', icon: 'SiJira', category: 'Professional' },
    { name: 'Confluence', icon: 'SiConfluence', category: 'Professional' },

    // E-commerce & Payment
    { name: 'Shopify', icon: 'SiShopify', category: 'Commerce' },
    { name: 'Stripe', icon: 'SiStripe', category: 'Commerce' },
    { name: 'PayPal', icon: 'SiPaypal', category: 'Commerce' },
    { name: 'Etsy', icon: 'SiEtsy', category: 'Commerce' },
    { name: 'Amazon', icon: 'SiAmazon', category: 'Commerce' },

    // Gaming
    { name: 'Steam', icon: 'SiSteam', category: 'Gaming' },
    { name: 'PlayStation', icon: 'SiPlaystation', category: 'Gaming' },
    { name: 'Xbox', icon: 'SiXbox', category: 'Gaming' },
    { name: 'Nintendo', icon: 'SiNintendo', category: 'Gaming' },
    { name: 'Epic Games', icon: 'SiEpicgames', category: 'Gaming' },

    // Tech Companies
    { name: 'Apple', icon: 'SiApple', category: 'Tech' },
    { name: 'Google', icon: 'SiGoogle', category: 'Tech' },
    { name: 'Microsoft', icon: 'SiMicrosoft', category: 'Tech' },
    { name: 'Meta', icon: 'SiMeta', category: 'Tech' },
    { name: 'Tesla', icon: 'SiTesla', category: 'Tech' },
    { name: 'Netflix', icon: 'SiNetflix', category: 'Tech' },
    { name: 'Uber', icon: 'SiUber', category: 'Tech' },
    { name: 'Airbnb', icon: 'SiAirbnb', category: 'Tech' },

    // Additional Popular Services
    { name: 'Gmail', icon: 'SiGmail', category: 'Email' },
    { name: 'Outlook', icon: 'SiMicrosoftoutlook', category: 'Email' },
    { name: 'Protonmail', icon: 'SiProtonmail', category: 'Email' },
    { name: 'Calendly', icon: 'SiCalendly', category: 'Productivity' },
    { name: 'Dropbox', icon: 'SiDropbox', category: 'Storage' },
    { name: 'Google Drive', icon: 'SiGoogledrive', category: 'Storage' },
    { name: 'OneDrive', icon: 'SiMicrosoftonedrive', category: 'Storage' },

    // Personal Website
    { name: 'Portfolio', icon: 'FaBookmark', category: 'Personal' },
    { name: 'Website', icon: 'FaGlobe', category: 'Personal' },
    { name: 'Blog', icon: 'FaBlog', category: 'Personal' },
    { name: 'Email', icon: 'FaEnvelope', category: 'Personal' },
    { name: 'Link', icon: 'FaLink', category: 'Personal' },
];

interface IconPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
    selectedIcon?: string;
}

export function IconPicker({ isOpen, onClose, onSelect, selectedIcon }: IconPickerProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(brandIcons.map(i => i.category)))];

    const filteredIcons = brandIcons.filter(icon => {
        const matchesSearch = icon.name.toLowerCase().includes(search.toLowerCase()) ||
            icon.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || icon.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const renderIcon = (iconName: string, size = 20) => {
        const IconComponent = (SiIcons as any)[iconName] || (FaIcons as any)[iconName];
        if (IconComponent) {
            return <IconComponent size={size} />;
        }
        return <Globe size={size} />;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-violet-500/20 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-violet-500/10">
                <DialogHeader className="pb-4 border-b border-white/5">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Choose Your Icon
                    </DialogTitle>
                    <p className="text-sm text-zinc-500 mt-1">Select from {brandIcons.length}+ brand icons</p>
                </DialogHeader>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or category..."
                            className="pl-12 pr-12 h-12 bg-black/50 border-violet-500/30 focus:border-violet-500/50 text-white placeholder:text-zinc-600 rounded-xl"
                            autoFocus
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300",
                                selectedCategory === cat
                                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/50 scale-105"
                                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white border border-white/5"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Icons Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-black/30 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-3">
                        {filteredIcons.map(icon => (
                            <button
                                key={icon.icon}
                                onClick={() => {
                                    onSelect(icon.icon);
                                    onClose();
                                }}
                                className={cn(
                                    "aspect-square flex items-center justify-center p-3 rounded-xl transition-all duration-200 relative group",
                                    "hover:bg-gradient-to-br hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:scale-110 hover:shadow-lg hover:shadow-violet-500/30",
                                    selectedIcon === icon.icon
                                        ? "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border-2 border-violet-500/80 shadow-lg shadow-violet-500/40 scale-105"
                                        : "bg-zinc-800/30 border border-white/5 hover:border-violet-500/50"
                                )}
                                title={icon.name}
                            >
                                <div className={cn(
                                    "transition-all duration-200",
                                    selectedIcon === icon.icon
                                        ? "text-white scale-110"
                                        : "text-zinc-400 group-hover:text-white group-hover:scale-110"
                                )}>
                                    {renderIcon(icon.icon, 28)}
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                    <div className="bg-zinc-900 border border-violet-500/30 px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                                        <span className="text-[10px] font-medium text-violet-300">{icon.name}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredIcons.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <Search className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="text-lg font-medium">No icons found</p>
                            <p className="text-sm text-zinc-600 mt-1">Try different keywords</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-xs text-zinc-400 font-mono">{filteredIcons.length} icons</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="hover:bg-white/5 text-zinc-400 hover:text-white"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
