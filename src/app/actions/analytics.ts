"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export interface AnalyticsData {
    stats: {
        impressions: number;
        clicks: number;
        conversion: string;
        trend: string;
        clickTrend: string;
    };
    trendData: { date: string; views: number; clicks: number }[];
    demographics: { name: string; value: number }[];
    recentActivity: {
        id: string;
        viewerName: string;
        viewerRole: string;
        time: string;
        location: string;
        type: string;
    }[];
    role: string;
    plan: string;
    profileStrength: number;
    profileCompleteness: { name: string; completed: boolean }[];
    popularPosts: {
        id: string;
        content: string;
        type: string;
        date: string;
        likes: number;
        comments: number;
        impressions: number;
        engagement: string;
    }[];
    activeTickets: {
        id: string;
        subject: string;
        status: string;
        severity: string;
        createdAt: string;
    }[];
}

export async function getAnalytics(): Promise<AnalyticsData | null> {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const userId = session.user.id;

        // ---------------------------------------------------------
        // 1. STATS: Total Impressions & Clicks (All Time vs Last 30d)
        // ---------------------------------------------------------

        // Impressions = Profile Views
        const totalImpressions = await prisma.profileView.count({
            where: { profileId: userId }
        });

        // Clicks = Received Connection Requests (High Intent)
        const totalClicks = await prisma.connection.count({
            where: { addresseeId: userId }
        });

        const conversionRate = totalImpressions > 0
            ? ((totalClicks / totalImpressions) * 100).toFixed(1)
            : "0.0";

        // ---------------------------------------------------------
        // 2. TREND DATA (Last 30 Days)
        // ---------------------------------------------------------
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 29); // Include today

        // Fetch views in range
        const recentViews = await prisma.profileView.findMany({
            where: {
                profileId: userId,
                viewedAt: { gte: thirtyDaysAgo }
            },
            orderBy: { viewedAt: 'asc' }
        });

        // Group by Date "MMM d"
        const viewsMap = new Map<string, number>();
        recentViews.forEach(v => {
            const day = format(v.viewedAt, "MMM d");
            viewsMap.set(day, (viewsMap.get(day) || 0) + 1);
        });

        // Fetch clicks in range
        const recentConnectionsRange = await prisma.connection.findMany({
            where: {
                addresseeId: userId,
                createdAt: { gte: thirtyDaysAgo }
            },
            orderBy: { createdAt: 'asc' }
        });

        const connectionsMap = new Map<string, number>();
        recentConnectionsRange.forEach(c => {
            const day = format(c.createdAt, "MMM d");
            connectionsMap.set(day, (connectionsMap.get(day) || 0) + 1);
        });

        const trendData = [];
        for (let i = 29; i >= 0; i -= 5) {
            const d = subDays(today, i);
            const label = format(d, "MMM d");

            trendData.push({
                date: label,
                views: viewsMap.get(label) || 0,
                clicks: connectionsMap.get(label) || 0
            });
        }

        // ---------------------------------------------------------
        // 3. DEMOGRAPHICS & PROFILE COMPLETENESS
        // ---------------------------------------------------------
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                plan: true,
                name: true,
                username: true,
                image: true,
                headline: true,
                bio: true,
                location: true,
                skills: true,
                github: true,
                linkedin: true,
                portfolio: true
            }
        });
        const currentPlan = user?.plan || "BASIC";

        // Completeness Checklist
        const completenessItems = [
            { name: "Name & Username", completed: !!(user?.name && user?.username) },
            { name: "Avatar Profile Image", completed: !!user?.image },
            { name: "Headline Designation", completed: !!user?.headline },
            { name: "Detailed Summary Bio", completed: !!user?.bio },
            { name: "Location Details", completed: !!user?.location },
            { name: "Core Skills List", completed: !!user?.skills },
            { name: "Portfolio & Social links", completed: !!(user?.github || user?.linkedin || user?.portfolio) }
        ];

        const strengthScores = [10, 15, 20, 20, 15, 10, 10];
        let profileStrength = 0;
        completenessItems.forEach((item, index) => {
            if (item.completed) {
                profileStrength += strengthScores[index];
            }
        });

        // Demographics
        const lastViewers = await prisma.profileView.findMany({
            where: { profileId: userId },
            take: 50,
            include: { viewer: true }
        });

        const roleCounts: Record<string, number> = {};
        lastViewers.forEach(v => {
            const r = v.viewer.role || "Unknown";
            roleCounts[r] = (roleCounts[r] || 0) + 1;
        });

        let demographics = Object.entries(roleCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        if (demographics.length === 0) {
            demographics = [
                { name: "Recruiters", value: 0 },
                { name: "Engineers", value: 0 }
            ];
        }

        if (currentPlan === "BASIC") {
            demographics = demographics.map(d => ({ name: "Hidden (Upgrade to Pro)", value: d.value }));
        }

        // ---------------------------------------------------------
        // 4. RECENT ACTIVITY
        // ---------------------------------------------------------
        const activityViews = lastViewers.slice(0, 3).map(v => ({
            id: v.id,
            viewerName: currentPlan === "BASIC" ? "Anonymous User" : (v.viewer.name || "Anonymous"),
            viewerRole: v.viewer.role || "Unknown",
            time: format(v.viewedAt, "MMM d, h:mm a"),
            location: v.viewer.location || "Earth",
            type: "VIEW"
        }));

        const recentConnections = await prisma.connection.findMany({
            where: { addresseeId: userId },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { requester: true }
        });

        const activityConnections = recentConnections.map(c => ({
            id: c.id,
            viewerName: currentPlan === "BASIC" ? "Anonymous User" : (c.requester.name || "Anonymous"),
            viewerRole: c.requester.role || "Unknown",
            time: format(c.createdAt, "MMM d, h:mm a"),
            location: c.requester.location || "Earth",
            type: "CONNECT_REQUEST"
        }));

        const recentActivity = [...activityViews, ...activityConnections]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5);

        // ---------------------------------------------------------
        // 5. POPULAR POSTS
        // ---------------------------------------------------------
        const userPosts = await prisma.post.findMany({
            where: { userId },
            include: {
                likes: true,
                comments: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const popularPosts = userPosts.map(post => {
            const likes = post.likes.length;
            const comments = post.comments.length;
            const impressions = (likes + comments) * 12 + 5;
            const engagement = impressions > 0
                ? (((likes + comments) / impressions) * 100).toFixed(1)
                : "0.0";
            
            return {
                id: post.id,
                content: post.content.length > 60 ? post.content.substring(0, 60) + "..." : post.content,
                type: post.type,
                date: format(post.createdAt, "MMM d, yyyy"),
                likes,
                comments,
                impressions,
                engagement
            };
        }).sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 5);

        // ---------------------------------------------------------
        // 6. ACTIVE SUPPORT TICKETS
        // ---------------------------------------------------------
        const activeTicketsRaw = await prisma.report.findMany({
            where: {
                reporterId: userId,
                targetType: 'SUPPORT_TICKET',
                status: { in: ['PENDING', 'UNDER_REVIEW'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        const activeTickets = activeTicketsRaw.map(t => ({
            id: t.id,
            subject: t.reason,
            status: t.status,
            severity: t.severity,
            createdAt: format(t.createdAt, "MMM d, yyyy")
        }));

        return {
            stats: {
                impressions: totalImpressions,
                clicks: totalClicks,
                conversion: conversionRate,
                trend: totalImpressions > 0 ? "+12%" : "+0%",
                clickTrend: totalClicks > 0 ? "+8%" : "+0%"
            },
            trendData,
            demographics,
            recentActivity,
            role: session.user?.role || "CANDIDATE",
            plan: currentPlan,
            profileStrength,
            profileCompleteness: completenessItems,
            popularPosts,
            activeTickets
        };
    } catch (error) {
        console.error("Error in getAnalytics server action:", error);
        return null;
    }
}
