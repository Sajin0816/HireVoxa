import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

const STATUS_FILTERS = [
  'All',
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Offered',
  'Hired',
  'Rejected',
  'Withdrawn'
];

export default function ApplicationsPage() {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeApp, setActiveApp] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Interview modal state
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    proposedDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    interviewType: 'Technical Screen',
    timeZone: 'EST',
    notes: '',
    interviewerName: ''
  });

  // Internal note state
  const [internalNoteText, setInternalNoteText] = useState('');

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const [appsRes, jobsRes] = await Promise.all([
        api.getApplications({
          status: selectedStatus === 'All' ? undefined : selectedStatus,
          jobId: selectedJobId || undefined,
          search: searchQuery || undefined
        }),
        api.getJobs()
      ]);
      setApplications(appsRes.data || []);
      setJobs(jobsRes.data || []);
      if (activeApp) {
        const refreshed = (appsRes.data || []).find(a => a._id === activeApp._id);
        if (refreshed) setActiveApp(refreshed);
      }
    } catch (err) {
      setError(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError('');

    Promise.all([
      api.getApplications({
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        jobId: selectedJobId || undefined,
        search: searchQuery || undefined
      }),
      api.getJobs()
    ])
      .then(([appsRes, jobsRes]) => {
        if (!isCurrent) return;
        setApplications(appsRes.data || []);
        setJobs(jobsRes.data || []);
        if (activeApp) {
          const refreshed = (appsRes.data || []).find((a) => a._id === activeApp._id);
          if (refreshed) setActiveApp(refreshed);
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(err.message || 'Failed to load applications.');
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
          setInitialLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedStatus, selectedJobId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusChange = async (appId, targetStatus) => {
    setSubmittingAction(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.updateApplicationStatus(appId, {
        status: targetStatus,
        reason: `Status updated to ${targetStatus} via hiring inbox.`
      });
      setActionSuccess(`Application status changed to ${targetStatus}.`);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDownloadResume = async (resumeId) => {
    try {
      const blob = await api.downloadResume(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not download resume: ${err.message}`);
    }
  };

  const handleAddInternalNote = async (appId) => {
    if (!internalNoteText.trim()) return;
    setSubmittingAction(true);
    setActionError('');
    try {
      await api.addApplicationNote(appId, internalNoteText);
      setInternalNoteText('');
      setActionSuccess('Internal team note saved.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to save note.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!activeApp) return;
    setSubmittingAction(true);
    setActionError('');
    try {
      await api.createInterview({
        candidateId: activeApp.candidateId || activeApp.candidateUserId,
        jobId: activeApp.jobId,
        applicationId: activeApp._id,
        candidateName: activeApp.candidate?.name || 'Applicant',
        jobTitle: activeApp.job?.title || activeApp.jobSnapshot?.title || 'Engineering Role',
        interviewType: interviewForm.interviewType,
        proposedDate: new Date(interviewForm.proposedDate).toISOString(),
        timeZone: interviewForm.timeZone,
        notes: interviewForm.notes,
        interviewerName: interviewForm.interviewerName || 'Hiring Lead'
      });
      setShowInterviewModal(false);
      setActionSuccess('Interview scheduled and candidate notified.');
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to schedule interview.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'Under Review':
        return <Badge variant="open">Under Review</Badge>;
      case 'Shortlisted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">Shortlisted</span>;
      case 'Interview':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30">Interview</span>;
      case 'Offered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/30">Offered</span>;
      case 'Hired':
        return <Badge variant="success">Hired</Badge>;
      case 'Rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'Withdrawn':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#6B7280]/20 text-[#9CA3AF] border border-[#6B7280]/30">Withdrawn</span>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#777777] font-semibold">Hiring Pipeline</p>
          <h1 className="text-3xl font-bold text-[#F5F5F5] tracking-tight mt-1">Application Inbox</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">
            Review incoming candidate applications, evaluate resumes, schedule interviews, and make hiring decisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1B1B1B] border border-[#303030] rounded-2xl p-4 space-y-4">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Application status filters">
          {STATUS_FILTERS.map((status) => {
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2E2E2E] text-white border-[#505050] shadow-sm'
                    : 'border-transparent text-[#888888] hover:text-[#D4D4D4] hover:bg-[#222222] hover:border-[#333333]'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Job dropdown and search */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search candidate name, skills, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#303030] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#666666] outline-none focus:border-[#606060]"
            />
          </form>

          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-[#141414] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none focus:border-[#606060]"
          >
            <option value="">All Requisitions ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title} ({job.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#F87171] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[420px]" role="tabpanel" aria-label={`${selectedStatus} applications`}>
        {initialLoading ? (
          <div className="py-24 text-center text-sm text-[#777777]">Loading applicant records...</div>
        ) : (
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#353535] p-16 text-center">
                <FileText className="w-10 h-10 text-[#555555] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#E5E5E5]">No applications found</h3>
                <p className="text-xs text-[#888888] mt-1 max-w-md mx-auto">
                  {selectedStatus !== 'All' || selectedJobId
                    ? 'No applications match your selected filters. Try clearing filters or selecting another job.'
                    : 'As candidates discover your published requisitions and apply, their profiles will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-[#171717] border border-[#2B2B2B] hover:border-[#444444] rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-[#F5F5F5] truncate">
                    {app.candidate?.name || 'Applicant'}
                  </h3>
                  {getStatusBadge(app.status)}
                </div>

                <p className="text-xs text-[#A3A3A3] flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-[#E5E5E5]">{app.job?.title || app.jobSnapshot?.title}</span>
                  <span>·</span>
                  <span>{app.job?.department || 'Engineering'}</span>
                  <span>·</span>
                  <span>Applied {new Date(app.submittedAt).toLocaleDateString()}</span>
                  {app.candidate?.location && (
                    <>
                      <span>·</span>
                      <span>{app.candidate.location}</span>
                    </>
                  )}
                </p>

                {/* Candidate tags */}
                {app.candidate?.skills && app.candidate.skills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {app.candidate.skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded-md bg-[#222222] text-[#B0B0B0] text-[11px] border border-[#333333]">
                        {skill}
                      </span>
                    ))}
                    {app.candidate.skills.length > 5 && (
                      <span className="text-[10px] text-[#777777]">+{app.candidate.skills.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveApp(app);
                    setActionError('');
                    setActionSuccess('');
                  }}
                >
                  Review Application
                </Button>

                {app.status === 'Submitted' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStatusChange(app._id, 'Under Review')}
                    disabled={submittingAction}
                  >
                    Mark In Review
                  </Button>
                )}

                {(app.status === 'Submitted' || app.status === 'Under Review') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(app._id, 'Shortlisted')}
                    disabled={submittingAction}
                  >
                    Shortlist
                  </Button>
                )}

                {['Shortlisted', 'Under Review', 'Interview'].includes(app.status) && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setActiveApp(app);
                      setShowInterviewModal(true);
                      setActionError('');
                      setActionSuccess('');
                    }}
                  >
                    Schedule Interview
                  </Button>
                )}
              </div>
            </div>
          ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer */}
      {activeApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#171717] border border-[#333333] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#2C2C2C] pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{activeApp.candidate?.name || 'Applicant Profile'}</h2>
                  {getStatusBadge(activeApp.status)}
                </div>
                <p className="text-xs text-[#999999] mt-1">
                  Requisition: <span className="text-white font-medium">{activeApp.job?.title || activeApp.jobSnapshot?.title}</span> · Applied {new Date(activeApp.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveApp(null)}
                className="w-8 h-8 rounded-full bg-[#242424] text-[#A3A3A3] hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Notification messages */}
            {actionSuccess && (
              <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-3 text-xs text-[#34D399] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#F87171] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Candidate Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl p-3">
                <p className="text-[11px] text-[#777777]">Experience</p>
                <p className="text-sm font-semibold text-[#E5E5E5] mt-0.5">
                  {activeApp.candidate?.yearsOfExperience !== undefined ? `${activeApp.candidate.yearsOfExperience}+ years` : '—'}
                </p>
              </div>
              <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl p-3">
                <p className="text-[11px] text-[#777777]">Location</p>
                <p className="text-sm font-semibold text-[#E5E5E5] mt-0.5">
                  {activeApp.candidate?.location || activeApp.candidate?.country || 'Remote'}
                </p>
              </div>
              <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl p-3">
                <p className="text-[11px] text-[#777777]">Timezone</p>
                <p className="text-sm font-semibold text-[#E5E5E5] mt-0.5">
                  {activeApp.candidate?.timeZone || 'EST overlap'}
                </p>
              </div>
              <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl p-3">
                <p className="text-[11px] text-[#777777]">Resume</p>
                {activeApp.resumeId ? (
                  <button
                    onClick={() => handleDownloadResume(activeApp.resumeId)}
                    className="text-xs text-[#38BDF8] hover:underline font-semibold flex items-center gap-1 mt-0.5"
                  >
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                ) : (
                  <p className="text-xs text-[#777777] mt-0.5">Not attached</p>
                )}
              </div>
            </div>

            {/* Skills */}
            {activeApp.candidate?.skills && activeApp.candidate.skills.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Candidate Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {activeApp.candidate.skills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg bg-[#222222] text-xs text-[#E5E5E5] border border-[#333333]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Cover Note */}
            {activeApp.coverNote && (
              <div className="bg-[#1D1D1D] border border-[#2E2E2E] rounded-2xl p-4 space-y-1.5">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Applicant Note</h4>
                <p className="text-sm text-[#CCCCCC] whitespace-pre-wrap leading-6">{activeApp.coverNote}</p>
              </div>
            )}

            {/* Status Transition Action Bar */}
            <div className="border-t border-[#2C2C2C] pt-5 space-y-3">
              <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Hiring Decision & Lifecycle Stage</h4>
              <div className="flex flex-wrap gap-2">
                {activeApp.status === 'Submitted' && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(activeApp._id, 'Under Review')} disabled={submittingAction}>
                    Move to Under Review
                  </Button>
                )}
                {['Submitted', 'Under Review'].includes(activeApp.status) && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(activeApp._id, 'Shortlisted')} disabled={submittingAction}>
                    Shortlist Candidate
                  </Button>
                )}
                {['Submitted', 'Under Review', 'Shortlisted', 'Interview'].includes(activeApp.status) && (
                  <Button size="sm" variant="primary" onClick={() => setShowInterviewModal(true)} disabled={submittingAction}>
                    Schedule Interview
                  </Button>
                )}
                {['Shortlisted', 'Interview'].includes(activeApp.status) && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(activeApp._id, 'Offered')} disabled={submittingAction}>
                    Extend Offer
                  </Button>
                )}
                {activeApp.status === 'Offered' && (
                  <Button size="sm" variant="primary" onClick={() => handleStatusChange(activeApp._id, 'Hired')} disabled={submittingAction}>
                    Mark as Hired
                  </Button>
                )}
                {!['Rejected', 'Hired', 'Withdrawn'].includes(activeApp.status) && (
                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange(activeApp._id, 'Rejected')} disabled={submittingAction}>
                    Reject Candidate
                  </Button>
                )}
              </div>
            </div>

            {/* Internal Recruiter Notes */}
            <div className="border-t border-[#2C2C2C] pt-5 space-y-3">
              <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider flex items-center justify-between">
                <span>Internal Team Notes (Private to Organization)</span>
              </h4>
              {activeApp.internalNotes && (
                <div className="bg-[#121212] border border-[#292929] rounded-xl p-3 text-xs text-[#D1D5DB] whitespace-pre-wrap">
                  {activeApp.internalNotes}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a private note for your hiring team..."
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  className="flex-1 bg-[#141414] border border-[#303030] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#606060]"
                />
                <Button size="sm" variant="secondary" onClick={() => handleAddInternalNote(activeApp._id)} disabled={submittingAction || !internalNoteText.trim()}>
                  Save Note
                </Button>
              </div>
            </div>

            {/* Status History Timeline */}
            {activeApp.statusHistory && activeApp.statusHistory.length > 0 && (
              <div className="border-t border-[#2C2C2C] pt-5 space-y-3">
                <h4 className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Audit Timeline</h4>
                <div className="space-y-2">
                  {activeApp.statusHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#222222] last:border-0">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#666666]" />
                        <span className="font-semibold text-[#E5E5E5]">{item.toStatus}</span>
                        {item.reason && <span className="text-[#888888]">({item.reason})</span>}
                      </div>
                      <span className="text-[#666666]">{new Date(item.changedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && activeApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-3xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Schedule Interview</h3>
              <button onClick={() => setShowInterviewModal(false)} className="text-[#888888] hover:text-white">✕</button>
            </div>

            <p className="text-xs text-[#A3A3A3]">
              Proposing an interview for <strong className="text-white">{activeApp.candidate?.name || 'Applicant'}</strong> ({activeApp.job?.title}).
            </p>

            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Interview Type</label>
                <select
                  value={interviewForm.interviewType}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Technical Screen">Technical Screen (30m)</option>
                  <option value="System Architecture">System Architecture (60m)</option>
                  <option value="Live Coding">Live Coding Session (45m)</option>
                  <option value="Hiring Lead & Culture">Hiring Lead & Culture (45m)</option>
                  <option value="Final Offer Discussion">Final Offer Discussion (30m)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewForm.proposedDate}
                  onChange={(e) => setInterviewForm({ ...interviewForm, proposedDate: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Timezone</label>
                  <select
                    value={interviewForm.timeZone}
                    onChange={(e) => setInterviewForm({ ...interviewForm, timeZone: e.target.value })}
                    className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="EST">EST (UTC-5)</option>
                    <option value="CST">CST (UTC-6)</option>
                    <option value="PST">PST (UTC-8)</option>
                    <option value="BRT">BRT (UTC-3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Interviewer</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Architect"
                    value={interviewForm.interviewerName}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
                    className="w-full bg-[#141414] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Notes / Instructions for Candidate</label>
                <textarea
                  rows={3}
                  placeholder="Meeting agenda or link instructions..."
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] rounded-xl p-3 text-xs text-white outline-none focus:border-[#606060]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowInterviewModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" loading={submittingAction}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
