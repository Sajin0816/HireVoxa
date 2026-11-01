import React, { useState, useEffect, useRef } from 'react';
import FieldError from '../../components/common/FieldError';
import { getInputErrorClass, focusFirstError } from '../../utils/validation';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  X,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function AdminCompaniesPage() {
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Verification modal state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ text: '', type: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const reasonRef = useRef(null);

  const isAnalyst = currentUser?.adminRole === 'analyst';

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminCompanies({
        search,
        verificationStatus: statusFilter || undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setCompanies(res.companies || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load companies.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleOpenVerify = (company) => {
    setSelectedCompany(company);
    setVerificationStatus('verified');
    setReason('');
    setModalFeedback({ text: '', type: '' });
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
    setReason('');
    setModalFeedback({ text: '', type: '' });
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;

    if (['rejected', 'correction_requested'].includes(verificationStatus) && !reason.trim()) {
      setModalFeedback({ text: 'A mandatory reason is required for rejection or correction requests.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setModalFeedback({ text: '', type: '' });

    try {
      const res = await api.verifyAdminCompany(selectedCompany._id, {
        verificationStatus,
        reason
      });
      if (res.success) {
        setModalFeedback({ text: res.message || 'Verification updated.', type: 'success' });
        setTimeout(() => {
          handleCloseModal();
          fetchCompanies();
        }, 1200);
      }
    } catch (err) {
      setModalFeedback({ text: err.message || 'Verification failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'correction_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Correction Req</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pending Review</span>
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
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>Company Management & Verification</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Validate hiring entities, enforce verification standards, and document compliance decisions.
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
            placeholder="Search companies by name, industry, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B1B1B] border border-[#303030] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Verification Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="correction_requested">Correction Requested</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchCompanies}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            <span>Loading company registry...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No matching company records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {companies.map((c) => (
                  <tr key={c._id} className="hover:bg-[#181818]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{c.name}</div>
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                        >
                          <span>{c.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">{c.industry || 'General'}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{c.location || 'Remote'}</td>
                    <td className="py-3.5 px-4">
                      {statusBadge(c.verificationStatus || 'pending')}
                      {c.verificationReason && (
                        <div className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate" title={c.verificationReason}>
                          Reason: {c.verificationReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        disabled={isAnalyst}
                        onClick={() => handleOpenVerify(c)}
                        title={isAnalyst ? 'Analyst read-only' : ''}
                        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors border ${
                          isAnalyst
                            ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                        }`}
                      >
                        Review
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

      {/* Verification Decision Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Company Verification Decision</h3>
                <p className="text-xs text-zinc-400">{selectedCompany.name}</p>
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

            <form noValidate onSubmit={handleSubmitVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Decision Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'verified', label: 'Approve & Verify', color: 'border-emerald-500/40 text-emerald-400' },
                    { value: 'correction_requested', label: 'Request Correction', color: 'border-amber-500/40 text-amber-400' },
                    { value: 'rejected', label: 'Reject Entity', color: 'border-rose-500/40 text-rose-400' },
                    { value: 'pending', label: 'Reset to Pending', color: 'border-zinc-600 text-zinc-300' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVerificationStatus(opt.value)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        verificationStatus === opt.value
                          ? `bg-[#242424] ${opt.color} ring-1 ring-cyan-500`
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
                  Reason or Verification Notes {['rejected', 'correction_requested'].includes(verificationStatus) && '(Mandatory)'}
                </label>
                <textarea
                  id="admin-company-reason"
                  ref={reasonRef}
                  rows={3}
                  placeholder="State evidence reviewed (e.g., IRS EIN, corporate domain match) or reasons for rejection..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: '' }));
                  }}
                  aria-invalid={!!fieldErrors.reason}
                  aria-describedby={fieldErrors.reason ? 'admin-company-reason-error' : undefined}
                  className={`w-full bg-[#1F1F1F] border ${getInputErrorClass(
                    fieldErrors.reason,
                    'border-[#333333] focus:border-cyan-500',
                    'border-[#EF4444]/60 focus:border-[#EF4444]'
                  )} rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors`}
                />
                <FieldError id="admin-company-reason-error" error={fieldErrors.reason} />
                <p className="text-[11px] text-zinc-500 mt-1">
                  The decision and justification are permanently recorded in the immutable audit log.
                </p>
              </div>

              {selectedCompany.verificationHistory && selectedCompany.verificationHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#262626]">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Previous Verification Actions:</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedCompany.verificationHistory.map((h, idx) => (
                      <div key={idx} className="text-[11px] text-zinc-400 bg-[#141414] p-2 rounded border border-[#222222] flex items-center justify-between">
                        <span className="font-medium capitalize text-zinc-300">{h.status}</span>
                        <span className="text-zinc-500">{h.reason || 'No note'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
