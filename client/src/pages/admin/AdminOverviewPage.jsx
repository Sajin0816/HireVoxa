import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  Building2,
  Briefcase,
  GitPullRequest,
  LifeBuoy,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminSummary();
      if (res.success && res.data) {
        setSummary(res.data);
      } else {
        setError('Failed to load operational summary data.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with administration backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">Aggregating live platform metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
        <div className="flex items-center gap-3 mb-2 font-semibold text-rose-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Operational Dashboard Error</span>
        </div>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-xs font-medium text-white transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { users, companies, jobs, applications, supportTickets, auditLogs } = summary || {};

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operations Command Overview</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time verification, governance, moderation, and operational metrics.
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Users</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{users?.total || 0}</span>
            <span className="text-xs text-zinc-500 font-mono">registered</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-zinc-400">
            <span>{users?.candidates || 0} Candidates</span>
            <span>{users?.companies || 0} Companies</span>
          </div>
        </div>

        {/* Company Verification */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Company Verification</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{companies?.verified || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">Verified</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-zinc-400">
            <span>Pending Review:</span>
            <span className="text-amber-400 font-medium">{companies?.pending || 0}</span>
          </div>
        </div>

        {/* Job Moderation */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Moderated Jobs</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{jobs?.published || 0}</span>
            <span className="text-xs text-zinc-500 font-mono">published</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-zinc-400">
            <span>Flagged / Suspended:</span>
            <span className="text-rose-400 font-medium">{jobs?.flagged || 0}</span>
          </div>
        </div>

        {/* Open Support Tickets */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Support Incidents</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{supportTickets?.open || 0}</span>
            <span className="text-xs text-amber-400 font-medium">Open / Active</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-zinc-400">
            <span>Total Logged:</span>
            <span className="text-zinc-300 font-mono">{supportTickets?.total || 0}</span>
          </div>
        </div>
      </div>

      {/* Operational Modules Navigation Cards */}
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase mb-4">Operations Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="group p-5 bg-[#141414] border border-[#262626] rounded-xl hover:border-emerald-500/40 hover:bg-[#181818] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white">User Directory & Governance</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Inspect accounts, suspend fraudulent actors, and manage administrative tiers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-zinc-500">
              {users?.suspended ? `${users.suspended} suspended accounts` : 'All accounts active'}
            </div>
          </Link>

          <Link
            to="/admin/companies"
            className="group p-5 bg-[#141414] border border-[#262626] rounded-xl hover:border-cyan-500/40 hover:bg-[#181818] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white">Company Verification</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Verify legitimate corporate entities, review EIN/registration, or request correction.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-zinc-500">
              {companies?.pending ? `${companies.pending} pending review` : 'All companies verified'}
            </div>
          </Link>

          <Link
            to="/admin/jobs"
            className="group p-5 bg-[#141414] border border-[#262626] rounded-xl hover:border-amber-500/40 hover:bg-[#181818] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white">Job Moderation</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Review listings for fair compensation, legitimate requirements, and compliance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-zinc-500">
              {jobs?.total || 0} total listings managed
            </div>
          </Link>

          <Link
            to="/admin/billing"
            className="group p-5 bg-[#141414] border border-[#262626] rounded-xl hover:border-emerald-500/40 hover:bg-[#181818] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white">Revenue & Billing Governance</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Authoritative financial metrics, placement fee invoicing, waivers, and CSV exports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-zinc-500">
              {summary?.monetization ? `$${((summary.monetization.collectedRevenueCents || 0) / 100).toLocaleString()} collected cash` : 'Active Monetization Hub'}
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Security & Audit Logs Section */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Recent Administrative Events</h2>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {auditLogs?.recent && auditLogs.recent.length > 0 ? (
          <div className="divide-y divide-[#222222]">
            {auditLogs.recent.map((log) => (
              <div key={log._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {log.action}
                  </span>
                  <span className="text-xs text-zinc-300">{log.actorEmail}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">[{log.targetType}]</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-emerald-400 font-medium text-[11px]">SUCCESS</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No administrative events recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
