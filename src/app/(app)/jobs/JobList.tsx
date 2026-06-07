"use client";

import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Briefcase, Bookmark, ChevronRight, Globe, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleSaveJob } from "@/app/actions/jobs";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

interface Job {
    id: string;
    title: string;
    company: { name: string; logo?: string | null };
    location: string;
    type: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string | null;
    payPeriod?: string | null;
    createdAt: Date;
    description: string;
    workplaceType: string;
    _count?: { applications: number };
}

const CURRENCIES = [
    { code: 'USD', symbol: '$' },
    { code: 'PKR', symbol: '₨' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'AED', symbol: 'د.إ' },
    { code: 'SAR', symbol: 'ر.س' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CNY', symbol: '¥' },
    { code: 'NZD', symbol: 'NZ$' },
    { code: 'CHF', symbol: 'CHF' },
    { code: 'HKD', symbol: 'HK$' },
    { code: 'SEK', symbol: 'kr' },
    { code: 'NOK', symbol: 'kr' },
    { code: 'DKK', symbol: 'kr' },
    { code: 'TRY', symbol: '₺' },
    { code: 'BRL', symbol: 'R$' },
    { code: 'ZAR', symbol: 'R' },
    { code: 'MXN', symbol: '$' },
    { code: 'RUB', symbol: '₽' },
    { code: 'KRW', symbol: '₩' },
    { code: 'IDR', symbol: 'Rp' },
    { code: 'MYR', symbol: 'RM' },
    { code: 'PHP', symbol: '₱' },
    { code: 'THB', symbol: '฿' },
    { code: 'VND', symbol: '₫' },
    { code: 'EGP', symbol: 'E£' },
    { code: 'NGN', symbol: '₦' },
    { code: 'QAR', symbol: 'ر.ق' },
    { code: 'KWD', symbol: 'د.ك' },
    { code: 'OMR', symbol: 'ر.ع.' },
    { code: 'BHD', symbol: '.د.ب' },
    { code: 'PLN', symbol: 'zł' },
    { code: 'CZK', symbol: 'Kč' },
    { code: 'HUF', symbol: 'Ft' },
    { code: 'ILS', symbol: '₪' },
    { code: 'CLP', symbol: '$' },
    { code: 'COP', symbol: '$' },
    { code: 'PEN', symbol: 'S/.' },
    { code: 'ARS', symbol: '$' }
];

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

const getCurrencySymbol = (code: string) => {
    const found = CURRENCIES.find(c => c.code === code.toUpperCase());
    return found ? found.symbol : '$';
};

const convertSalary = (amount: number, fromCurrency: string, toCurrency: string): number => {
    const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
    const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1.0;
    const inUSD = amount / fromRate;
    return Math.round(inUSD * toRate);
};

export default function JobList({ initialJobs, savedJobIds, userId }: { initialJobs: Job[], savedJobIds: string[], userId?: string }) {
    const [saved, setSaved] = useState<Set<string>>(new Set(savedJobIds));
    const [detectedCountry, setDetectedCountry] = useState<string>("Pakistan");
    const [detectedCurrency, setDetectedCurrency] = useState<string>("PKR");
    const [convertedJobs, setConvertedJobs] = useState<Set<string>>(new Set());

    useEffect(() => {
        const detectGeo = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                if (res.ok) {
                    const data = await res.json();
                    if (data.country_name) {
                        setDetectedCountry(data.country_name);
                    }
                    if (data.currency) {
                        setDetectedCurrency(data.currency);
                    }
                }
            } catch (err) {
                console.error("Failed to detect country/currency from IP:", err);
            }
        };
        detectGeo();
    }, []);

    const toggleConvert = (jobId: string) => {
        const next = new Set(convertedJobs);
        if (next.has(jobId)) {
            next.delete(jobId);
        } else {
            next.add(jobId);
        }
        setConvertedJobs(next);
    };

    const handleSave = async (id: string) => {
        // Optimistic update
        const newSaved = new Set(saved);
        if (newSaved.has(id)) newSaved.delete(id);
        else newSaved.add(id);
        setSaved(newSaved);

        await toggleSaveJob(id);
    };

    if (initialJobs.length === 0) {
        return (
            <EmptyState
                icon={Briefcase}
                title="No jobs match your filters"
                description="Try broadening your search query or removing selected filters to locate new active postings."
                ctaText="Clear Filters"
                ctaHref="/jobs"
            />
        );
    }

    return (
        <div className="space-y-4">
            {initialJobs.map((job) => {
                const isConverted = convertedJobs.has(job.id);
                const displayCurrency = isConverted ? detectedCurrency : (job.currency || 'USD');
                
                let displayMin = job.salaryMin;
                let displayMax = job.salaryMax;
                
                if (isConverted && job.salaryMin) {
                    displayMin = convertSalary(job.salaryMin, job.currency || 'USD', detectedCurrency);
                    if (job.salaryMax) {
                        displayMax = convertSalary(job.salaryMax, job.currency || 'USD', detectedCurrency);
                    }
                }

                // Strip raw HTML tags cleanly, then strip Markdown characters as well
                const cleanedDescription = job.description
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/(\*\*|__|^#+\s|`)/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                return (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white border border-[#E5E7EB] hover:border-[#5B35D5]/40 rounded-2xl p-6 transition-all hover:bg-slate-50/50 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#EAE6FD] flex items-center justify-center text-lg font-bold text-[#5B35D5] border border-[#EAE6FD] overflow-hidden flex-shrink-0">
                                    {job.company.logo ? (
                                        <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{job.company.name[0]}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[#111827] group-hover:text-[#4A28C9] transition-colors flex flex-wrap items-center gap-2">
                                        {job.title}
                                        <span className="text-xs font-medium text-[#4A28C9] border border-[#EAE6FD] px-2.5 py-0.5 rounded-full bg-[#EAE6FD]">
                                            {job.workplaceType}
                                        </span>
                                    </h3>
                                    <div className="flex items-center gap-2 text-[#6B7280] text-sm mt-1">
                                        <Briefcase className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                        <span className="font-medium text-[#374151]">{job.company.name}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSave(job.id)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors border border-transparent flex-shrink-0",
                                    saved.has(job.id) ? "text-[#F59E0B] bg-[#FEF3C7] border-[#FDE68A]" : "text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]"
                                )}
                            >
                                <Bookmark className={cn("w-4 h-4", saved.has(job.id) && "fill-current")} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4 items-center">
                            <Badge variant="secondary" className="bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                                <MapPin className="w-3 h-3 text-[#9CA3AF]" /> {job.location}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                                <Briefcase className="w-3 h-3 text-[#9CA3AF]" /> {job.type}
                            </Badge>
                            {job.salaryMin && (
                                <Badge variant="secondary" className="bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] hover:bg-[#ECFDF5] gap-1.5 font-normal py-1">
                                    <span className="text-xs font-semibold text-[#059669] mr-0.5">
                                        {getCurrencySymbol(displayCurrency)}
                                    </span>
                                    {displayCurrency} {displayMin?.toLocaleString()} - {displayMax ? displayMax.toLocaleString() : '+'} / {(job.payPeriod || 'Yearly').toLowerCase()}
                                </Badge>
                            )}
                            {job.salaryMin && (
                                <button
                                    onClick={() => toggleConvert(job.id)}
                                    title={`convert currency '${detectedCountry}'`}
                                    className={cn(
                                        "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm",
                                        convertedJobs.has(job.id)
                                            ? "bg-[#EAE6FD] text-[#4A28C9] border-[#5B35D5]"
                                            : "bg-[#F5F3FF] hover:bg-[#EAE6FD] text-[#5B35D5] border-[#B4A3F3]/40"
                                    )}
                                >
                                    <RefreshCw className={cn("w-3 h-3 transition-transform duration-500", convertedJobs.has(job.id) && "rotate-180")} />
                                </button>
                            )}
                            <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F3F4F6] gap-1.5 font-normal py-1">
                                <Clock className="w-3 h-3 text-[#9CA3AF]" /> {formatDistanceToNow(new Date(job.createdAt))} ago
                            </Badge>
                        </div>

                        <p className="text-[#4B5563] text-sm mb-5 leading-relaxed line-clamp-2">
                            {cleanedDescription}
                        </p>

                        <div className="flex gap-3">
                            <Link href={`/jobs/${job.id}`} className="flex-1">
                            <Button className="w-full bg-[#4A28C9] hover:bg-[#4338CA] text-white font-semibold h-10 shadow-sm group/btn transition-colors">
                                View Intelligence
                                <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                );
            })}
        </div>
    );
}
