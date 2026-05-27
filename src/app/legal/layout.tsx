import { LegalSidebar } from "@/components/legal/LegalSidebar";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 relative selection:bg-indigo-500/30">
            <div className="relative z-10 container mx-auto px-4 py-24 lg:py-32">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    <LegalSidebar />
                    <main className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
