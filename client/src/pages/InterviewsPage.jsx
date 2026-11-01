import React, { useState, useEffect, useRef } from 'react';
import { Video, Calendar, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FieldError from '../components/common/FieldError';
import { getInputErrorClass } from '../utils/validation';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [newForm, setNewForm] = useState({
    candidateId: '',
    jobId: '',
    proposedDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    timeZone: 'EST',
    notes: ''
  });

  const candidateSelectRef = useRef(null);
  const jobSelectRef = useRef(null);
  const dateInputRef = useRef(null);

  const fetchInterviews = async () => {
    setLoading(true);
    setError('');
    try {
      const [intsRes, candsRes, jobsRes] = await Promise.allSettled([
        api.getInterviews(),
        api.getCandidates(),
        api.getJobs()
      ]);
      if (intsRes.status === 'rejected') {
        throw intsRes.reason || new Error('Failed to load scheduled interviews.');
      }
      setInterviews(intsRes.value?.data || []);
      if (candsRes.status === 'fulfilled') setCandidates(candsRes.value?.data || []);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to interview service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateInterview(id, { status });
      fetchInterviews();
    } catch (err) {
      console.warn('Update interview failed:', err);
    }
  };

  const validateModal = () => {
    const errs = {};
    if (!newForm.candidateId) {
      errs.candidateId = 'Please select a candidate.';
    }
    if (!newForm.jobId) {
      errs.jobId = 'Please select an open position.';
    }
    if (!newForm.proposedDate) {
      errs.proposedDate = 'Please select a date and time.';
    }
    return errs;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errs = validateModal();
    setFormErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.candidateId) {
        candidateSelectRef.current?.focus();
      } else if (errs.jobId) {
        jobSelectRef.current?.focus();
      } else if (errs.proposedDate) {
        dateInputRef.current?.focus();
      }
      return;
    }

    const candidate = candidates.find((c) => c._id === newForm.candidateId);
    const job = jobs.find((j) => j._id === newForm.jobId);
    if (!candidate || !job) {
      setFormErrors({ candidateId: !candidate ? 'Select a persisted candidate.' : '', jobId: !job ? 'Select a persisted job.' : '' });
      return;
    }

    try {
      await api.createInterview({
        candidateId: candidate._id,
        candidateName: candidate.name,
        jobId: job._id,
        jobTitle: job.title,
        proposedDate: newForm.proposedDate,
        timeZone: newForm.timeZone,
        notes: newForm.notes
      });
      setShowNewModal(false);
      setFormErrors({});
      fetchInterviews();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Unable to create interview.' });
    }
  };

  const filtered = interviews.filter((i) =>
    statusFilter === 'all' ? true : i.status.toLowerCase() === statusFilter.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#F5F5F5]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Technical Interviews</h1>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Track and coordinate candidate interviews across US and Latin American timezones.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowNewModal(true)}
          className="text-xs font-semibold"
        >
          Schedule Interview
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto" role="tablist" aria-label="Interview status filters">
        {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => {
          const isActive = statusFilter === st.toLowerCase();
          return (
            <button
              key={st}
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(st.toLowerCase())}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-[#202020] text-[#F5F5F5] border-[#303030] shadow-sm'
                  : 'border-transparent text-[#777777] hover:text-[#A3A3A3] hover:bg-[#171717] hover:border-[#262626]'
              }`}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* Interview List Container */}
      <div className="min-h-[380px]" role="tabpanel" aria-label={`${statusFilter} interviews`}>
        <div key={statusFilter} className="animate-tab-fade">
          {loading ? (
            <div className="py-16 text-center text-[#777777] text-sm">
              Loading scheduled interviews...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm bg-[#171717] rounded-2xl border border-[#EF4444]/20 p-8 space-y-3">
              <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
              <p className="text-[#F87171] font-medium">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchInterviews}>
                Retry Fetching Interviews
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-[#777777] text-sm bg-[#171717] rounded-2xl border border-[#303030]">
              No interviews found under the "{statusFilter}" status.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const dateObj = new Date(item.proposedDate);
                const formattedDate = isNaN(dateObj.getTime())
                  ? item.proposedDate
                  : dateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                return (
                  <div
                    key={item._id}
                    className="bg-[#171717] border border-[#303030] hover:border-[#404040] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5] shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#F5F5F5]">{item.candidateName}</h3>
                          <Badge variant={item.status}>{item.status}</Badge>
                        </div>
                        <p className="text-xs text-[#777777] mt-0.5">Role: {item.jobTitle}</p>
                        <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3] mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                            {formattedDate}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] bg-[#202020] px-2 py-0.5 rounded border border-[#303030]">
                            {item.timeZone || 'EST'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {item.status !== 'Confirmed' && item.status !== 'Completed' && (
                        <button
                          onClick={() => handleStatusChange(item._id, 'Confirmed')}
                          className="px-3 py-1.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 text-xs font-semibold"
                        >
                          Confirm
                        </button>
                      )}
                      {item.status !== 'Completed' && item.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(item._id, 'Completed')}
                          className="px-3 py-1.5 rounded-xl bg-[#202020] text-[#D4D4D4] border border-[#303030] hover:bg-[#282828] text-xs font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                      {item.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleStatusChange(item._id, 'Cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Schedule Technical Interview"
        subtitle="Select a candidate and open position to schedule an assessment."
      >
        <form noValidate onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="int-candidate" className="block text-[#A3A3A3] mb-1 font-medium">Candidate</label>
            <select
              id="int-candidate"
              ref={candidateSelectRef}
              value={newForm.candidateId}
              onChange={(e) => {
                setNewForm({ ...newForm, candidateId: e.target.value });
                if (formErrors.candidateId) setFormErrors((prev) => ({ ...prev, candidateId: '' }));
              }}
              aria-invalid={!!formErrors.candidateId}
              aria-describedby={formErrors.candidateId ? 'candidate-error' : undefined}
              className={`w-full bg-[#202020] border ${
                getInputErrorClass(formErrors.candidateId)
              } rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:outline-none transition-colors`}
            >
              <option value="">Select candidate...</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.title} ({c.country})
                </option>
              ))}
            </select>
            <FieldError id="candidate-error" error={formErrors.candidateId} />
          </div>

          <div>
            <label htmlFor="int-job" className="block text-[#A3A3A3] mb-1 font-medium">Open Position</label>
            <select
              id="int-job"
              ref={jobSelectRef}
              value={newForm.jobId}
              onChange={(e) => {
                setNewForm({ ...newForm, jobId: e.target.value });
                if (formErrors.jobId) setFormErrors((prev) => ({ ...prev, jobId: '' }));
              }}
              aria-invalid={!!formErrors.jobId}
              aria-describedby={formErrors.jobId ? 'job-error' : undefined}
              className={`w-full bg-[#202020] border ${
                getInputErrorClass(formErrors.jobId)
              } rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:outline-none transition-colors`}
            >
              <option value="">Select open position...</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
            <FieldError id="job-error" error={formErrors.jobId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="int-date" className="block text-[#A3A3A3] mb-1 font-medium">Proposed Date & Time</label>
              <input
                id="int-date"
                ref={dateInputRef}
                type="datetime-local"
                value={newForm.proposedDate}
                onChange={(e) => {
                  setNewForm({ ...newForm, proposedDate: e.target.value });
                  if (formErrors.proposedDate) setFormErrors((prev) => ({ ...prev, proposedDate: '' }));
                }}
                aria-invalid={!!formErrors.proposedDate}
                aria-describedby={formErrors.proposedDate ? 'date-error' : undefined}
                className={`w-full bg-[#202020] border ${
                  getInputErrorClass(formErrors.proposedDate)
                } rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:outline-none transition-colors`}
              />
              <FieldError id="date-error" error={formErrors.proposedDate} />
            </div>
            <div>
              <label htmlFor="int-tz" className="block text-[#A3A3A3] mb-1 font-medium">Timezone</label>
              <select
                id="int-tz"
                value={newForm.timeZone}
                onChange={(e) => setNewForm({ ...newForm, timeZone: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              >
                <option value="EST">Eastern Time (EST - UTC-5)</option>
                <option value="CST">Central Time (CST - UTC-6)</option>
                <option value="PST">Pacific Time (PST - UTC-8)</option>
                <option value="BRT">Brasília Time (BRT - UTC-3)</option>
                <option value="ART">Buenos Aires Time (ART - UTC-3)</option>
                <option value="COT">Colombia Time (COT - UTC-5)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#A3A3A3] mb-1 font-medium">Notes & Discussion Topics (Optional)</label>
            <textarea
              rows={3}
              placeholder="Add interview agenda, technical focus areas, or screening questions..."
              value={newForm.notes}
              onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#666666] focus:outline-none focus:border-[#505050]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
            <Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Interview
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
