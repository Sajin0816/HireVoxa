import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  FileSpreadsheet,
  Download,
  Users,
  Building2,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function AdminReportsPage() {
  const [exportingType, setExportingType] = useState('');
  const [exportFeedback, setExportFeedback] = useState({ text: '', type: '' });

  const handleExport = async (type) => {
    setExportingType(type);
    setExportFeedback({ text: '', type: '' });
    try {
      const blob = await api.exportAdminReportCsv(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hirevoxa_report_${type}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExportFeedback({ text: `Successfully generated and downloaded ${type} report.`, type: 'success' });
    } catch (err) {
      setExportFeedback({ text: err.message || 'Export failed.', type: 'error' });
    } finally {
      setExportingType('');
    }
  };

  const reports = [
    {
      type: 'users',
      title: 'Platform Users Export',
      description: 'Export registered candidates, company employers, and operational administrator tiers with statuses.',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      type: 'companies',
      title: 'Company Verification Registry',
      description: 'Export all company profiles, verification decisions, industries, locations, and verification reasons.',
      icon: Building2,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
    {
      type: 'jobs',
      title: 'Job Moderation & Listings',
      description: 'Export active, draft, closed, and moderated job postings with compensation and compliance details.',
      icon: Briefcase,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      type: 'audit_logs',
      title: 'Administrative Audit History',
      description: 'Export tamper-evident append-only event stream recording operator actions and timestamped decisions.',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <span>Operational Reports & Secure Data Exports</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Export verified platform datasets for compliance reviews, executive reporting, and external auditing.
        </p>
      </div>

      {/* Security Protection Notice */}
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-300">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <span className="font-semibold block text-emerald-200">Spreadsheet Formula Injection Safeguard</span>
          <span>
            All exported CSV files automatically escape potentially dangerous formula prefix characters (=, +, -, @, \t, \r)
            to protect downstream spreadsheet applications (Excel, Google Sheets) from formula injection vulnerabilities.
          </span>
        </div>
      </div>

      {exportFeedback.text && (
        <div className={`p-3 rounded-lg text-xs ${
          exportFeedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
        }`}>
          {exportFeedback.text}
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          const isCurrent = exportingType === r.type;

          return (
            <div
              key={r.type}
              className="p-5 bg-[#141414] border border-[#262626] rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg border ${r.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    CSV Format
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{r.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#222222] flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">Bound to 1,000 records</span>
                <button
                  disabled={!!exportingType}
                  onClick={() => handleExport(r.type)}
                  className="px-3.5 py-1.5 bg-[#1B1B1B] hover:bg-[#252525] border border-[#333333] hover:border-zinc-500 rounded-lg text-xs font-medium text-white transition-all inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isCurrent ? 'Generating...' : 'Download CSV'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scope Disclaimer */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex items-center gap-3 text-xs text-zinc-500">
        <AlertCircle className="w-4 h-4 shrink-0 text-zinc-600" />
        <span>
          <strong>Phase Boundary Notice:</strong> Payment transaction logs, fee reconciliation, and revenue analytics are
          strictly out of scope for Phase 4.5 and will be implemented upon completion of the Phase 5 Payments integration.
        </span>
      </div>
    </div>
  );
}
