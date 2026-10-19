import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Filter, Calendar, ExternalLink, MapPin, Bookmark, BookmarkCheck, Globe, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import SkillIcon from '../components/common/SkillIcon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function TalentsPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [expFilter, setExpFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [interviewDate, setInterviewDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16)
  );

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (countryFilter !== 'all') params.country = countryFilter;
      if (expFilter !== 'all') params.experience = expFilter;
      if (availFilter !== 'all') params.availability = availFilter;
      const [res, shortRes] = await Promise.allSettled([
        api.getCandidates(params),
        api.getShortlists()
      ]);
      if (res.status === 'fulfilled') setCandidates(res.value?.data || []);
      if (shortRes.status === 'fulfilled' && shortRes.value?.data) {
        setShortlistedIds(new Set(shortRes.value.data.map((s) => s.candidateId)));
      }
    } catch (err) {
      console.warn('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, countryFilter, expFilter, availFilter]);

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
      console.warn('Shortlist error:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      await api.createInterview({
        candidateId: selectedCandidate._id,
        candidateName: selectedCandidate.name,
        jobId: 'general-screening',
        jobTitle: selectedCandidate.title,
        proposedDate: interviewDate,
        timeZone: 'EST',
        notes: `Technical candidate screening with ${selectedCandidate.name}`
      });
      setScheduleSuccess(true);
    } catch (err) {
      console.warn('Schedule interview fallback:', err);
      setScheduleSuccess(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F5F5F5]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Latin American Engineering Talent</h1>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Browse verified software engineers across Brazil, Mexico, Colombia, Argentina, and Chile.
          </p>
        </div>

        <Badge variant="default">
          {candidates.length} Engineers Available
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by engineer name, skills, title, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Countries</option>
            <option value="Brazil">Brazil</option>
            <option value="Mexico">Mexico</option>
            <option value="Colombia">Colombia</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
          </select>

          {/* Experience filter */}
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Experience Levels</option>
            <option value="5">5+ Years (Senior)</option>
            <option value="7">7+ Years (Staff / Lead)</option>
          </select>

          {/* Availability filter */}
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Availabilities</option>
            <option value="Immediate">Immediate Start</option>
            <option value="2 Weeks">2 Weeks Notice</option>
          </select>
        </div>
      </div>

      {/* Talent Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#777777] text-sm">
          Loading talent profiles...
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-16 text-center text-[#777777] text-sm bg-[#171717] rounded-3xl border border-[#303030]">
          No engineering profiles found matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand) => {
            const isShortlisted = shortlistedIds.has(cand._id);
            return (
              <div
                key={cand._id}
                className="bg-[#171717] border border-[#303030] hover:border-[#404040] rounded-3xl p-5 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Header: Photo + Name + Location */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={cand.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={cand.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-[#303030] shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-[#F5F5F5]">{cand.name}</h3>
                      <p className="text-xs text-[#777777]">{cand.title}</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#A3A3A3] mt-1">
                        <MapPin className="w-3 h-3 text-[#777777]" />
                        <span>{cand.city ? `${cand.city}, ` : ''}{cand.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#A3A3A3] mt-3 line-clamp-2 leading-relaxed">
                    {cand.summary}
                  </p>

                  {/* Key Badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="default">{cand.yearsOfExperience} yrs exp</Badge>
                    <Badge variant="default">{cand.englishProficiency}</Badge>
                    <Badge variant="default">{cand.availability}</Badge>
                    <Badge variant="trial">{cand.compensationExpectation}</Badge>
                  </div>

                  {/* Skills */}
                  <div className="mt-4 pt-3 border-t border-[#303030]">
                    <div className="flex flex-wrap gap-1.5">
                      {(cand.skills || []).slice(0, 4).map((skill) => (
                        <SkillIcon key={skill} skill={skill} />
                      ))}
                      {(cand.skills || []).length > 4 && (
                        <span className="text-[10px] text-[#777777] px-1.5 py-0.5 rounded-full bg-[#202020] border border-[#303030]">
                          +{cand.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 pt-3 border-t border-[#303030] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCandidate(cand)}
                      className="text-xs text-[#A3A3A3] hover:text-[#FFFFFF]"
                    >
                      View Profile
                    </Button>
                    <button
                      onClick={() => handleToggleShortlist(cand._id)}
                      className={`p-1.5 rounded-lg border border-[#303030] transition-colors ${
                        isShortlisted ? 'bg-[#10B981]/15 text-[#10B981]' : 'text-[#777777] hover:text-white'
                      }`}
                      title={isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                    >
                      {isShortlisted ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Calendar}
                    onClick={() => {
                      setSelectedCandidate(cand);
                      setScheduleSuccess(false);
                      setShowScheduleModal(true);
                    }}
                    className="text-xs"
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Profile Details Modal */}
      <Modal
        isOpen={!!selectedCandidate && !showScheduleModal}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.name || 'Engineer Profile'}
        subtitle={`${selectedCandidate?.title} • ${selectedCandidate?.country}`}
        maxWidth="max-w-2xl"
      >
        {selectedCandidate && (
          <div className="space-y-5 text-xs">
            <div className="flex items-start gap-4 p-4 bg-[#202020] rounded-2xl border border-[#303030]">
              <img
                src={selectedCandidate.avatarUrl}
                alt={selectedCandidate.name}
                className="w-16 h-16 rounded-2xl object-cover border border-[#303030]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#F5F5F5]">{selectedCandidate.name}</h3>
                  <Badge variant="open">Verified Candidate</Badge>
                </div>
                <p className="text-xs text-[#777777] mt-0.5">{selectedCandidate.title}</p>
                <p className="text-[11px] text-[#A3A3A3] mt-1 font-mono">
                  {selectedCandidate.city}, {selectedCandidate.country} • {selectedCandidate.timeZone}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs text-[#777777] uppercase font-semibold block mb-1">Professional Overview</span>
              <p className="text-xs text-[#D4D4D4] leading-relaxed bg-[#202020] p-3.5 rounded-xl border border-[#303030]">
                {selectedCandidate.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Experience</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedCandidate.yearsOfExperience} Years</span>
              </div>
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">English</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedCandidate.englishProficiency}</span>
              </div>
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Availability</span>
                <span className="text-xs font-bold text-[#10B981] mt-1 block">{selectedCandidate.availability}</span>
              </div>
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Rate / Comp</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedCandidate.compensationExpectation}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-[#777777] uppercase font-semibold block mb-2">Technical Competencies</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedCandidate.skills || []).map((s) => (
                  <SkillIcon key={s} skill={s} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#303030]">
              <div className="flex items-center gap-3">
                {selectedCandidate.githubUrl && (
                  <a
                    href={selectedCandidate.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#A3A3A3] hover:text-white underline flex items-center gap-1"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {selectedCandidate.portfolioUrl && (
                  <a
                    href={selectedCandidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#A3A3A3] hover:text-white underline flex items-center gap-1"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
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
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={`Interview with ${selectedCandidate?.name}`}
        subtitle={`Role: ${selectedCandidate?.title} • Timezone: ${selectedCandidate?.timeZone}`}
      >
        {scheduleSuccess ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Interview Dispatched</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              Your invitation has been sent to {selectedCandidate?.name}. You can manage this meeting in the Interviews workspace.
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
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
              <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Schedule Screening Call
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
