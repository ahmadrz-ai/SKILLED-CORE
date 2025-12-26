"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, ChevronRight, Lock, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Assessment = {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string | null;
    _count: { questions: number };
};

export default function AssessmentList({ assessments }: { assessments: Assessment[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, i) => (
                <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative bg-zinc-900 border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-violet-500/20 group-hover:scale-105 transition-all duration-300">
                                <Brain className="w-6 h-6 text-zinc-400 group-hover:text-violet-400" />
                            </div>
                            <Badge variant="outline" className="border-white/10 bg-black/20 text-zinc-400 text-xs">
                                {assessment.category}
                            </Badge>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                            {assessment.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-6 flex-1 line-clamp-3">
                            {assessment.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                <span>{assessment._count.questions} QUESTIONS</span>
                                <span>•</span>
                                <span>15 MIN</span>
                            </div>

                            <Link href={`/assessments/${assessment.id}`}>
                                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold group-hover:translate-x-1 transition-transform">
                                    Start <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Coming Soon Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: assessments.length * 0.1 }}
                className="bg-black/40 border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity"
            >
                <div className="p-4 bg-zinc-900 rounded-full mb-4">
                    <Lock className="w-6 h-6 text-zinc-600" />
                </div>
                <h3 className="text-lg font-bold text-zinc-500 mb-2">More Coming Soon</h3>
                <p className="text-xs text-zinc-600 max-w-[200px]">
                    New skill assessments are under development by the neural network.
                </p>
            </motion.div>
        </div>
    );
}
