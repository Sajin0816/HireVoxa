import React, { useState, useEffect, useRef } from 'react';
import FieldError from '../../components/common/FieldError';
import { getInputErrorClass, focusFirstError } from '../../utils/validation';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  RefreshCw,
  X,
  Building,
  MapPin,
  DollarSign
} from 'lucide-react';

export default function AdminJobsPage() {
  const { user: currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [moderationFilter, setModerationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Moderation modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [moderationStatus, setModerationStatus] = useState('approved');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ text: '', type: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const reasonRef = useRef(null);

  const isAnalyst = currentUser?.adminRole === 'analyst';

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminJobs({
        search,
        moderationStatus: moderationFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setJobs(res.jobs || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load job listings.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with job moderation service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [moderationFilter, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleOpenModerate = (job) => {
    setSelectedJob(job);
    setModerationStatus('approved');
    setReason('');
    setModalFeedback({ text: '', type: '' });
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setReason('');
    setModalFeedback({ text: '', type: '' });
  };

  const handleSubmitModeration = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (['flagged', 'suspended'].includes(moderationStatus) && !reason.trim()) {
      setModalFeedback({ text: 'A mandatory reason is required when flagging or suspending a job.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setModalFeedback({ text: '', type: '' });

    try {
      const res = await api.moderateAdminJob(selectedJob._id || selectedJob.id, {
        moderationStatus,
        reason
      });
      if (res.success) {
        setModalFeedback({ text: res.message || 'Moderation status updated.', type: 'success' });
        setTimeout(() => {
          handleCloseModal();
          fetchJobs();
        }, 1200);
      }
    } catch (err) {
      setModalFeedback({ text: err.message || 'Moderation failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const moderationBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Flagged</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Moderation</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <span>Job Moderation & Compliance</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review listings, ensure transparent compensation, and suspend non-compliant job posts.
          </p>
        </div>
        {isAnalyst && (
          <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
            Read-Only Analyst: Mutations Disabled
          </span>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form noValidate onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B1B1B] border border-[#303030] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={moderationFilter}
            onChange={(e) => { setModerationFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Moderation States</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Moderation</option>
            <option value="flagged">Flagged</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="Open">Open</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>

          <button
            onClick={fetchJobs}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            <span>Loading job moderation queue...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No matching job listings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Job Listing</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4">Moderation Status</th>
                  <th className="py-3 px-4">Posted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {jobs.map((j) => {
                  const jobId = j._id || j.id;
                  return (
                    <tr key={jobId} className="hover:bg-[#181818]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">{j.title}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location || 'Remote'}</span>
                          <span>•</span>
                          <span>{j.employmentType || 'Full-time'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-medium">
                        {j.company || 'Direct Employer'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700">
                          {j.status || 'Open'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {moderationBadge(j.moderationStatus || 'approved')}
                        {j.moderationReason && (
                          <div className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate" title={j.moderationReason}>
                            Reason: {j.moderationReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                        {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={isAnalyst}
                          onClick={() => handleOpenModerate(j)}
                          title={isAnalyst ? 'Analyst read-only' : ''}
                          className={`px-3 py-1 rounded text-[11px] font-medium transition-colors border ${
                            isAnalyst
                              ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          Moderate
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Moderation Decision Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Moderate Job Listing</h3>
                <p className="text-xs text-zinc-400">{selectedJob.title} — {selectedJob.company}</p>
              </div>
            </div>

            {modalFeedback.text && (
              <div className={`p-3 rounded-lg text-xs mb-4 ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {modalFeedback.text}
              </div>
            )}

            <form noValidate onSubmit={handleSubmitModeration} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Moderation Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'approved', label: 'Approve Listing', color: 'border-emerald-500/40 text-emerald-400' },
                    { value: 'flagged', label: 'Flag for Audit', color: 'border-amber-500/40 text-amber-400' },
                    { value: 'suspended', label: 'Suspend Listing', color: 'border-rose-500/40 text-rose-400' },
                    { value: 'pending', label: 'Mark Pending', color: 'border-zinc-600 text-zinc-300' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setModerationStatus(opt.value)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        moderationStatus === opt.value
                          ? `bg-[#242424] ${opt.color} ring-1 ring-amber-500`
                          : 'bg-[#1C1C1C] border-[#2A2A2A] text-zinc-400 hover:bg-[#202020]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Compliance Reason {['flagged', 'suspended'].includes(moderationStatus) && '(Mandatory)'}
                </label>
                <textarea
                  id="admin-job-reason"
                  ref={reasonRef}
                  rows={3}
                  placeholder="Specify violation, compensation inconsistency, or required correction..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: '' }));
                  }}
                  aria-invalid={!!fieldErrors.reason}
                  aria-describedby={fieldErrors.reason ? 'admin-job-reason-error' : undefined}
                  className={`w-full bg-[#1F1F1F] border ${getInputErrorClass(
                    fieldErrors.reason,
                    'border-[#333333] focus:border-amber-500',
                    'border-[#EF4444]/60 focus:border-[#EF4444]'
                  )} rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors`}
                />
                <FieldError id="admin-job-reason-error" error={fieldErrors.reason} />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Reason and actor details are logged permanently in the operational audit trail.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] rounded-lg text-xs font-medium text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
