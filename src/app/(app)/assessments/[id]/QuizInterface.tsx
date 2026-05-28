"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, ChevronRight, Check } from "lucide-react";
import { submitAssessment } from "@/app/actions/assessments";
import { toast } from "sonner";
import Link from "next/link";
import Confetti from "react-confetti"; // Simple animation fallback if needed
import { cn } from "@/lib/utils";

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
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-sans">
                {result.passed && typeof window !== "undefined" && (
                    <Confetti numberOfPieces={200} recycle={false} width={window.innerWidth} height={window.innerHeight} />
                )}

                <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-10 shadow-[var(--shadow-modal)] relative overflow-hidden text-[var(--text-body)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--sc-purple-50)]/30 to-transparent pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-3 rounded-full bg-[var(--bg-secondary-panel)] border border-[var(--border-default)] mb-6 shadow-inner"
                    >
                        {result.passed ? (
                            <CheckCircle className="w-14 h-14 text-[var(--sc-green-600)]" />
                        ) : (
                            <XCircle className="w-14 h-14 text-[var(--sc-red-650)]" />
                        )}
                    </motion.div>

                    <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-2 font-heading">
                        {result.passed ? "Assessment Passed!" : "Assessment Failed"}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-sm mx-auto leading-relaxed font-medium">
                        {result.passed
                            ? "You have successfully verified this skill. A badge has been added to your profile."
                            : "You didn't meet the passing criteria this time. Brush up on your skills and try again."}
                    </p>

                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-heading)] to-[var(--text-secondary)] mb-8 font-mono">
                        {result.score}%
                    </div>

                    <div className="flex justify-center gap-3">
                        <Link href="/assessments">
                            <Button variant="outline" className="border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--btn-secondary-bg-hover)] font-bold text-xs py-2 px-5 rounded-lg select-none">
                                Back to Assessments
                            </Button>
                        </Link>
                        {!result.passed && (
                            <Button onClick={() => window.location.reload()} className="bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold text-xs py-2 px-5 rounded-lg border-none shadow-sm cursor-pointer select-none">
                                Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 font-sans text-[var(--text-body)]">
            {/* Header / Progress */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] font-mono">
                    <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-[var(--sc-gray-150)] rounded-full" indicatorClassName="bg-[var(--sc-purple-600)]" />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 sm:p-8 min-h-[360px] flex flex-col justify-between shadow-sm relative"
                >
                    <h2 className="text-lg font-bold text-[var(--text-heading)] font-heading leading-relaxed mb-6">
                        {currentQuestion.text}
                    </h2>

                    <div className="space-y-2.5 flex-1">
                        {currentQuestion.options.map((option: string, idx: number) => {
                            const isSelected = answers[currentQuestion.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    className={cn(
                                        "w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group cursor-pointer border-solid",
                                        isSelected
                                            ? "bg-[var(--sc-purple-50)] border-[var(--sc-purple-600)] text-[var(--sc-purple-700)] font-semibold"
                                            : "bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-sidebar-hover)] hover:border-[var(--border-input-hover)] hover:text-[var(--text-heading)]"
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                                            isSelected 
                                                ? "bg-[var(--sc-purple-600)] border-[var(--sc-purple-600)] text-white" 
                                                : "border-[var(--border-input)] text-[var(--text-secondary)] group-hover:border-[var(--border-input-hover)]"
                                        )}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-sm">{option}</span>
                                    </span>
                                    {isSelected && <Check className="w-4 h-4 text-[var(--sc-purple-600)] shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-5 mt-6 border-t border-[var(--border-subtle)]">
                        <Button
                            onClick={handleNext}
                            disabled={answers[currentQuestion.id] === undefined || isSubmitting}
                            className="bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-bg-hover)] text-[var(--btn-primary-text)] font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-lg border-none shadow-sm cursor-pointer disabled:opacity-50 select-none"
                        >
                            {isSubmitting ? "Submitting..." : isLastQuestion ? "Submit Assessment" : "Next Question"}
                            {!isSubmitting && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
