
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
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
            {/* Cover Banner */}
            <div
                className="h-24 bg-gradient-to-br from-[#6366F1] via-[#5F3CF8] to-[#4F46E5] relative bg-cover bg-center"
                style={{ backgroundImage: user.bannerUrl ? `url(${user.bannerUrl})` : undefined }}
            >
                {user.bannerUrl && <div className="absolute inset-0 bg-[#000000]/25" />}
                {/* Avatar */}
                <div className="absolute -bottom-10 left-5">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg cursor-pointer transition-transform hover:scale-105 duration-200">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-bold text-2xl">
                            {user.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Identity */}
            <div className="pt-12 px-5 pb-5">
                <Link href={`/profile/${user.username || 'me'}`} className="block group">
                    <h3 className="font-bold text-[#111827] group-hover:text-[#6366F1] group-hover:underline transition-all cursor-pointer text-lg leading-tight tracking-tight">
                        {user.name}
                    </h3>
                </Link>
                {user.username && (
                    <p className="text-[#9CA3AF] text-xs font-mono mt-0.5">@{user.username}</p>
                )}
                <p className="text-[#4B5563] text-sm mt-2 font-medium leading-normal line-clamp-2">
                    {user.headline || "Member at SkilledCore"}
                </p>
            </div>

            <Separator className="bg-[#E5E7EB]" />

            {/* Stats */}
            <div className="py-2.5">
                <div className="px-5 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors flex justify-between items-center group">
                    <span className="text-[#6B7280] text-xs font-semibold group-hover:text-[#4F46E5] transition-colors">Profile viewers</span>
                    <span className="text-[#6366F1] text-xs font-extrabold bg-[#EEF2FF] px-2 py-0.5 rounded-full">{stats.profileViews}</span>
                </div>
                <div className="px-5 py-2 hover:bg-[#F9FAFB] cursor-pointer transition-colors flex justify-between items-center group">
                    <span className="text-[#6B7280] text-xs font-semibold group-hover:text-[#4F46E5] transition-colors">Post impressions</span>
                    <span className="text-[#6366F1] text-xs font-extrabold bg-[#EEF2FF] px-2 py-0.5 rounded-full">{stats.impressions}</span>
                </div>
            </div>

            <Separator className="bg-[#E5E7EB]" />

            {/* Quick Links */}
            <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left font-semibold group">
                    <Bookmark className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#6366F1] group-hover:scale-110 transition-all duration-200" />
                    <span>Saved Items</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-xs text-[#374151] hover:bg-[#F3F4F6] rounded-lg transition-colors text-left font-semibold group">
                    <SquareActivity className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#6366F1] group-hover:scale-110 transition-all duration-200" />
                    <span>My Activity</span>
                </button>
            </div>
        </div>
    );
}
