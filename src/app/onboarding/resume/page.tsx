"use client";

import { ResumeUploader } from "@/components/onboarding/ResumeUploader";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardingResumePage() {
    return (
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <Button variant="ghost" asChild className="mb-4 text-zinc-500 hover:text-white pl-0">
                        <Link href="/register">
                            <MoveLeft className="w-4 h-4 mr-2" /> Back
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-heading font-black text-white tracking-wide">INITIALIZE PROFILE</h1>
                    <p className="text-zinc-400 mt-2">
                        Upload your resume to auto-populate your SkilledCore identity. Maximum efficiency protocol active.
                    </p>
                </div>

                <div className="bg-zinc-950/50 p-1 rounded-xl border border-white/5">
                    <ResumeUploader />
                </div>

                <div className="text-center">
                    <button className="text-sm text-zinc-500 hover:text-white underline decoration-zinc-700 underline-offset-4">
                        Skip and enter data manually
                    </button>
                </div>
            </div>
        </div>
    );
}
