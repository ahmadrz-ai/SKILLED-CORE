'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, Building2, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag as SharedTag } from '@/components/ui/tag';
import { useState, useEffect } from 'react';

export interface JobProps {
    id: string;
    title: string;
    company: string;
    type: 'Remote' | 'Hybrid' | 'On-Site';
    postedTime: string;
    salary: string;
    experience: 'Junior' | 'Mid' | 'Mid-Senior' | 'Senior' | 'Lead';
    tags: string[];
    logo?: string;
    contract?: 'Full-Time' | 'Contract' | 'Freelance';
    isApplied?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    payPeriod?: string;
}

const EXCHANGE_RATES: { [key: string]: number } = {
    USD: 1.0,
    PKR: 278.0,
    EUR: 0.92,
    GBP: 0.78,
    INR: 83.3,
    AED: 3.67,
    SAR: 3.75,
    CAD: 1.36,
    AUD: 1.50,
    SGD: 1.35,
    JPY: 156.0,
    CNY: 7.24,
    NZD: 1.63,
    CHF: 0.91,
    HKD: 7.80,
    SEK: 10.60,
    NOK: 10.50,
    DKK: 6.87,
    TRY: 32.20,
    BRL: 5.15,
    ZAR: 18.40,
    MXN: 16.70,
    RUB: 90.0,
    KRW: 1360.0,
    IDR: 16000.0,
    MYR: 4.70,
    PHP: 58.0,
    THB: 36.5,
    VND: 25400.0,
    EGP: 47.0,
    NGN: 1450.0,
    QAR: 3.64,
    KWD: 0.31,
    OMR: 0.38,
    BHD: 0.38,
    PLN: 3.95,
    CZK: 22.8,
    HUF: 358.0,
    ILS: 3.68,
    CLP: 915.0,
    COP: 3860.0,
    PEN: 3.73,
    ARS: 890.0
};

const convertSalary = (amount: number, fromCurrency: string, toCurrency: string): number => {
    const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
    const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1.0;
    const inUSD = amount / fromRate;
    return Math.round(inUSD * toRate);
};

interface JobCardProps {
    job: JobProps;
    index: number;
    onApply?: (id: string) => void;
}

export default function JobCard({ job, index, onApply }: JobCardProps) {
    const [detectedCountry, setDetectedCountry] = useState<string>("Pakistan");
    const [detectedCurrency, setDetectedCurrency] = useState<string>("PKR");
    const [isConverted, setIsConverted] = useState(false);

    useEffect(() => {
        const detectGeo = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                if (res.ok) {
                    const data = await res.json();
                    if (data.country_name) setDetectedCountry(data.country_name);
                    if (data.currency) setDetectedCurrency(data.currency);
                }
            } catch (err) {
                console.error("Failed to detect country/currency from IP in JobCard:", err);
            }
        };
        detectGeo();
    }, []);

    const displayMin = isConverted && job.salaryMin ? convertSalary(job.salaryMin, job.currency || 'USD', detectedCurrency) : job.salaryMin;
    const displayMax = isConverted && job.salaryMax ? convertSalary(job.salaryMax, job.currency || 'USD', detectedCurrency) : job.salaryMax;
    const displayCurrency = isConverted ? detectedCurrency : (job.currency || 'USD');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <div className="group relative h-full bg-zinc-900 border border-white/5 hover:border-violet-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.15)] flex flex-col">

                {/* Header */}
                <div className="p-5 flex justify-between items-start border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10 group-hover:border-violet-500/30 transition-colors relative overflow-hidden">
                            {job.logo ? (
                                <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-6 h-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white leading-tight group-hover:text-violet-300 transition-colors">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-zinc-400 font-medium">
                                    {job.company}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5 uppercase tracking-wider">
                                    {job.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500 font-mono">
                        <Clock className="w-3 h-3 mr-1" />
                        {job.postedTime}
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {job.tags.map((tag, i) => (
                            <SharedTag key={i} className="hover:bg-sc-purple-100 transition-colors cursor-pointer">
                                {tag}
                            </SharedTag>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 uppercase tracking-wider">Salary Badge</span>
                            <span className="text-teal-400 font-bold font-mono text-sm">
                                {job.salaryMin !== undefined && job.salaryMin !== null
                                    ? `${displayCurrency} ${displayMin?.toLocaleString()} - ${displayMax ? displayMax.toLocaleString() : '+'} / ${(job.payPeriod || 'Yearly').toLowerCase()}`
                                    : job.salary}
                            </span>
                        </div>
                        
                        {/* Interactive Currency Converter Tab */}
                        {(job.salaryMin !== undefined && job.salaryMin !== null) && (
                            <button
                                onClick={() => setIsConverted(!isConverted)}
                                title={`convert currency '${detectedCountry}'`}
                                className={cn(
                                    "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm",
                                    isConverted
                                        ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                                        : "bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10"
                                )}
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5 transition-transform duration-500", isConverted && "rotate-180")} />
                            </button>
                        )}
                    </div>

                    <Button
                        onClick={() => onApply && !job.isApplied ? onApply(job.id) : undefined}
                        disabled={job.isApplied}
                        className={cn(
                            "w-full transition-all duration-300 font-bold tracking-wide",
                            job.isApplied
                                ? "bg-green-600/20 text-green-400 border border-green-500/50 cursor-default hover:bg-green-600/20"
                                : "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)]"
                        )}
                    >
                        {job.isApplied ? (
                            <>
                                APPLICATION SENT
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2 fill-current" />
                                EASY APPLY
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </motion.div>
    );
}
