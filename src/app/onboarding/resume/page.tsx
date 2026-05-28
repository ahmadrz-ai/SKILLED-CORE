"use client";

import { ResumeUploader } from "@/components/onboarding/ResumeUploader";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardingResumePage() {
    return (
        <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <Button variant="ghost" asChild className="mb-4 text-[var(--text-secondary)] hover:text-[var(--text-sidebar-hover)] hover:bg-[var(--bg-sidebar-hover)] pl-0 rounded-lg">
                    <Link href="/register">
                        <MoveLeft className="w-4 h-4 mr-2" /> Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)] font-heading uppercase">INITIALIZE PROFILE</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1.5 leading-relaxed">
                    Upload your resume to auto-populate your SkilledCore identity. Maximum efficiency protocol active.
                </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-1 shadow-[var(--shadow-card)]">
                <ResumeUploader />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
                Don't have your resume? Skip and build your profile manually.
            </p>

            <div className="text-center pt-2">
                <Link 
                    href="/profile/me"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-brand)] hover:underline cursor-pointer font-medium"
                >
                    Skip for now
                </Link>
            </div>
        </div>
    );
}
