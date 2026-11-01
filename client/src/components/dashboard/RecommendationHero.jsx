import React, { useState, useRef } from 'react';
import FieldError from '../common/FieldError';
import { getInputErrorClass, focusFirstError } from '../../utils/validation';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, CheckCircle } from 'lucide-react';
import SkillIcon from '../common/SkillIcon';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { api } from '../../services/api';

export default function RecommendationHero({ candidateMatch, onInterviewScheduled, currentJob }) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const proposedDateRef = useRef(null);
  const [interviewForm, setInterviewForm] = useState({
    proposedDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    timeZone: 'EST',
    notes: 'Technical architecture and system design discussion.'
  });

  const candidate = candidateMatch?.candidate;

  const score = candidateMatch?.score;
  const roleTitle = candidateMatch?.jobTitle || currentJob?.title || '';

  if (!candidate) {
    return (
      <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 mb-6 shadow-sm">
        <span className="text-xs text-[#A3A3A3] font-medium block">Top Candidate Match</span>
        <h3 className="text-xl font-bold text-[#F5F5F5] tracking-tight mt-1">No live recommendation yet</h3>
        <p className="text-xs text-[#777777] mt-2">Recommendations will appear when eligible candidate and job records are available.</p>
      </div>
    );
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!interviewForm.proposedDate?.trim()) {
      errs.proposedDate = 'Please select a date and time for the interview.';
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs, { proposedDate: proposedDateRef });
      return;
    }
    setSubmitting(true);
    setScheduleError('');
    try {
      const targetJobId = candidateMatch?.jobId || currentJob?._id;
      if (!targetJobId) throw new Error('A persisted job is required before scheduling an interview.');
      await api.createInterview({
        candidateId: candidate._id,
        candidateName: candidate.name,
        jobId: targetJobId,
        jobTitle: roleTitle,
        proposedDate: interviewForm.proposedDate,
        timeZone: interviewForm.timeZone,
        notes: interviewForm.notes
      });
      setScheduleSuccess(true);
      if (onInterviewScheduled) onInterviewScheduled();
    } catch (err) {
      setScheduleError(err.message || 'Unable to schedule the interview.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 mb-6 shadow-sm">
      {/* Header section matching screenshot */}
      <div className="flex items-center justify-between pb-4 border-b border-[#303030] mb-5">
        <div>
          <span className="text-xs text-[#A3A3A3] font-medium block">
            Top Candidate Match
          </span>
          <h3 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            Featured Recommendation
          </h3>
        </div>
        <Link
          to="/app/recommended"
          className="text-xs font-semibold text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Candidate Recommendation Row matching screenshot */}
      <div className="bg-[#202020] border border-[#303030] rounded-2xl p-5 hover:border-[#404040] transition-all duration-200">
        {/* Top Info Row: Candidate Avatar, Name, Title, and Right Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
          <div className="flex items-center gap-3.5">
            {candidate.avatarUrl ? (
              <img
                src={candidate.avatarUrl}
                alt={candidate.name}
                className="w-11 h-11 rounded-full object-cover border border-[#303030]"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#262626] border border-[#303030] flex items-center justify-center text-xs font-bold text-[#F5F5F5] select-none">
                {candidate.name ? candidate.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'CE'}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-[#F5F5F5]">
                {candidate.name.length > 20 ? `${candidate.name.slice(0, 18)}...` : candidate.name}
              </h4>
              <p className="text-xs text-[#777777]">{candidate.title || 'Software Developer'}</p>
            </div>
          </div>

          {/* Right Badges: Experience, Commitment, Compensation */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 text-xs font-medium rounded-full bg-[#171717] text-[#D4D4D4] border border-[#303030]">
              {candidate.yearsOfExperience >= 6 ? 'Expert' : candidate.yearsOfExperience >= 4 ? 'Intermediate' : 'Junior'}
            </span>
            <span className="px-3.5 py-1 text-xs font-medium rounded-full bg-[#171717] text-[#D4D4D4] border border-[#303030]">
              {candidate.employmentPreference || 'Full-Time'}
            </span>
            <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-[#171717] text-[#F5F5F5] border border-[#303030]">
              {candidate.compensationExpectation || '$2,000'}
            </span>
          </div>
        </div>

        {/* Bottom Role Row: Role Name, Skills, Score, and Schedule Button */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-[#F5F5F5] mb-2">{roleTitle}</h4>
            <div className="flex flex-wrap items-center gap-2">
              {(candidate.skills || ['Python', 'JavaScript', 'React']).slice(0, 3).map((skill) => (
                <SkillIcon key={skill} skill={skill} />
              ))}
              <span className="text-[#555555] mx-1">—</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171717] border border-[#303030] text-[#F5F5F5] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Score: {score}</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            icon={Calendar}
            onClick={() => {
              setScheduleSuccess(false);
              setFormErrors({});
              setShowScheduleModal(true);
            }}
            className="text-xs font-semibold px-5 py-2.5 shrink-0"
          >
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={`Schedule Technical Interview with ${candidate.name}`}
        subtitle={`Role: ${roleTitle} • Country: ${candidate.country || 'Latin America'}`}
      >
        {scheduleSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Interview Request Sent!</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              Your interview invitation has been dispatched to {candidate.name}. The candidate and your recruiter Esther Howard will confirm availability shortly.
            </p>
            <Button
              className="mt-6"
              variant="primary"
              onClick={() => setShowScheduleModal(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleScheduleSubmit} className="space-y-4">
            {scheduleError && <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#F87171]">{scheduleError}</p>}
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Target Role</label>
              <input
                type="text"
                disabled
                value={roleTitle}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#777777] cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="hero-proposedDate" className="block text-xs font-medium text-[#A3A3A3] mb-1">Proposed Date & Time</label>
                <input
                  id="hero-proposedDate"
                  ref={proposedDateRef}
                  type="datetime-local"
                  value={interviewForm.proposedDate}
                  onChange={(e) => {
                    setInterviewForm({ ...interviewForm, proposedDate: e.target.value });
                    if (formErrors.proposedDate) setFormErrors((prev) => ({ ...prev, proposedDate: '' }));
                  }}
                  aria-invalid={!!formErrors.proposedDate}
                  aria-describedby={formErrors.proposedDate ? 'hero-proposedDate-error' : undefined}
                  className={`w-full bg-[#202020] border ${getInputErrorClass(
                    formErrors.proposedDate,
                    'border-[#303030] focus:border-[#777777]',
                    'border-[#EF4444]/60 focus:border-[#EF4444]'
                  )} rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none transition-colors`}
                />
                <FieldError id="hero-proposedDate-error" error={formErrors.proposedDate} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Timezone</label>
                <select
                  value={interviewForm.timeZone}
                  onChange={(e) => setInterviewForm({ ...interviewForm, timeZone: e.target.value })}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
                >
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="BRT">Brasília Time (BRT)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Interviewer Notes & Focus Areas</label>
              <textarea
                rows={3}
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                placeholder="Include agenda, repository links, or coding topics..."
                className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Dispatch Interview Invite
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
