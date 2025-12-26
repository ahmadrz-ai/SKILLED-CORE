"use client";

import { Button } from "@/components/ui/button";
import { Mail, FolderPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionBarProps {
    selectedCount: number;
    onClear: () => void;
}

export function BulkActionBar({ selectedCount, onClear }: BulkActionBarProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className="bg-zinc-900 border border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)] rounded-full px-6 py-3 flex items-center gap-6 backdrop-blur-xl">

                        <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                            <div className="bg-violet-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                {selectedCount}
                            </div>
                            <span className="text-sm font-medium text-white">Candidates Selected</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold">
                                <Mail className="w-4 h-4 mr-2" /> Message All
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                                <FolderPlus className="w-4 h-4 mr-2" /> Add to Project
                            </Button>
                        </div>

                        <button onClick={onClear} className="ml-2 text-zinc-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
