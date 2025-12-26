
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Bookmark, SquareActivity } from "lucide-react";
import Link from "next/link";

interface ProfileSideWidgetProps {
    user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
        headline: string | null;
        bannerUrl?: string | null;
    };
    stats: {
        profileViews: number;
        impressions: number;
    };
}

export function ProfileSideWidget({ user, stats }: ProfileSideWidgetProps) {
    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden shadow-sm">
            {/* Cover Image */}
            <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600 relative bg-cover bg-center" style={{ backgroundImage: user.bannerUrl ? `url(${user.bannerUrl})` : undefined }}>
                {/* Fallback overlay if banner exists to ensure text contrast if we had text, but here mostly for style */}
                {user.bannerUrl && <div className="absolute inset-0 bg-black/20" />}

                {/* Avatar */}
                <div className="absolute -bottom-8 left-4">
                    <Avatar className="w-16 h-16 border-2 border-zinc-950 cursor-pointer">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Identity */}
            <div className="pt-10 px-4 pb-4">
                <Link href={`/profile/${user.username || 'me'}`} className="block">
                    <h3 className="font-bold text-white hover:underline cursor-pointer text-lg leading-tight">
                        {user.name}
                    </h3>
                </Link>
                {user.username && (
                    <p className="text-zinc-500 text-xs mt-0.5">@{user.username}</p>
                )}
                <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                    {user.headline || "Digital Operative at SkilledCore"}
                </p>
            </div>

            <Separator className="bg-white/10" />

            {/* Stats */}
            <div className="py-2">
                <div className="px-4 py-1 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Profile viewers</span>
                    <span className="text-violet-400 font-bold">{stats.profileViews}</span>
                </div>
                <div className="px-4 py-1 hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Post impressions</span>
                    <span className="text-violet-400 font-bold">{stats.impressions}</span>
                </div>
            </div>

            <Separator className="bg-white/10" />

            {/* My Items */}
            <div className="p-2">
                <button className="w-full flex items-center gap-3 px-2 py-2 text-xs text-zinc-300 hover:bg-white/5 rounded-lg transition-colors text-left font-medium group">
                    <Bookmark className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>Saved Items</span>
                </button>
                <button className="w-full flex items-center gap-3 px-2 py-2 text-xs text-zinc-300 hover:bg-white/5 rounded-lg transition-colors text-left font-medium group">
                    <SquareActivity className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>My Activity</span>
                </button>
            </div>
        </div>
    );
}
