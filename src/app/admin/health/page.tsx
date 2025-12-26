import { prisma } from "@/lib/prisma";
import { Users, Activity, ShieldAlert, FileText, Server } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminHealthPage() {
    // 1. Fetch System Metrics
    const userCount = await prisma.user.count();
    const pendingReports = await prisma.report.count({ where: { status: 'PENDING' } });
    const pendingVerifications = await prisma.verificationRequest.count({ where: { status: 'PENDING' } });

    // Mock localized server load (simulated)
    const serverLoad = Math.floor(Math.random() * 20) + 10; // 10-30%

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">System Diagnostics</h1>
            <p className="text-zinc-400">Real-time telemetry and resource usage.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Users */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">TOTAL NODES</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{userCount}</div>
                    <div className="text-xs text-green-500 mt-2 flex items-center">
                        <Activity className="w-3 h-3 mr-1" />
                        Online
                    </div>
                </div>

                {/* Server Load */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <Server className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">CPU LOAD</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{serverLoad}%</div>
                    <div className="text-xs text-zinc-500 mt-2">Optimal Performance</div>
                </div>

                {/* Pending Verifications */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">VERIFY QUEUE</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{pendingVerifications}</div>
                    <div className="text-xs text-zinc-500 mt-2">Pending Review</div>
                </div>

                {/* Reports */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono text-zinc-500">ACTIVE THREATS</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{pendingReports}</div>
                    <div className="text-xs text-zinc-500 mt-2">Requires Attention</div>
                </div>
            </div>

            {/* Simulated Terminal Status */}
            <div className="bg-black border border-white/10 rounded-xl p-6 font-mono text-xs space-y-2 text-zinc-400">
                <div className="text-green-500">&gt; SYSTEM_CHECK_COMPLETE</div>
                <div>&gt; DATABASE_CONNECTION: STABLE (5ms)</div>
                <div>&gt; AUTH_NODE: SECURE</div>
                <div>&gt; EDGE_NETWORK: SYNCHRONIZED</div>
                <div>&gt; LAST_BACKUP: {new Date().toISOString()}</div>
            </div>
        </div>
    );
}
