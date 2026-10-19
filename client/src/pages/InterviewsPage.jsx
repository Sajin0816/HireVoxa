import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Plus, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    candidateId: '',
    jobId: '',
    proposedDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    timeZone: 'EST',
    notes: 'Technical architecture discussion.'
  });

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const [intsRes, candsRes, jobsRes] = await Promise.allSettled([
        api.getInterviews(),
        api.getCandidates(),
        api.getJobs()
      ]);
      if (intsRes.status === 'fulfilled') setInterviews(intsRes.value?.data || []);
      if (candsRes.status === 'fulfilled') setCandidates(candsRes.value?.data || []);
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value?.data || []);
    } catch (err) {
      console.warn('Interviews fetch fallback:', err);
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const candidate = candidates.find((c) => c._id === newForm.candidateId) || candidates[0];
    const job = jobs.find((j) => j._id === newForm.jobId) || jobs[0];

    try {
      await api.createInterview({
        candidateId: candidate?._id || 'cand-001',
        candidateName: candidate?.name || 'Rodrigo Silva',
        jobId: job?._id || 'job-001',
        jobTitle: job?.title || 'Front-End Developer',
        proposedDate: newForm.proposedDate,
        timeZone: newForm.timeZone,
        notes: newForm.notes
      });
      setShowNewModal(false);
      fetchInterviews();
    } catch (err) {
      console.warn('Create interview failed:', err);
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
      <div className="flex items-center gap-2 pb-2">
        {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st.toLowerCase())}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === st.toLowerCase()
                ? 'bg-[#202020] text-[#F5F5F5] border border-[#303030]'
                : 'text-[#777777] hover:text-[#A3A3A3] hover:bg-[#171717]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Interview List */}
      {loading ? (
        <div className="py-16 text-center text-[#777777] text-sm">
          Loading scheduled interviews...
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

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Schedule Technical Interview"
        subtitle="Associate a candidate and requisition for a live video assessment."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#A3A3A3] mb-1 font-medium">Select Candidate</label>
            <select
              value={newForm.candidateId}
              onChange={(e) => setNewForm({ ...newForm, candidateId: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
            >
              <option value="">Select an engineer...</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.title} ({c.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A3A3A3] mb-1 font-medium">Associated Job Position</label>
            <select
              value={newForm.jobId}
              onChange={(e) => setNewForm({ ...newForm, jobId: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
            >
              <option value="">Select a job requisition...</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Proposed Date & Time</label>
              <input
                type="datetime-local"
                required
                value={newForm.proposedDate}
                onChange={(e) => setNewForm({ ...newForm, proposedDate: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              />
            </div>
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Timezone</label>
              <select
                value={newForm.timeZone}
                onChange={(e) => setNewForm({ ...newForm, timeZone: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              >
                <option value="EST">Eastern Time (EST)</option>
                <option value="CST">Central Time (CST)</option>
                <option value="PST">Pacific Time (PST)</option>
                <option value="BRT">Brasília Time (BRT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#A3A3A3] mb-1 font-medium">Agenda & Focus Notes</label>
            <textarea
              rows={3}
              value={newForm.notes}
              onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
            <Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Dispatch Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
