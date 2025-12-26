"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, ChevronRight, Check } from "lucide-react";
import { submitAssessment } from "@/app/actions/assessments";
import { toast } from "sonner";
import Link from "next/link";
import Confetti from "react-confetti"; // Might need to install this or just use simple animation

export default function QuizInterface({ assessment }: { assessment: any }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const questions = assessment.questions;
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleSelectOption = (optionIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionIndex
        }));
    };

    const handleNext = () => {
        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await submitAssessment(assessment.id, answers);
            setResult(res);
            if (res.passed) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to submit assessment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (result) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {result.passed && <Confetti numberOfPieces={200} recycle={false} />}

                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent" />

                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 rounded-full bg-black/40 border border-white/10 mb-6"
                    >
                        {result.passed ? (
                            <CheckCircle className="w-16 h-16 text-emerald-500" />
                        ) : (
                            <XCircle className="w-16 h-16 text-red-500" />
                        )}
                    </motion.div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {result.passed ? "Assessment Passed!" : "Assessment Failed"}
                    </h2>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                        {result.passed
                            ? "You have successfully verified this skill. A badge has been added to your profile."
                            : "You didn't meet the passing criteria this time. Brush up on your skills and try again."}
                    </p>

                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 mb-8 font-mono">
                        {result.score}%
                    </div>

                    <div className="flex justify-center gap-4">
                        <Link href="/assessments">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                                Back to Assessments
                            </Button>
                        </Link>
                        {!result.passed && (
                            <Button onClick={() => window.location.reload()} className="bg-white text-black hover:bg-zinc-200">
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header / Progress */}
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-center text-sm text-zinc-500">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-zinc-800" indicatorClassName="bg-violet-500" />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-zinc-900 border border-white/10 rounded-2xl p-8 min-h-[400px] flex flex-col"
                >
                    <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                        {currentQuestion.text}
                    </h2>

                    <div className="space-y-3 flex-1">
                        {currentQuestion.options.map((option: string, idx: number) => {
                            const isSelected = answers[currentQuestion.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                                        isSelected
                                            ? "bg-violet-500/20 border-violet-500 text-white"
                                            : "bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:text-white"
                                    )}
                                >
                                    <span className="flex items-center gap-4">
                                        <span className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors",
                                            isSelected ? "bg-violet-500 border-violet-500 text-white" : "border-white/10 text-zinc-500 group-hover:border-zinc-500"
                                        )}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-lg">{option}</span>
                                    </span>
                                    {isSelected && <Check className="w-5 h-5 text-violet-400" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-8 mt-8 border-t border-white/5">
                        <Button
                            onClick={handleNext}
                            disabled={answers[currentQuestion.id] === undefined || isSubmitting}
                            className="bg-white text-black hover:bg-zinc-200 px-8 font-bold"
                        >
                            {isSubmitting ? "Submitting..." : isLastQuestion ? "Submit Assessment" : "Next Question"}
                            {!isSubmitting && <ChevronRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Helper utility for classnames
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
