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

  // SystemReport has no reply thread — its "needs attention" signal is OPEN
  // (newly submitted, not yet reviewed). Drives the tab badge + per-card marker.
  const openSupportCount = reportsList.filter(r => r.status === 'OPEN').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ANALYZED':
        return 'text-sc-purple-600 bg-sc-purple-50 border-sc-purple-200';
      case 'IN_PROGRESS':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'RESOLVED':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-text-tertiary bg-bg-secondary-panel border-border-default';
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
        return 'text-sc-purple-600 bg-sc-purple-50 border-sc-purple-200';
      default:
        return 'text-text-tertiary bg-bg-secondary-panel border-border-default';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-subtle pb-5 text-left">
        <div>
          <h1 className="text-2xl font-black text-text-heading tracking-tight flex items-center gap-2">
            Admin Inquiry Console
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            Manage incident violations and user support diagnostics tickets.
          </p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-bg-secondary-panel p-1 rounded-xl border border-border-subtle self-start">
          <button
            onClick={() => setActiveMainTab('incidents')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5",
              activeMainTab === 'incidents'
                ? "bg-white text-text-heading shadow-xs"
                : "bg-transparent text-text-secondary hover:text-text-heading"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Incident Violations ({incidentReports.length})
          </button>
          <button
            onClick={() => setActiveMainTab('support')}
            className={cn(
              "relative px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5",
              activeMainTab === 'support'
                ? "bg-white text-text-heading shadow-xs"
                : "bg-transparent text-text-secondary hover:text-text-heading"
            )}
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Support Reports ({reportsList.length})
            {openSupportCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-badge-danger text-[10px] font-bold text-white shadow-sc-sm">
                {openSupportCount > 99 ? "99+" : openSupportCount}
              </span>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-secondary-panel p-4 rounded-xl border border-border-subtle">
            <div className="flex bg-bg-secondary-panel/60 p-1 rounded-lg border border-border-subtle overflow-x-auto max-w-full">
              {(['ALL', 'OPEN', 'ANALYZED', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSupportFilter(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all border-none cursor-pointer whitespace-nowrap",
                    supportFilter === tab
                      ? "bg-sc-purple-650 text-white shadow-xs"
                      : "bg-transparent text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  {tab === 'ALL' ? 'All Tickets' : tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono">
              <Activity className="w-3.5 h-3.5 text-text-tertiary" />
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
                  className={cn(
                    "relative bg-bg-secondary-panel/20 border rounded-xl p-5 hover:bg-bg-sidebar-hover transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4",
                    report.status === 'OPEN' ? "border-badge-danger/40 hover:border-badge-danger/60" : "border-border-subtle hover:border-sc-purple-200/20"
                  )}
                >
                  {report.status === 'OPEN' && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-badge-danger text-white text-[9px] font-black uppercase tracking-wider shadow-sc-sm">
                      New
                    </span>
                  )}
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

                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary font-mono">
                      {report.category === 'bug' ? (
                        <Bug className="w-3.5 h-3.5 text-[#D04040]" />
                      ) : (
                        <LifeBuoy className="w-3.5 h-3.5 text-sc-purple-650" />
                      )}
                      <span className="capitalize">{report.category}</span>
                    </div>
                  </div>

                  {/* Complaint userWords preview */}
                  <p className="text-text-body text-xs font-semibold leading-relaxed line-clamp-3">
                    "{report.userWords}"
                  </p>

                  {/* Metadata line */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-[10px] text-text-tertiary">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-text-tertiary" />
                      <span className="font-medium text-text-secondary">
                        {report.user?.name || 'Anonymous'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3 h-3 text-text-tertiary" />
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
            <div className="p-16 border border-dashed border-border-subtle rounded-xl text-center text-text-tertiary space-y-2">
              <Clock className="w-8 h-8 text-text-tertiary mx-auto" />
              <h3 className="font-bold text-sm text-text-secondary">All caught up</h3>
              <p className="text-xs text-text-tertiary max-w-xs mx-auto">
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
