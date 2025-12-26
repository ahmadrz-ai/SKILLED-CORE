"use client";

import { useState } from 'react';
import { toast } from 'sonner';

interface ResumeData {
    headline: string;
    summary: string;
    skills: string[];
    experience: any[];
    education: any[];
}

export function useResumeParser() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState("");
    const [parsedData, setParsedData] = useState<ResumeData | null>(null);

    const extractTextFromPDF = async (file: File): Promise<string> => {
        // In a real app, we would use pdf.js here.
        // For this demo, we mock the extraction.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("Mock extracted text from PDF...");
            }, 1000);
        });
    };

    const parseWithAI = async (file: File) => {
        try {
            setIsAnalyzing(true);
            setProgress("Extracting text layers...");

            const formData = new FormData();
            formData.append('file', file);

            setProgress("Neural analysis in progress...");

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();

            setProgress("Calibration complete.");
            setParsedData(data);
            toast.success("Resume Intelligence Extracted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to parse resume");
        } finally {
            setIsAnalyzing(false);
            setProgress("");
        }
    };

    return {
        isAnalyzing,
        progress,
        parsedData,
        parseWithAI,
        setParsedData
    };
}
