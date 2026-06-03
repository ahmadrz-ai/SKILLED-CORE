'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, Layout } from 'lucide-react';
import { toast } from 'sonner';

interface DesignCritiquePanelProps {
  competencies: string[];
  tools: string[];
}

export function DesignCritiquePanel({ competencies, tools }: DesignCritiquePanelProps) {
  const [critique, setCritique] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!critique.trim() || critique.length < 50) {
      toast.error('Critique too short. Please provide a detailed response (at least 50 characters).');
      return;
    }
    setIsSubmitted(true);
    toast.success('Design critique submitted successfully!');
  };

  return (
    <div className="flex flex-col bg-[#16161F] border border-[#2A2A3A] rounded-2xl h-full p-6 text-[#E8E8F0] space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9278EA] flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5" /> Design Critique Challenge
        </span>
        <h3 className="text-base font-bold text-[#E8E8F0]">
          Audit the Sign-Up Form Layout Below
        </h3>
      </div>

      {/* Bad Design Mockup Container */}
      <div className="bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-[#2A2A3A]/50">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mockup Frame (Faulty Design)</span>
          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Eye className="w-3 h-3" /> Audit Target
          </span>
        </div>

        {/* The Bad Design Itself */}
        <div className="bg-[#1C1C26] rounded-lg p-5 border border-red-500/10 space-y-4 font-sans text-left">
          <div className="text-base font-bold text-[#D04040]">Signup to our app!!!</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400">Username</label>
              <input 
                disabled 
                placeholder="Required" 
                className="w-full bg-[#12121A] text-xs border border-zinc-700 p-2 rounded opacity-80" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-[#2A2A3A]">Password (extremely secure)</label>
              <input 
                disabled 
                placeholder="password" 
                className="w-full bg-[#12121A] text-xs border border-red-500 p-2 rounded opacity-80" 
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" disabled checked className="w-3 h-3 accent-red-500" />
              <span className="text-[9px] text-[#A0A0A0] leading-none">I agree to terms of services and privacy policy</span>
            </div>

            <button 
              disabled 
              className="w-full bg-[#3F51B5] text-zinc-300 text-xs font-bold p-3 rounded mt-2 border-none cursor-not-allowed opacity-90"
            >
              SUBMIT BUTTON
            </button>
          </div>
        </div>

        {/* Competencies & Tools tags */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2A2A3A]/50">
          {competencies.map((comp, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-sc-purple-500/10 border border-[#9278EA]/20 text-[10px] font-bold text-[#9278EA]">
              {comp}
            </span>
          ))}
          {tools.map((tool, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-400">
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 flex flex-col min-h-[200px] relative">
        {isSubmitted ? (
          <div className="flex-1 border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <h4 className="text-sm font-bold text-emerald-400">Critique Submitted</h4>
            <p className="text-xs text-[#9090A8] max-w-sm leading-relaxed">
              Your UI/UX audit report has been saved and will be analyzed by the interviewer to evaluate your design review depth.
            </p>
          </div>
        ) : (
          <>
            <textarea
              className="flex-1 w-full bg-[#12121A] border border-[#2A2A3A] rounded-xl p-4 text-xs text-[#E8E8F0] placeholder:text-[#4A4A60] focus:border-[#9278EA] focus:outline-none resize-none leading-relaxed transition-all"
              placeholder="Identify the UI bugs, alignment shifts, contrast violations, and accessibility issues. Propose detailed UX interventions..."
              value={critique}
              onChange={(e) => setCritique(e.target.value)}
            />
            {/* Character count & Submit button container */}
            <div className="flex items-center justify-between mt-3 shrink-0">
              <span className="text-[10px] text-[#4A4A60]">
                {critique.length} characters
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!critique.trim() || critique.length < 50}
                className="bg-[#5B35D5] hover:bg-[#4A28C9] text-white px-5 py-2 h-9 text-xs font-bold rounded-lg border-none shadow-md shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Critique
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
