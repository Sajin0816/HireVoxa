import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldAlert,
  RefreshCw,
  Shield,
  Info
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminAuditLogs({
        action: actionFilter || undefined,
        targetType: targetTypeFilter || undefined,
        page,
        limit: 25
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load audit logs.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with audit logging service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter, page]);

  const actionBadgeColor = (action) => {
    if (action.includes('SUSPEND') || action.includes('REJECT')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (action.includes('VERIF') || action.includes('REACTIVATE') || action.includes('BOOTSTRAP')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (action.includes('ROLE') || action.includes('SETTINGS')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>Immutable Administrative Audit Logs</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete append-only audit trail recording privileged operator interventions and state transitions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#161616] px-3 py-1.5 rounded-lg border border-[#262626]">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tamper-resistant append-only storage</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Administrative Actions</option>
            <option value="ADMIN_BOOTSTRAP">ADMIN_BOOTSTRAP</option>
            <option value="USER_SUSPEND">USER_SUSPEND</option>
            <option value="USER_REACTIVATE">USER_REACTIVATE</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="COMPANY_VERIFICATION">COMPANY_VERIFICATION</option>
            <option value="JOB_MODERATION">JOB_MODERATION</option>
            <option value="ADMIN_SETTINGS_UPDATE">ADMIN_SETTINGS_UPDATE</option>
            <option value="DATA_EXPORT_CSV">DATA_EXPORT_CSV</option>
            <option value="SUPPORT_TICKET_CREATE">SUPPORT_TICKET_CREATE</option>
            <option value="SUPPORT_TICKET_UPDATE">SUPPORT_TICKET_UPDATE</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Target Types</option>
            <option value="USER">USER</option>
            <option value="COMPANY">COMPANY</option>
            <option value="JOB">JOB</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="SUPPORT_TICKET">SUPPORT_TICKET</option>
            <option value="REPORT">REPORT</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            <span>Fetching operational audit stream...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No audit records match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator Email</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-[#181818]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{l.actorEmail || 'System'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">IP: {l.ipAddress || '127.0.0.1'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                        {l.actorRole || 'System'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] border ${actionBadgeColor(l.action)}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-300">
                      <span className="text-zinc-500">[{l.targetType}]</span> {l.targetId ? l.targetId.slice(0, 16) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {l.outcome || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#1F1F1F] hover:bg-[#2A2A2A] text-zinc-300 border border-[#333333] transition-colors"
                      >
                        Metadata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-between text-xs text-zinc-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-[#1B1B1B] hover:bg-[#252525] disabled:opacity-40 rounded border border-[#303030] text-zinc-300 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-[#1B1B1B] hover:bg-[#252525] disabled:opacity-40 rounded border border-[#303030] text-zinc-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Log Metadata Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Audit Event Details</h3>
              </div>
              <span className="font-mono text-xs text-zinc-500">{selectedLog._id}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Action:</span>
                <span className="font-mono font-semibold text-emerald-400">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Operator:</span>
                <span className="text-zinc-300">{selectedLog.actorEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Security Tier:</span>
                <span className="text-zinc-300 uppercase font-mono">{selectedLog.actorRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Resource:</span>
                <span className="font-mono text-zinc-300">[{selectedLog.targetType}] {selectedLog.targetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Client IP & Agent:</span>
                <span className="text-zinc-400 font-mono text-[11px] truncate max-w-xs">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Recorded Timestamp:</span>
                <span className="text-zinc-400 font-mono text-[11px]">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>

              <div className="pt-2">
                <span className="text-zinc-500 block mb-1">Attached Metadata:</span>
                <pre className="bg-[#101010] p-3 rounded-lg border border-[#262626] text-[11px] font-mono text-emerald-300/90 overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] rounded-lg text-xs font-medium text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
