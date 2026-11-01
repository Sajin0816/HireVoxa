import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function CandidateApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const loadApplication = () => {
    setLoading(true);
    api.getApplication(id)
      .then((res) => setApplication(res.data))
      .catch((err) => setError(err.message || 'Unable to load application.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawError('');
    try {
      await api.withdrawApplication(id, withdrawalReason || 'Candidate withdrew application');
      setShowWithdrawModal(false);
      setWithdrawSuccess('Application withdrawn. The hiring organization has been notified.');
      loadApplication();
    } catch (err) {
      setWithdrawError(err.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm text-[#777777]">Loading application details…</div>;
  if (error || !application) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Link to="/candidate/applications" className="inline-flex items-center gap-2 text-xs text-[#A3A3A3] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#F87171]">
          {error || 'Application not found.'}
        </div>
      </div>
    );
  }

  const isTerminal = ['Withdrawn', 'Rejected', 'Hired'].includes(application.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/candidate/applications" className="inline-flex items-center gap-2 text-xs text-[#A3A3A3] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </Link>

      {withdrawSuccess && (
        <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4 text-xs text-[#34D399] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{withdrawSuccess}</span>
        </div>
      )}

      {/* Main Card */}
      <section className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#2A2A2A] pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#777777] font-semibold">Application Record</p>
            <h1 className="mt-2 text-2xl font-bold text-white">{application.job?.title || 'Engineering Opportunity'}</h1>
            <p className="mt-2 text-xs text-[#A3A3A3]">
              Submitted on {new Date(application.submittedAt).toLocaleString()}
            </p>
          </div>
          <Badge
            variant={
              application.status === 'Rejected'
                ? 'error'
                : application.status === 'Hired'
                ? 'success'
                : application.status === 'Withdrawn'
                ? 'default'
                : 'open'
            }
            size="lg"
          >
            {application.status}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#303030] bg-[#202020] p-4">
            <p className="text-[11px] text-[#777777]">Department & Type</p>
            <p className="mt-1 text-sm font-semibold text-[#E5E5E5]">{application.job?.employmentType || 'Full-time'}</p>
          </div>
          <div className="rounded-xl border border-[#303030] bg-[#202020] p-4">
            <p className="text-[11px] text-[#777777]">Target Experience</p>
            <p className="mt-1 text-sm font-semibold text-[#E5E5E5]">{application.job?.minimumExperience ?? '3'}+ years</p>
          </div>
          <div className="rounded-xl border border-[#303030] bg-[#202020] p-4">
            <p className="text-[11px] text-[#777777]">Resume Attached</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#E5E5E5]">
              {application.resumeId ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                  <span>Resume Attached</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-[#777777]" />
                  <span>Not attached</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Cover Note */}
        {application.coverNote && (
          <div className="border-t border-[#2A2A2A] pt-5">
            <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Your Message to Hiring Team</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#D4D4D4] bg-[#202020] p-4 rounded-xl border border-[#2E2E2E]">
              {application.coverNote}
            </p>
          </div>
        )}

        {/* Scheduled Interview Section */}
        {application.interviews && application.interviews.length > 0 && (
          <div className="border-t border-[#2A2A2A] pt-5 space-y-3">
            <h4 className="text-xs font-semibold text-[#FBBF24] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Upcoming Scheduled Interview</span>
            </h4>
            {application.interviews.map((int) => (
              <div key={int._id} className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{int.interviewType || 'Technical Interview'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30">
                    {int.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#E5E5E5] pt-1">
                  <div>
                    <span className="text-[#A3A3A3]">Date & Time: </span>
                    <span className="font-semibold">{new Date(int.proposedDate).toLocaleString()} ({int.timeZone})</span>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3]">Interviewer: </span>
                    <span>{int.interviewerName || 'Hiring Team Lead'}</span>
                  </div>
                </div>
                {int.notes && (
                  <p className="text-xs text-[#D4D4D4] pt-2 border-t border-[#F59E0B]/20">
                    <span className="text-[#A3A3A3]">Instructions: </span>{int.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Withdrawal Section */}
        {application.status === 'Withdrawn' ? (
          <div className="border-t border-[#2A2A2A] pt-5">
            <div className="rounded-xl border border-[#6B7280]/30 bg-[#6B7280]/10 p-4 text-xs text-[#9CA3AF] flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-[#9CA3AF]" />
              <span>
                You withdrew this application on {application.withdrawnAt ? new Date(application.withdrawnAt).toLocaleString() : 'record'}.
                {application.withdrawalReason && ` Reason: "${application.withdrawalReason}".`}
              </span>
            </div>
          </div>
        ) : !isTerminal && (
          <div className="border-t border-[#2A2A2A] pt-5 flex items-center justify-between">
            <span className="text-xs text-[#777777]">No longer interested in this requisition?</span>
            <button
              onClick={() => {
                setWithdrawError('');
                setShowWithdrawModal(true);
              }}
              className="text-xs text-[#EF4444] hover:underline font-semibold"
            >
              Withdraw Application
            </button>
          </div>
        )}

        {/* Timeline */}
        {application.statusHistory && application.statusHistory.length > 0 && (
          <div className="border-t border-[#2A2A2A] pt-5 space-y-3">
            <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Application Journey</h4>
            <div className="space-y-2">
              {application.statusHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#242424] last:border-0">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#666666]" />
                    <span className="font-semibold text-white">{item.toStatus}</span>
                    {item.reason && <span className="text-[#888888]">({item.reason})</span>}
                  </div>
                  <span className="text-[#666666]">{new Date(item.changedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Withdraw Application?</h3>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-5">
              Withdrawing your application will remove you from active consideration for <strong>{application.job?.title}</strong>. This action is terminal and cannot be undone.
            </p>

            {withdrawError && (
              <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#F87171]">
                {withdrawError}
              </div>
            )}

            <form noValidate onSubmit={handleWithdraw} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">
                  Reason for withdrawal (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Accepted another offer, compensation mismatch, relocation..."
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full bg-[#141414] border border-[#333333] rounded-xl p-3 text-xs text-white outline-none focus:border-[#606060]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  loading={withdrawing}
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
