import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  GitPullRequest,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Lock
} from 'lucide-react';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminApplications({
        search,
        status: statusFilter || undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setApplications(res.applications || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load application records.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching application oversight records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const statusBadge = (status) => {
    const config = {
      submitted: { label: 'Submitted', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
      under_review: { label: 'Under Review', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
      interview_scheduled: { label: 'Interview Scheduled', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      offered: { label: 'Offer Extended', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      hired: { label: 'Hired', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
      rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
      withdrawn: { label: 'Withdrawn', color: 'bg-zinc-800 text-zinc-500 border-zinc-700' }
    };

    const c = config[status] || { label: status, color: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <GitPullRequest className="w-5 h-5 text-emerald-400" />
            <span>Hiring Workflow & Application Oversight</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Read-only operational tracking of candidate applications through the Phase 4 recruitment lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#161616] px-3 py-1.5 rounded-lg border border-[#262626]">
          <Lock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Internal notes privacy enforced</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name, candidate email, or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B1B1B] border border-[#303030] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Lifecycle Stages</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="offered">Offer Extended</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <button
            onClick={fetchApplications}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            <span>Loading applications oversight...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No applications match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Status Stage</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Recruiter Feedback / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-[#181818]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{app.candidateName || 'Candidate'}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">{app.candidateEmail || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-300">
                      {app.jobTitle || 'General Application'}
                    </td>
                    <td className="py-3.5 px-4">
                      {statusBadge(app.status)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                      {app.feedbackNotes ? (
                        app.feedbackNotes.startsWith('[Masked') ? (
                          <span className="text-zinc-600 italic flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3 text-zinc-600" />
                            {app.feedbackNotes}
                          </span>
                        ) : (
                          <span className="text-zinc-300">{app.feedbackNotes}</span>
                        )
                      ) : (
                        <span className="text-zinc-600 italic">No notes provided</span>
                      )}
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
    </div>
  );
}
