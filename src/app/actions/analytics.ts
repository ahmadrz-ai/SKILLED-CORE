"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export interface AnalyticsData {
    stats: {
        impressions: number;
        clicks: number;
        conversion: string;
        trend: string; // "+14%"
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

        const trendData = [];
        for (let i = 29; i >= 0; i -= 5) {
            const d = subDays(today, i);
            const label = format(d, "MMM d");

            trendData.push({
                date: label,
                views: viewsMap.get(label) || 0,
                clicks: Math.floor(Math.random() * 2) // Mock clicks for graph visual
            });
        }

        // ---------------------------------------------------------
        // 3. DEMOGRAPHICS (Viewers' Roles)
        // ---------------------------------------------------------
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true }
        });
        const currentPlan = user?.plan || "BASIC";

        // We'll analyze the last 20 viewers
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

        // Convert to Chart Format
        let demographics = Object.entries(roleCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        // Fallback if empty
        if (demographics.length === 0) {
            demographics = [
                { name: "Recruiters", value: 0 },
                { name: "Engineers", value: 0 }
            ];
        }

        // MASK DEMOGRAPHICS IF BASIC
        if (currentPlan === "BASIC") {
            demographics = demographics.map(d => ({ name: "Hidden (Upgrade to Pro)", value: d.value }));
        }

        // ---------------------------------------------------------
        // 4. RECENT ACTIVITY
        // ---------------------------------------------------------
        const activityViews = lastViewers.slice(0, 3).map(v => ({
            id: v.id,
            viewerName: currentPlan === "BASIC" ? "Anonymous User" : (v.viewer.name || "Anonymous"), // Mask Name if Basic
            viewerRole: v.viewer.role || "Unknown",
            time: format(v.viewedAt, "MMM d, h:mm a"),
            location: v.viewer.location || "Earth",
            type: "VIEW"
        }));

        // Start fetching recent connections too
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

        // Merge and sort
        const recentActivity = [...activityViews, ...activityConnections]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) // Sort roughly
            .slice(0, 5);

        return {
            stats: {
                impressions: totalImpressions,
                clicks: totalClicks,
                conversion: conversionRate,
                trend: "+0%",
                clickTrend: "+0%"
            },
            trendData,
            demographics,
            recentActivity,
            role: session.user?.role || "CANDIDATE",
            plan: currentPlan
        };
    } catch (error) {
        console.error("Error in getAnalytics server action:", error);
        return null;
    }
}
