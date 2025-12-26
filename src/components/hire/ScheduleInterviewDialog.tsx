'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { sendMessage, startConversation } from '@/app/(app)/messages/actions';

interface ScheduleInterviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidateName: string;
    candidateId: string;
}

export function ScheduleInterviewDialog({ open, onOpenChange, candidateName, candidateId }: ScheduleInterviewDialogProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [questions, setQuestions] = useState<string[]>(['Are you Available?']);
    const [isSending, setIsSending] = useState(false);
    const [isManualSet, setIsManualSet] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize/Sync with Live Clock
    useEffect(() => {
        if (!open) {
            setIsManualSet(false); // Reset when closed
            return;
        }

        const updateTime = () => {
            if (isManualSet) return;
            const now = new Date();
            // Format Date: YYYY-MM-DD
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);

            // Format Time: HH:mm:ss
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setTime(`${hh}:${min}:${ss}`);
        };

        updateTime(); // Initial update
        intervalRef.current = setInterval(updateTime, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [open, isManualSet]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsManualSet(true);
        setDate(e.target.value);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsManualSet(true);
        setTime(e.target.value);
    };

    const addQuestion = () => {
        setQuestions([...questions, '']);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index] = value;
        setQuestions(newQuestions);
    };

    const handleSend = async () => {
        if (!date || !time) {
            toast.error("Please select a date and time");
            return;
        }

        setIsSending(true);

        try {
            // 1. Ensure conversation exists
            const convRes = await startConversation(candidateId);
            if (!convRes.success || !convRes.conversationId) {
                toast.error("Failed to start conversation");
                setIsSending(false);
                return;
            }

            // 2. Construct Invitation Data
            const invitationData = {
                candidateName,
                interviewDate: date,
                interviewTime: time,
                companyName: "Skilled Core", // Or fetch from somewhere if dynamic
            };

            // 3. Send Message with Special Attachment Type
            // We use 'attachmentUrl' to store the stringified JSON data for this custom type
            const res = await sendMessage(
                candidateId,
                "Interview Invitation Sent",
                JSON.stringify(invitationData),
                "INTERVIEW_INVITE"
            );

            if (res.success) {
                toast.success("Interview schedule sent!");
                onOpenChange(false);
            } else {
                toast.error("Failed to send schedule");
            }
        } catch (error) {
            console.error("Schedule Error:", error);
            toast.error("An error occurred");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-cinzel">Schedule Interview with {candidateName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date and Time Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="date"
                                    className="pl-9 bg-zinc-900/50 border-white/10 text-white"
                                    value={date}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <Input
                                    type="time"
                                    step="1" // Enable Seconds
                                    className="pl-9 bg-zinc-900/50 border-white/10 text-white"
                                    value={time}
                                    onChange={handleTimeChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-zinc-400">Screening Questions</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                onClick={addQuestion}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Question
                            </Button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {questions.map((q, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        placeholder={`Question ${idx + 1}`}
                                        className="bg-zinc-900/50 border-white/10 text-white text-sm"
                                        value={q}
                                        onChange={(e) => updateQuestion(idx, e.target.value)}
                                    />
                                    {questions.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={() => removeQuestion(idx)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold"
                    >
                        {isSending ? "Sending..." : (
                            <>
                                <Send className="w-4 h-4 mr-2" /> Send Schedule
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
