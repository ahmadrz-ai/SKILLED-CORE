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

// Brand icons collection (700+ icons)
const brandIcons = [
    // Freelance & Gig Economy (New)
    { name: 'Upwork', icon: 'SiUpwork', category: 'Freelance' },
    { name: 'Fiverr', icon: 'SiFiverr', category: 'Freelance' },
    { name: 'Freelancer', icon: 'SiFreelancer', category: 'Freelance' },

    { name: 'Malt', icon: 'SiMalt', category: 'Freelance' },
    { name: 'Dribbble', icon: 'SiDribbble', category: 'Freelance' },
    { name: 'Behance', icon: 'SiBehance', category: 'Freelance' },
    { name: 'ArtStation', icon: 'SiArtstation', category: 'Freelance' },
    { name: 'Polywork', icon: 'SiPolywork', category: 'Freelance' },

    { name: 'Patreon', icon: 'SiPatreon', category: 'Freelance' },
    { name: 'Buy Me A Coffee', icon: 'SiBuymeacoffee', category: 'Freelance' },
    { name: 'OnlyFans', icon: 'SiOnlyfans', category: 'Freelance' },

    // Social Media
    { name: 'LinkedIn', icon: 'SiLinkedin', category: 'Social' },
    { name: 'Twitter/X', icon: 'SiX', category: 'Social' },
    { name: 'Facebook', icon: 'SiFacebook', category: 'Social' },
    { name: 'Instagram', icon: 'SiInstagram', category: 'Social' },
    { name: 'YouTube', icon: 'SiYoutube', category: 'Social' },
    { name: 'TikTok', icon: 'SiTiktok', category: 'Social' },
    { name: 'Discord', icon: 'SiDiscord', category: 'Social' },
    { name: 'Twitch', icon: 'SiTwitch', category: 'Social' },
    { name: 'Telegram', icon: 'SiTelegram', category: 'Social' },
    { name: 'WhatsApp', icon: 'SiWhatsapp', category: 'Social' },
    { name: 'Signal', icon: 'SiSignal', category: 'Social' },
    { name: 'Snapchat', icon: 'SiSnapchat', category: 'Social' },
    { name: 'Reddit', icon: 'SiReddit', category: 'Social' },
    { name: 'Pinterest', icon: 'SiPinterest', category: 'Social' },
    { name: 'Threads', icon: 'SiThreads', category: 'Social' },
    { name: 'Mastodon', icon: 'SiMastodon', category: 'Social' },
    { name: 'Bluesky', icon: 'SiBluesky', category: 'Social' },
    { name: 'Tumblr', icon: 'SiTumblr', category: 'Social' },
    { name: 'Vimeo', icon: 'SiVimeo', category: 'Social' },
    { name: 'Clubhouse', icon: 'SiClubhouse', category: 'Social' },
    { name: 'Line', icon: 'SiLine', category: 'Social' },
    { name: 'WeChat', icon: 'SiWechat', category: 'Social' },
    { name: 'KakaoTalk', icon: 'SiKakaotalk', category: 'Social' },

    // Development & Code
    { name: 'GitHub', icon: 'SiGithub', category: 'Development' },
    { name: 'GitLab', icon: 'SiGitlab', category: 'Development' },
    { name: 'Bitbucket', icon: 'SiBitbucket', category: 'Development' },
    { name: 'Stack Overflow', icon: 'SiStackoverflow', category: 'Development' },
    { name: 'CodePen', icon: 'SiCodepen', category: 'Development' },
    { name: 'Dev.to', icon: 'SiDevdotto', category: 'Development' },
    { name: 'Product Hunt', icon: 'SiProducthunt', category: 'Development' },
    { name: 'npm', icon: 'SiNpm', category: 'Development' },
    { name: 'Docker', icon: 'SiDocker', category: 'Development' },
    { name: 'Kubernetes', icon: 'SiKubernetes', category: 'Development' },
    { name: 'Vercel', icon: 'SiVercel', category: 'Development' },
    { name: 'Netlify', icon: 'SiNetlify', category: 'Development' },
    { name: 'Heroku', icon: 'SiHeroku', category: 'Development' },

    { name: 'Google Cloud', icon: 'SiGooglecloud', category: 'Development' },

    { name: 'DigitalOcean', icon: 'SiDigitalocean', category: 'Development' },
    { name: 'Firebase', icon: 'SiFirebase', category: 'Development' },
    { name: 'Supabase', icon: 'SiSupabase', category: 'Development' },
    { name: 'Cloudflare', icon: 'SiCloudflare', category: 'Development' },
    { name: 'Postman', icon: 'SiPostman', category: 'Development' },
    { name: 'Jira', icon: 'SiJira', category: 'Development' },
    { name: 'Trello', icon: 'SiTrello', category: 'Development' },
    { name: 'Notion', icon: 'SiNotion', category: 'Development' },
    { name: 'Linear', icon: 'SiLinear', category: 'Development' },
    { name: 'Hashnode', icon: 'SiHashnode', category: 'Development' },
    { name: 'Medium', icon: 'SiMedium', category: 'Development' },
    { name: 'Substack', icon: 'SiSubstack', category: 'Development' },

    // Design & Creative
    { name: 'Figma', icon: 'SiFigma', category: 'Design' },
    { name: 'Adobe', icon: 'SiAdobe', category: 'Design' },
    { name: 'Adobe XD', icon: 'SiAdobexd', category: 'Design' },
    { name: 'Adobe Photoshop', icon: 'SiAdobephotoshop', category: 'Design' },
    { name: 'Adobe Illustrator', icon: 'SiAdobeillustrator', category: 'Design' },
    { name: 'Sketch', icon: 'SiSketch', category: 'Design' },
    { name: 'InVision', icon: 'SiInvision', category: 'Design' },
    { name: 'Framer', icon: 'SiFramer', category: 'Design' },
    { name: 'Canva', icon: 'SiCanva', category: 'Design' },
    { name: 'Blender', icon: 'SiBlender', category: 'Design' },
    { name: 'Cinema 4D', icon: 'SiCinema4D', category: 'Design' },
    { name: 'Unsplash', icon: 'SiUnsplash', category: 'Design' },
    { name: 'Pinterest', icon: 'SiPinterest', category: 'Design' },

    // Languages & Frameworks
    { name: 'React', icon: 'SiReact', category: 'Tech' },
    { name: 'Vue.js', icon: 'SiVuedotjs', category: 'Tech' },
    { name: 'Angular', icon: 'SiAngular', category: 'Tech' },
    { name: 'Svelte', icon: 'SiSvelte', category: 'Tech' },
    { name: 'Next.js', icon: 'SiNextdotjs', category: 'Tech' },
    { name: 'Nuxt', icon: 'SiNuxtdotjs', category: 'Tech' },
    { name: 'Node.js', icon: 'SiNodedotjs', category: 'Tech' },
    { name: 'Python', icon: 'SiPython', category: 'Tech' },
    { name: 'TypeScript', icon: 'SiTypescript', category: 'Tech' },
    { name: 'JavaScript', icon: 'SiJavascript', category: 'Tech' },
    { name: 'Rust', icon: 'SiRust', category: 'Tech' },
    { name: 'Go', icon: 'SiGo', category: 'Tech' },
    { name: 'Swift', icon: 'SiSwift', category: 'Tech' },
    { name: 'Kotlin', icon: 'SiKotlin', category: 'Tech' },
    { name: 'Flutter', icon: 'SiFlutter', category: 'Tech' },
    { name: 'Tailwind CSS', icon: 'SiTailwindcss', category: 'Tech' },

    // Communication & Productivity
    { name: 'Slack', icon: 'SiSlack', category: 'Communication' },

    { name: 'Zoom', icon: 'SiZoom', category: 'Communication' },
    { name: 'Google Meet', icon: 'SiGoogle', category: 'Communication' },

    { name: 'Asana', icon: 'SiAsana', category: 'Productivity' },
    { name: 'Monday.com', icon: 'FaCalendarCheck', category: 'Productivity' },
    { name: 'ClickUp', icon: 'SiClickup', category: 'Productivity' },
    { name: 'Evernote', icon: 'SiEvernote', category: 'Productivity' },
    { name: 'Obsidian', icon: 'SiObsidian', category: 'Productivity' },
    { name: 'Miro', icon: 'SiMiro', category: 'Productivity' },
    { name: 'Loom', icon: 'SiLoom', category: 'Productivity' },

    // Business & Payment
    { name: 'Stripe', icon: 'SiStripe', category: 'Business' },
    { name: 'PayPal', icon: 'SiPaypal', category: 'Business' },
    { name: 'Square', icon: 'SiSquare', category: 'Business' },
    { name: 'Wise', icon: 'SiWise', category: 'Business' },
    { name: 'Revolut', icon: 'SiRevolut', category: 'Business' },
    { name: 'Payoneer', icon: 'SiPayoneer', category: 'Business' },
    { name: 'Cash App', icon: 'SiCashapp', category: 'Business' },
    { name: 'Venmo', icon: 'SiVenmo', category: 'Business' },
    { name: 'Shopify', icon: 'SiShopify', category: 'Business' },
    { name: 'WooCommerce', icon: 'SiWoocommerce', category: 'Business' },
    { name: 'Salesforce', icon: 'SiSalesforce', category: 'Business' },
    { name: 'HubSpot', icon: 'SiHubspot', category: 'Business' },
    { name: 'Mailchimp', icon: 'SiMailchimp', category: 'Business' },

    // Crypto & Web3
    { name: 'Bitcoin', icon: 'SiBitcoin', category: 'Crypto' },
    { name: 'Ethereum', icon: 'SiEthereum', category: 'Crypto' },
    { name: 'Solana', icon: 'SiSolana', category: 'Crypto' },
    { name: 'Binance', icon: 'SiBinance', category: 'Crypto' },
    { name: 'Coinbase', icon: 'SiCoinbase', category: 'Crypto' },

    { name: 'OpenSea', icon: 'SiOpensea', category: 'Crypto' },
    { name: 'Polygon', icon: 'SiPolygon', category: 'Crypto' },
    { name: 'Tether', icon: 'SiTether', category: 'Crypto' },
    { name: 'Dogecoin', icon: 'SiDogecoin', category: 'Crypto' },

    // Music & Media
    { name: 'Spotify', icon: 'SiSpotify', category: 'Media' },
    { name: 'Apple Music', icon: 'SiApplemusic', category: 'Media' },
    { name: 'SoundCloud', icon: 'SiSoundcloud', category: 'Media' },
    { name: 'Bandcamp', icon: 'SiBandcamp', category: 'Media' },
    { name: 'Tidal', icon: 'SiTidal', category: 'Media' },
    { name: 'Audible', icon: 'SiAudible', category: 'Media' },
    { name: 'Netflix', icon: 'SiNetflix', category: 'Media' },


    { name: 'Prime Video', icon: 'SiPrimevideo', category: 'Media' },

    // Gaming
    { name: 'Steam', icon: 'SiSteam', category: 'Gaming' },
    { name: 'Epic Games', icon: 'SiEpicgames', category: 'Gaming' },
    { name: 'PlayStation', icon: 'SiPlaystation', category: 'Gaming' },

    { name: 'Nintendo', icon: 'SiNintendo', category: 'Gaming' },
    { name: 'Ubisoft', icon: 'SiUbisoft', category: 'Gaming' },
    { name: 'Unity', icon: 'SiUnity', category: 'Gaming' },
    { name: 'Unreal Engine', icon: 'SiUnrealengine', category: 'Gaming' },
    { name: 'Roblox', icon: 'SiRoblox', category: 'Gaming' },
    { name: 'Itch.io', icon: 'SiItchdotio', category: 'Gaming' },

    // AI & Future Tech
    { name: 'OpenAI', icon: 'SiOpenai', category: 'AI' },
    { name: 'Hugging Face', icon: 'SiHuggingface', category: 'AI' },


    // Contact & Personal
    { name: 'Email', icon: 'FaEnvelope', category: 'Contact' },
    { name: 'Website', icon: 'FaGlobe', category: 'Contact' },
    { name: 'Phone', icon: 'FaPhone', category: 'Contact' },
    { name: 'Address', icon: 'FaMapMarkerAlt', category: 'Contact' },
    { name: 'Link', icon: 'FaLink', category: 'Contact' },
    { name: 'Resume', icon: 'FaFileAlt', category: 'Contact' },
    { name: 'Blog', icon: 'FaBlog', category: 'Contact' },
    { name: 'Portfolio', icon: 'FaUser', category: 'Contact' },
    { name: 'Calendar', icon: 'FaCalendar', category: 'Contact' },
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
                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none mask-linear-fade">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-300 flex-shrink-0 border flex items-center justify-center min-w-[80px]",
                                selectedCategory === cat
                                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/40 scale-100 border-transparent transform cursor-default"
                                    : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 hover:text-white border-white/5 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/10 active:scale-95"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Icons Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-black/30 rounded-xl border border-white/5 backdrop-blur-sm custom-scrollbar">
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-14 gap-3">
                        {filteredIcons.map((icon, index) => (
                            <button
                                key={`${icon.icon}-${icon.category}-${index}`}
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
