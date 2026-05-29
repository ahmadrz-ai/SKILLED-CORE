'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
            <DialogContent 
                className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-6 rounded-xl border font-sans shadow-xl"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E8ED', color: '#141417' }}
            >
                <DialogHeader className="pb-4 border-b" style={{ borderColor: '#F0F0F4' }}>
                    <DialogTitle className="text-lg font-bold" style={{ color: '#141417' }}>
                        Choose Your Icon
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1" style={{ color: '#6B6B78' }}>
                        Select from {brandIcons.length}+ premium brand icons
                    </DialogDescription>
                </DialogHeader>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#909099' }} />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or category..."
                        className="pl-9 pr-9 h-10 rounded-lg text-sm transition-colors w-full"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E8ED', color: '#141417' }}
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                            style={{ color: '#909099' }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 pt-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex items-center justify-center cursor-pointer shrink-0"
                            style={
                                selectedCategory === cat
                                    ? { backgroundColor: '#5B35D5', color: '#FFFFFF', borderColor: 'transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                                    : { backgroundColor: '#F8F8FA', color: '#6B6B78', borderColor: '#E8E8ED' }
                            }
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Icons Grid Container */}
                <div 
                    className="flex-1 overflow-y-auto p-4 rounded-xl border custom-scrollbar"
                    style={{ backgroundColor: '#F8F8FA', borderColor: '#E8E8ED' }}
                >
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                        {filteredIcons.map((icon, index) => (
                            <button
                                key={`${icon.icon}-${icon.category}-${index}`}
                                onClick={() => {
                                    onSelect(icon.icon);
                                    onClose();
                                }}
                                className="aspect-square w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer relative group border"
                                style={
                                    selectedIcon === icon.icon
                                        ? { backgroundColor: '#F5F3FF', borderColor: '#5B35D5', borderWidth: '2px', color: '#4A28C9', boxShadow: '0 1px 3px rgba(91,53,213,0.1)' }
                                        : { backgroundColor: '#FFFFFF', borderColor: '#E8E8ED', borderWidth: '1px', color: '#6B6B78' }
                                }
                                title={icon.name}
                            >
                                <div className="transition-transform duration-200 group-hover:scale-110 flex items-center justify-center">
                                    {renderIcon(icon.icon, 22)}
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                    <div 
                                        className="border px-2 py-0.5 rounded shadow-md whitespace-nowrap"
                                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E8ED' }}
                                    >
                                        <span className="text-[10px] font-bold" style={{ color: '#4A28C9' }}>{icon.name}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {filteredIcons.length === 0 && (
                        <div className="text-center py-16" style={{ color: '#909099' }}>
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-45" />
                            <p className="text-sm font-bold">No icons found</p>
                            <p className="text-xs">Try different keywords</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t shrink-0" style={{ borderColor: '#F0F0F4' }}>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--sc-purple-600)] animate-pulse" />
                        <span className="text-xs font-mono font-bold" style={{ color: '#6B6B78' }}>{filteredIcons.length} icons</span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="font-semibold rounded-lg text-xs px-4 py-2 shrink-0 cursor-pointer border"
                        style={{ backgroundColor: '#F8F8FA', borderColor: '#E8E8ED', color: '#6B6B78' }}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
