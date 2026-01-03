import { LegalSidebar } from "@/components/legal/LegalSidebar";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white relative selection:bg-violet-500/30">
            {/* Background Ambient */}
            {/* Background Ambient */}
            <ParticleBackground />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/10 to-transparent" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-24 lg:py-32">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    <LegalSidebar />
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
