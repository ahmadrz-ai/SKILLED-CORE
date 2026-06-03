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
    <div className="flex flex-col bg-bg-card border border-border-default rounded-2xl h-full p-6 text-text-body space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-brand flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5" /> Design Critique Challenge
        </span>
        <h3 className="text-base font-bold text-text-heading">
          Audit the Sign-Up Form Layout Below
        </h3>
      </div>

      {/* Bad Design Mockup Container */}
      <div className="bg-bg-secondary-panel border border-border-default rounded-xl p-4 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50">
          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">Mockup Frame (Faulty Design)</span>
          <span className="text-[10px] bg-bg-error border border-border-error/20 text-text-error font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Eye className="w-3 h-3" /> Audit Target
          </span>
        </div>

        {/* The Bad Design Itself */}
        <div className="bg-bg-card rounded-lg p-5 border border-border-default space-y-4 font-sans text-left shadow-sc-xs">
          <div className="text-base font-bold text-red-655">Signup to our app!!!</div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-text-secondary">Username</label>
              <input 
                disabled 
                placeholder="Required" 
                className="w-full bg-bg-secondary-panel text-xs border border-border-input p-2 rounded opacity-80 text-text-body" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-text-error">Password (extremely secure)</label>
              <input 
                disabled 
                placeholder="password" 
                className="w-full bg-bg-secondary-panel text-xs border border-border-error p-2 rounded opacity-80 text-text-body" 
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" disabled checked className="w-3 h-3 accent-red-500" />
              <span className="text-[9px] text-text-secondary leading-none">I agree to terms of services and privacy policy</span>
            </div>

            <button 
              disabled 
              className="w-full bg-indigo-650 text-white text-xs font-bold p-3 rounded mt-2 border-none cursor-not-allowed opacity-90"
            >
              SUBMIT BUTTON
            </button>
          </div>
        </div>

        {/* Competencies & Tools tags */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle/50">
          {competencies.map((comp, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-sc-purple-50 border border-sc-purple-200 text-[10px] font-bold text-sc-purple-700">
              {comp}
            </span>
          ))}
          {tools.map((tool, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-sc-gray-100 border border-border-default text-[10px] font-bold text-text-body">
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 flex flex-col min-h-[200px] relative">
        {isSubmitted ? (
          <div className="flex-1 border border-border-success/30 bg-bg-success rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-text-success" />
            <h4 className="text-sm font-bold text-text-success">Critique Submitted</h4>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
              Your UI/UX audit report has been saved and will be analyzed by the interviewer to evaluate your design review depth.
            </p>
          </div>
        ) : (
          <>
            <textarea
              className="flex-1 w-full bg-bg-input border border-border-input rounded-xl p-4 text-xs text-text-body placeholder:text-text-placeholder focus:border-border-focus focus:outline-none resize-none leading-relaxed transition-all"
              placeholder="Identify the UI bugs, alignment shifts, contrast violations, and accessibility issues. Propose detailed UX interventions..."
              value={critique}
              onChange={(e) => setCritique(e.target.value)}
            />
            {/* Character count & Submit button container */}
            <div className="flex items-center justify-between mt-3 shrink-0">
              <span className="text-[10px] text-text-secondary">
                {critique.length} characters
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!critique.trim() || critique.length < 50}
                className="bg-btn-primary-bg hover:bg-btn-primary-bg-hover text-white px-5 py-2 h-9 text-xs font-bold rounded-lg border-none shadow-md shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
