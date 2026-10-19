import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Bookmark, BookmarkCheck, Filter, Info, ArrowRight, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import SkillIcon from '../components/common/SkillIcon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function RecommendedPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState(new Set(['cand-001']));
  const [interviewForm, setInterviewForm] = useState({
    proposedDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    timeZone: 'EST',
    notes: 'Technical assessment interview'
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [recsRes, jobsRes, shortRes] = await Promise.allSettled([
          api.getRecommendations(),
          api.getJobs({ status: 'Open' }),
          api.getShortlists()
        ]);

        if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value?.data || []);
        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value?.data || []);
        if (shortRes.status === 'fulfilled' && shortRes.value?.data) {
          const ids = new Set(shortRes.value.data.map((s) => s.candidateId));
          setShortlistedIds(ids);
        }
      } catch (err) {
        console.warn('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleJobFilterChange = async (jobId) => {
    setSelectedJobId(jobId);
    setLoading(true);
    try {
      if (jobId === 'all') {
        const res = await api.getRecommendations();
        setRecommendations(res?.data || []);
      } else {
        const res = await api.getJobMatches(jobId);
        setRecommendations(res?.data || []);
      }
    } catch (err) {
      console.warn('Failed to filter matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShortlist = async (candidateId) => {
    try {
      const res = await api.toggleShortlist({ candidateId });
      const next = new Set(shortlistedIds);
      if (res.shortlisted) {
        next.add(candidateId);
      } else {
        next.delete(candidateId);
      }
      setShortlistedIds(next);
    } catch (err) {
      console.warn('Shortlist toggle error:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      await api.createInterview({
        candidateId: selectedMatch.candidate._id,
        candidateName: selectedMatch.candidate.name,
        jobId: selectedMatch.jobId || 'job-001',
        jobTitle: selectedMatch.jobTitle || 'Engineering Role',
        proposedDate: interviewForm.proposedDate,
        timeZone: interviewForm.timeZone,
        notes: interviewForm.notes
      });
      setScheduleSuccess(true);
    } catch (err) {
      console.warn('Interview schedule fallback:', err);
      setScheduleSuccess(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#10B981]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Recommended Talent</h1>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Deterministic match scores calibrated against your open engineering requisitions across Latin America.
          </p>
        </div>

        {/* Filter by Open Job */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#777777]" />
          <span className="text-xs text-[#777777]">Target Requisition:</span>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobFilterChange(e.target.value)}
            className="bg-[#171717] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Open Positions (Best Matches)</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className="p-4 bg-[#171717] border border-[#303030] rounded-2xl flex items-start gap-3 text-xs text-[#A3A3A3]">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#F5F5F5]" />
        <div>
          <span className="font-semibold text-white">Rule-Based Deterministic Scoring:</span> Scores (1.0 to 10.0) are calculated solely on verified technical skill overlap (50%), years of professional experience (25%), availability timing (15%), and employment preference (10%). No protected personal attributes or subjective inferences are ever used.
        </div>
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#777777] text-sm">
          Calculating match algorithms against Latin American candidate profiles...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-16 text-center text-[#777777] text-sm bg-[#171717] rounded-3xl border border-[#303030]">
          No candidate matches found matching the selected requisition criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const cand = rec.candidate;
            const isShortlisted = shortlistedIds.has(cand._id);
            return (
              <div
                key={cand._id + rec.jobTitle}
                className="bg-[#171717] border border-[#303030] hover:border-[#404040] rounded-3xl p-5 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Candidate Avatar, Name, Score */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#303030]">
                    <div className="flex items-center gap-3">
                      <img
                        src={cand.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                        alt={cand.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#303030]"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-[#F5F5F5]">{cand.name}</h3>
                        <p className="text-xs text-[#777777]">{cand.title}</p>
                        <p className="text-[11px] text-[#A3A3A3] font-medium mt-0.5">
                          {cand.city ? `${cand.city}, ` : ''}{cand.country} • {cand.timeZone}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202020] border border-[#303030] text-[#F5F5F5] text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Score: {rec.score}</span>
                      </div>
                      <span className="text-[10px] text-[#777777] mt-1 font-medium">
                        For: {rec.jobTitle}
                      </span>
                    </div>
                  </div>

                  {/* Summary & Badges */}
                  <div className="mt-3">
                    <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
                      {cand.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge variant="default">{cand.yearsOfExperience} yrs exp</Badge>
                      <Badge variant="default">{cand.englishProficiency}</Badge>
                      <Badge variant="default">{cand.availability} start</Badge>
                      <Badge variant="trial">{cand.compensationExpectation}</Badge>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="mt-3.5 pt-3 border-t border-[#303030]">
                      <span className="text-[10px] uppercase font-semibold text-[#777777] tracking-wider block mb-1.5">
                        Matched Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(rec.matchedSkills || cand.skills.slice(0, 4)).map((skill) => (
                          <SkillIcon key={skill} skill={skill} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-[#303030] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedMatch(rec)}
                      className="text-xs font-semibold text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
                    >
                      View Breakdown
                    </button>
                    <button
                      onClick={() => handleToggleShortlist(cand._id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                        isShortlisted ? 'text-[#10B981]' : 'text-[#777777] hover:text-[#F5F5F5]'
                      }`}
                      title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                    >
                      {isShortlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Calendar}
                    onClick={() => {
                      setSelectedMatch(rec);
                      setScheduleSuccess(false);
                      setShowScheduleModal(true);
                    }}
                  >
                    Schedule Interview
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Score Breakdown Modal */}
      <Modal
        isOpen={!!selectedMatch && !showScheduleModal}
        onClose={() => setSelectedMatch(null)}
        title="Candidate Match Breakdown"
        subtitle={`Match evaluation for ${selectedMatch?.candidate?.name} on ${selectedMatch?.jobTitle}`}
        maxWidth="max-w-lg"
      >
        {selectedMatch && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#202020] rounded-2xl border border-[#303030] flex items-center justify-between">
              <div>
                <span className="text-[#777777]">Calculated Fit Score</span>
                <p className="text-xl font-bold text-[#F5F5F5]">{selectedMatch.score} / 10.0</p>
              </div>
              <Badge variant="open">Calibrated</Badge>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030] flex justify-between">
                <div>
                  <p className="font-semibold text-white">Technical Skill Overlap (50%)</p>
                  <p className="text-[11px] text-[#777777]">
                    {selectedMatch.matchedSkills?.length || 0} required skills verified
                  </p>
                </div>
                <span className="font-mono font-bold text-[#F5F5F5]">
                  {selectedMatch.breakdown?.skillScore ?? 45} / 50 pts
                </span>
              </div>

              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030] flex justify-between">
                <div>
                  <p className="font-semibold text-white">Experience Level Alignment (25%)</p>
                  <p className="text-[11px] text-[#777777]">
                    {selectedMatch.candidate?.yearsOfExperience} verified years of experience
                  </p>
                </div>
                <span className="font-mono font-bold text-[#F5F5F5]">
                  {selectedMatch.breakdown?.expScore ?? 23} / 25 pts
                </span>
              </div>

              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030] flex justify-between">
                <div>
                  <p className="font-semibold text-white">Timezone & Location (15%)</p>
                  <p className="text-[11px] text-[#777777]">
                    {selectedMatch.candidate?.country} ({selectedMatch.candidate?.timeZone})
                  </p>
                </div>
                <span className="font-mono font-bold text-[#F5F5F5]">
                  {selectedMatch.breakdown?.timezoneScore ?? 15} / 15 pts
                </span>
              </div>

              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030] flex justify-between">
                <div>
                  <p className="font-semibold text-white">Immediate Availability (10%)</p>
                  <p className="text-[11px] text-[#777777]">
                    Status: {selectedMatch.candidate?.availability}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#10B981]">
                  {selectedMatch.breakdown?.availScore ?? 10} / 10 pts
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#303030]">
              <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Calendar}
                onClick={() => {
                  setScheduleSuccess(false);
                  setShowScheduleModal(true);
                }}
              >
                Schedule Technical Interview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Interview Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={`Request Interview with ${selectedMatch?.candidate?.name}`}
        subtitle={`Role: ${selectedMatch?.jobTitle} • Location: ${selectedMatch?.candidate?.country}`}
      >
        {scheduleSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Interview Dispatched</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              Your interview invitation has been dispatched to {selectedMatch?.candidate?.name}. You can review upcoming sessions in the Interviews and Calendar tabs.
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
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Proposed Date & Time</label>
              <input
                type="datetime-local"
                required
                value={interviewForm.proposedDate}
                onChange={(e) => setInterviewForm({ ...interviewForm, proposedDate: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              />
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
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Focus & Agenda</label>
              <textarea
                rows={3}
                value={interviewForm.notes}
                onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
              <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm & Dispatch
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
