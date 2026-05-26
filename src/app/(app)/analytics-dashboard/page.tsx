"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus, MousePointerClick, Eye, Briefcase, Sparkles, Download, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnalytics, AnalyticsData } from "@/app/actions/analytics";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// --- Components ---

const StatCard = ({ label, value, trend, trendDir }: { label: string, value: string | number, trend: string, trendDir: string }) => (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-500 font-mono text-xs uppercase tracking-widest">{label}</h3>
            {trendDir === "up" && <ArrowUpRight className="w-4 h-4 text-green-400" />}
            {trendDir === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
            {trendDir === "flat" && <Minus className="w-4 h-4 text-zinc-600" />}
        </div>
        <div className="flex items-end gap-3">
            <span className="text-3xl font-bold font-heading text-white">{value}</span>
            <span className={cn(
                "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                trendDir === "up" ? "bg-green-500/10 text-green-400" :
                    trendDir === "down" ? "bg-red-950/30 text-red-400" :
                        "bg-zinc-800 text-zinc-500"
            )}>
                {trend}
            </span>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-950 border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-zinc-400 font-mono text-xs mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-white font-bold">{entry.value}</span>
                        <span className="text-zinc-500 text-xs uppercase">{entry.name}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const COLORS = ["#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899"];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30d");

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getAnalytics();
                if (result) {
                    setData(result);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
                toast.error("Failed to load telemetry.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <p className="text-zinc-500 font-mono text-sm animate-pulse">ESTABLISHING UPLINK...</p>
                </div>
            </div>
        );
    }

    if (!data) return <div className="min-h-screen pt-32 px-10 text-zinc-500 font-mono">No telemetry signal detected.</div>;

    const { stats, trendData, demographics, recentActivity } = data;

    return (
        <div className="min-h-screen p-6 lg:p-10 pt-24 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-white mb-2 tracking-tight">
                        COMMAND <span className="text-violet-500">METRICS</span>
                    </h1>
                    <p className="text-zinc-400 font-mono text-sm max-w-lg">
                        Real-time telemetry of your network impact and profile resonance.
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-400 border-l-2 border-l-violet-500 flex items-center gap-2 uppercase">
                        <User className="w-3 h-3" />
                        {data.role}
                    </div>

                    <div className="bg-zinc-900 border border-white/10 rounded-lg p-1 flex items-center">
                        {['7d', '30d', 'ALL'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all",
                                    timeRange === range ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Impressions"
                    value={stats.impressions}
                    trend={stats.trend}
                    trendDir="flat"
                />
                <StatCard
                    label="High Intent Clicks"
                    value={stats.clicks}
                    trend={stats.clickTrend}
                    trendDir="up"
                />
                <StatCard
                    label="Conversion Rate"
                    value={stats.conversion + "%"}
                    trend="Stable"
                    trendDir="flat"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">

                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-heading font-bold text-white flex items-center gap-2">
                            <Eye className="w-5 h-5 text-violet-500" />
                            Engagement Pulse (Last 30 Days)
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <ChartTooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Demographics & Insights */}
                <div className="space-y-6 flex flex-col h-full">

                    {/* Donut Chart */}
                    <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 flex-1 flex flex-col min-h-[300px]">
                        <h3 className="font-heading font-bold text-white flex items-center gap-2 mb-4">
                            <Briefcase className="w-5 h-5 text-teal-400" />
                            Viewer Demographics
                        </h3>
                        {demographics.length > 0 ? (
                            <div className="flex-1 min-h-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={demographics}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {demographics.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        <ChartTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                    <span className="text-2xl font-bold font-heading text-white">
                                        {demographics.reduce((a, b) => a + b.value, 0)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm italic">
                                No demographic data yet
                            </div>
                        )}
                    </div>

                    {/* AI Insight Panel */}
                    <div className="bg-teal-500/5 border-l-4 border-teal-500 rounded-r-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <Sparkles className="w-12 h-12 text-teal-500/20" />
                        </div>
                        <h4 className="flex items-center gap-2 text-teal-400 font-bold font-mono text-sm mb-2">
                            <Sparkles className="w-4 h-4" />
                            CORTEX OPTIMIZATION
                        </h4>
                        <p className="text-zinc-300 text-sm leading-relaxed relative z-10">
                            {stats.impressions === 0
                                ? "Your telemetry is silent. Initialize first contact by posting content or updating your profile."
                                : "Engagement is detected. Maintain momentum by responding to high-intent signals immediately."}
                        </p>
                    </div>

                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
                <h3 className="font-heading font-bold text-white mb-6">LIVE SIGNAL FEED</h3>
                <div className="space-y-4">
                    {recentActivity.length > 0 ? recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <MousePointerClick className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-300 font-medium">
                                        {activity.viewerName} ({activity.viewerRole}) viewed you
                                    </p>
                                    <p className="text-xs text-zinc-600 font-mono">
                                        {activity.time} • {activity.location}
                                    </p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-xs font-mono px-2 py-1 rounded",
                                activity.type === "CONNECT_REQUEST" ? "text-violet-500 bg-violet-500/10" : "text-zinc-500 bg-zinc-800"
                            )}>
                                {activity.type === "CONNECT_REQUEST" ? "HIGH INTENT" : "IMPRESSION"}
                            </span>
                        </div>
                    )) : (
                        <div className="text-zinc-500 italic text-sm py-4">No recent signals detected.</div>
                    )}
                </div>
            </div>

        </div>
    );
}
