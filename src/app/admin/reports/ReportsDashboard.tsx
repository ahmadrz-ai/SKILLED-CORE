'use client';

import { useState } from 'react';
import ReportsTable from './ReportsTable';
import { AdminReportModal } from '@/components/admin/AdminReportModal';
import { AlertTriangle, Bug, LifeBuoy, FileText, Calendar, User, ChevronRight, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsDashboardProps {
  incidentReports: any[];
  systemReports: any[];
}

export default function ReportsDashboard({ incidentReports, systemReports }: ReportsDashboardProps) {
  const [activeMainTab, setActiveMainTab] = useState<'incidents' | 'support'>('incidents');
  const [supportFilter, setSupportFilter] = useState<'ALL' | 'OPEN' | 'ANALYZED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportsList, setReportsList] = useState<any[]>(systemReports);

  // Sync report update from modal
  const handleReportUpdated = (updatedReport: any) => {
    setReportsList(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    if (selectedReport && selectedReport.id === updatedReport.id) {
      setSelectedReport(updatedReport);
    }
  };

  // Filter system reports
  const filteredSupportReports = reportsList.filter(r => {
    if (supportFilter === 'ALL') return true;
    return r.status === supportFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ANALYZED':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'IN_PROGRESS':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'RESOLVED':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5 text-left">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Admin Inquiry Console
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Manage incident violations and user support diagnostics tickets.
          </p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 self-start">
          <button
            onClick={() => setActiveMainTab('incidents')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5",
              activeMainTab === 'incidents'
                ? "bg-white text-zinc-950 shadow-xs"
                : "bg-transparent text-zinc-400 hover:text-white"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Incident Violations ({incidentReports.length})
          </button>
          <button
            onClick={() => setActiveMainTab('support')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5",
              activeMainTab === 'support'
                ? "bg-white text-zinc-950 shadow-xs"
                : "bg-transparent text-zinc-400 hover:text-white"
            )}
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Support Reports ({reportsList.length})
          </button>
        </div>
      </div>

      {/* Incidents View */}
      {activeMainTab === 'incidents' && (
        <ReportsTable reports={incidentReports} />
      )}

      {/* Support Reports View */}
      {activeMainTab === 'support' && (
        <div className="space-y-6 text-left">
          
          {/* Sub filter tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/30 p-4 rounded-xl border border-white/5">
            <div className="flex bg-zinc-900/60 p-1 rounded-lg border border-white/5 overflow-x-auto max-w-full">
              {(['ALL', 'OPEN', 'ANALYZED', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSupportFilter(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all border-none cursor-pointer whitespace-nowrap",
                    supportFilter === tab
                      ? "bg-sc-purple-650 text-white shadow-xs"
                      : "bg-transparent text-zinc-500 hover:text-zinc-350"
                  )}
                >
                  {tab === 'ALL' ? 'All Tickets' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span>FILTERED MATCHES: {filteredSupportReports.length}</span>
            </div>
          </div>

          {/* Ticket list rendering */}
          {filteredSupportReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSupportReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-zinc-900/20 border border-white/5 hover:border-sc-purple-200/20 rounded-xl p-5 hover:bg-zinc-900/30 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                >
                  {/* Status, Category & Severity line */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider font-mono", getStatusBadge(report.status))}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider font-mono", getSeverityBadge(report.severity))}>
                        {report.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      {report.category === 'bug' ? (
                        <Bug className="w-3.5 h-3.5 text-[#D04040]" />
                      ) : (
                        <LifeBuoy className="w-3.5 h-3.5 text-sc-purple-650" />
                      )}
                      <span className="capitalize">{report.category}</span>
                    </div>
                  </div>

                  {/* Complaint userWords preview */}
                  <p className="text-zinc-200 text-xs font-semibold leading-relaxed line-clamp-3">
                    "{report.userWords}"
                  </p>

                  {/* Metadata line */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-zinc-500" />
                      <span className="font-medium text-zinc-400">
                        {report.user?.name || 'Anonymous'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Open details prompt */}
                  <div className="flex items-center justify-end text-[10px] font-bold text-sc-purple-650 group">
                    <span className="flex items-center gap-0.5 hover:underline">
                      Review Diagnostics <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 border border-dashed border-white/5 rounded-xl text-center text-zinc-500 space-y-2">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
              <h3 className="font-bold text-sm text-zinc-400">All caught up</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                No support tickets match the selected status filter.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Admin Report Inspect Modal */}
      {selectedReport && (
        <AdminReportModal
          report={selectedReport}
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          onStatusUpdated={handleReportUpdated}
        />
      )}

    </div>
  );
}
