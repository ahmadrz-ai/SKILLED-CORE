'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, CheckCircle2, AlertTriangle, Bug, LifeBuoy, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeReport, updateReportStatus } from '@/app/actions/adminReports';
import { cn } from '@/lib/utils';

interface AdminReportModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedReport: any) => void;
}

export function AdminReportModal({ report, isOpen, onClose, onStatusUpdated }: AdminReportModalProps) {
  const [currentReport, setCurrentReport] = useState(report);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  // Rule 7: Auto-analyze on mount if summary is null
  useEffect(() => {
    if (isOpen && currentReport && !currentReport.aiSummary && !isAnalyzing) {
      handleAnalyze();
    }
  }, [isOpen, currentReport]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeReport(currentReport.id);
      if (res.success && res.report) {
        setCurrentReport(res.report);
        onStatusUpdated(res.report);
        toast.success('AI Diagnostics generated successfully.');
      } else {
        toast.error(res.error || 'Failed to analyze report.');
      }
    } catch (err: any) {
      toast.error('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!currentReport?.fixPrompt) return;
    navigator.clipboard.writeText(currentReport.fixPrompt);
    setIsCopied(true);
    // Rule 9: Copy Prompt button shows "Copied!" for 2s
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    toast.success('Antigravity fix prompt copied to clipboard.');
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateReportStatus(currentReport.id, newStatus);
      if (res.success && res.report) {
        setCurrentReport(res.report);
        onStatusUpdated(res.report);
        toast.success(`Status updated to ${newStatus}`);
      } else {
        toast.error(res.error || 'Failed to update status.');
      }
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!currentReport) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-bg-modal text-text-body border-border-modal sm:max-w-2xl overflow-hidden p-0 rounded-2xl shadow-sc-modal backdrop-blur-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle bg-gradient-to-r from-sc-purple-50/40 via-white to-sc-blue-50/40 flex items-start justify-between">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              {currentReport.category === 'bug' ? (
                <Bug className="w-4 h-4 text-[#D04040]" />
              ) : (
                <LifeBuoy className="w-4 h-4 text-sc-purple-650" />
              )}
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                Ticket Diagnostics
              </span>
            </div>
            <DialogTitle className="text-lg font-black tracking-tight text-text-heading">
              Support Report #{currentReport.id.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Reported by {currentReport.user?.name || 'Anonymous User'} • {new Date(currentReport.createdAt).toLocaleString()}
            </DialogDescription>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] text-left">
          
          {/* Section 1: User's Original Words */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary">
              1. User Description
            </h4>
            <div className="p-4 rounded-xl bg-sc-gray-50 border border-sc-gray-150 text-sm leading-relaxed text-text-body font-medium whitespace-pre-wrap select-text">
              "{currentReport.userWords}"
            </div>
          </div>

          {/* Section 2: AI Technical Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              2. Technical Diagnostics Summary
            </h4>
            {isAnalyzing ? (
              <div className="p-8 rounded-xl border border-dashed border-sc-purple-200 bg-sc-purple-50/10 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-sc-purple-650 animate-spin" />
                <p className="text-xs text-sc-purple-750 font-bold uppercase tracking-wider animate-pulse">
                  Analyzing via DeepSeek R1...
                </p>
              </div>
            ) : currentReport.aiSummary ? (
              <div className="p-4 rounded-xl bg-sc-purple-50/20 border border-sc-purple-100/50 text-sm leading-relaxed text-text-body select-text">
                {currentReport.aiSummary}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 text-center text-xs text-text-secondary">
                No diagnostics summary generated. Click "Re-Analyze" below to trigger.
              </div>
            )}
          </div>

          {/* Section 3: Click-to-copy Antigravity Fix Prompt */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
              <span>3. Antigravity AI Fix Prompt</span>
              {currentReport.fixPrompt && (
                <button
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 rounded bg-[#E8E8F0] hover:bg-[#D8D8E0] text-zinc-800 border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold transition-all shrink-0"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Prompt
                    </>
                  )}
                </button>
              )}
            </h4>
            {isAnalyzing ? (
              <div className="h-[120px] rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
            ) : currentReport.fixPrompt ? (
              <div className="relative group">
                <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto select-text border border-zinc-900 max-h-[200px]">
                  {currentReport.fixPrompt}
                </pre>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 text-center text-xs text-text-secondary">
                No fix prompt generated.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-border-subtle bg-bg-modal flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary font-medium">Status:</span>
            <select
              value={currentReport.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-bg-card border border-border-default text-text-body text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sc-purple-500 font-bold cursor-pointer"
            >
              <option value="OPEN">Open</option>
              <option value="ANALYZED">Analyzed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              className="flex-1 sm:flex-initial h-10 text-xs font-bold border border-zinc-300 hover:bg-zinc-50 rounded-xl"
            >
              <Wrench className="w-3.5 h-3.5 mr-1" /> Re-Analyze
            </Button>

            {currentReport.status !== 'RESOLVED' && (
              <Button
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={isUpdatingStatus}
                className="flex-1 sm:flex-initial h-10 text-xs font-bold bg-[#5B35D5] hover:bg-[#4A28C9] text-white rounded-xl"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Resolved
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
