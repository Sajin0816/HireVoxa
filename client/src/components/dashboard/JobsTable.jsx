import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Briefcase, AlertCircle } from 'lucide-react';
import SkillIcon from '../common/SkillIcon';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { api } from '../../services/api';

export default function JobsTable({ jobs = [], onJobUpdated, onJobCreated }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [modalFieldErrors, setModalFieldErrors] = useState({});

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    requiredSkills: 'React, TypeScript, Node.js',
    minimumExperience: 4,
    employmentType: 'Full-Time',
    budgetRange: '$4,500 - $5,500/mo',
    timeZoneOverlapRequirements: 'EST +/- 2 hours',
    description: '',
    status: 'Open'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleStatusChange = async (jobId, newStatus) => {
    setStatusUpdating(true);
    try {
      await api.updateJob(jobId, { status: newStatus });
      if (selectedJob) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
      if (onJobUpdated) onJobUpdated();
    } catch (err) {
      console.warn('Job status update fallback:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newJob.title.trim()) {
      errs.title = 'Please enter the job title.';
    }
    if (!newJob.description.trim()) {
      errs.description = 'Please enter role description and requirements.';
    }
    setModalFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.title) {
        titleInputRef.current?.focus();
      } else if (errs.description) {
        descInputRef.current?.focus();
      }
      return;
    }

    setFormError('');
    setCreateLoading(true);

    try {
      const skillsArray = typeof newJob.requiredSkills === 'string'
        ? newJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : newJob.requiredSkills;

      await api.createJob({
        ...newJob,
        requiredSkills: skillsArray
      });
      setShowNewJobModal(false);
      setNewJob({
        title: '',
        department: 'Engineering',
        requiredSkills: 'React, TypeScript, Node.js',
        minimumExperience: 4,
        employmentType: 'Full-Time',
        budgetRange: '$4,500 - $5,500/mo',
        timeZoneOverlapRequirements: 'EST +/- 2 hours',
        description: '',
        status: 'Open'
      });
      if (onJobCreated) onJobCreated();
    } catch (err) {
      setFormError(err.message || 'Failed to create job posting');
    } finally {
      setCreateLoading(false);
    }
  };

  // Format skills to show Python, JS, React cleanly
  const tableJobs = jobs;

  return (
    <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 shadow-sm">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#303030] mb-5 gap-3">
        <div>
          <span className="text-xs text-[#A3A3A3] font-medium block">
            Open Requisitions
          </span>
          <h3 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            Active Job Positions
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setShowNewJobModal(true)}
            className="text-xs font-semibold"
          >
            Post Job
          </Button>
          <Link
            to="/app/jobs"
            className="text-xs font-semibold text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#303030] text-xs font-semibold text-[#8E8E8E] uppercase tracking-wider">
              <th className="pb-3.5 pl-3 font-medium">Info</th>
              <th className="pb-3.5 px-3 font-medium">Skills</th>
              <th className="pb-3.5 px-3 font-medium">Experience</th>
              <th className="pb-3.5 px-3 font-medium">Commit.</th>
              <th className="pb-3.5 px-3 font-medium">Status</th>
              <th className="pb-3.5 pr-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202020] text-sm">
            {tableJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-xs text-[#777777]">
                  No persisted job requisitions yet.
                </td>
              </tr>
            ) : tableJobs.map((job) => (
              <tr
                key={job._id}
                className="hover:bg-[#202020] transition-colors duration-150 group"
              >
                {/* Info Column */}
                <td className="py-4 pl-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#A3A3A3] shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#F5F5F5] text-sm group-hover:text-white transition-colors">
                        {job.title}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Skills Column with icons */}
                <td className="py-4 px-3">
                  <div className="flex items-center gap-1.5">
                    {(job.requiredSkills || []).slice(0, 3).map((skill) => (
                      <SkillIcon key={skill} skill={skill} iconOnly={true} />
                    ))}
                  </div>
                </td>

                {/* Experience Column */}
                <td className="py-4 px-3 text-[#D4D4D4] font-medium">
                  {job.minimumExperience >= 6
                    ? 'Expert'
                    : job.minimumExperience >= 4
                    ? 'Senior'
                    : 'Intermediate'}
                </td>

                {/* Commit Column */}
                <td className="py-4 px-3 text-[#A3A3A3]">
                  {job.employmentType || 'Full-time'}
                </td>

                {/* Status Badge */}
                <td className="py-4 px-3">
                  <Badge variant={job.status}>{job.status}</Badge>
                </td>

                {/* Action Column */}
                <td className="py-4 pr-3 text-right">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#202020] hover:bg-[#282828] border border-[#303030] text-[11px] font-semibold text-[#D4D4D4] hover:text-[#FFFFFF] transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View details</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Job Requisition'}
        subtitle={`Department: ${selectedJob?.department || 'Engineering'} • ID: ${selectedJob?._id}`}
      >
        {selectedJob && (
          <div className="space-y-5">
            <div>
              <span className="text-xs text-[#777777] block mb-1">Status Workflow</span>
              <div className="flex flex-wrap gap-2">
                {['Open', 'Trial', 'Fulfilled', 'On Hold', 'Draft'].map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating}
                    onClick={() => handleStatusChange(selectedJob._id, st)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      selectedJob.status === st
                        ? 'bg-[#F5F5F5] text-[#090909]'
                        : 'bg-[#202020] text-[#A3A3A3] border border-[#303030] hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-[#777777] block mb-1">Role Description</span>
              <p className="text-xs text-[#D4D4D4] leading-relaxed bg-[#202020] p-3 rounded-xl border border-[#303030]">
                {selectedJob.description || 'No role description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Required Competencies</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(selectedJob.requiredSkills || []).map((s) => (
                    <SkillIcon key={s} skill={s} />
                  ))}
                </div>
              </div>
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Budget & Timezone</span>
                <p className="text-xs font-bold text-[#F5F5F5] mt-1">{selectedJob.budgetRange || 'Not provided'}</p>
                <p className="text-[11px] text-[#A3A3A3] mt-0.5">{selectedJob.timeZoneOverlapRequirements || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Link to={`/app/recommended`}>
                <Button variant="primary" size="sm">
                  View Matching Candidates
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>      {/* Post New Job Modal */}
      <Modal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        title="Post New Engineering Requisition"
        subtitle="Create a new opening to match with vetted software engineers."
      >
        <form noValidate onSubmit={handleCreateJob} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#F87171]">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="new-job-title" className="block text-xs font-medium text-[#A3A3A3] mb-1">Job Title</label>
            <input
              id="new-job-title"
              ref={titleInputRef}
              type="text"
              placeholder="Role title (e.g., Senior Full-Stack Engineer)"
              value={newJob.title}
              onChange={(e) => {
                setNewJob({ ...newJob, title: e.target.value });
                if (modalFieldErrors.title) setModalFieldErrors((prev) => ({ ...prev, title: '' }));
              }}
              aria-invalid={!!modalFieldErrors.title}
              aria-describedby={modalFieldErrors.title ? 'job-title-error' : undefined}
              className={`w-full bg-[#202020] border ${
                modalFieldErrors.title ? 'border-[#EF4444]/60 focus:border-[#EF4444]' : 'border-[#303030] focus:border-[#777777]'
              } rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
            />
            {modalFieldErrors.title && (
              <p id="job-title-error" className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalFieldErrors.title}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Department</label>
              <input
                type="text"
                value={newJob.department}
                onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Min. Experience (Years)</label>
              <input
                type="number"
                min={0}
                value={newJob.minimumExperience}
                onChange={(e) => setNewJob({ ...newJob, minimumExperience: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Required Skills (comma separated)</label>
            <input
              type="text"
              value={newJob.requiredSkills}
              onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
              placeholder="List required skills (e.g., React, TypeScript, Node.js)"
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Budget Range (Monthly USD)</label>
              <input
                type="text"
                value={newJob.budgetRange}
                onChange={(e) => setNewJob({ ...newJob, budgetRange: e.target.value })}
                placeholder="e.g., $4,000 - $5,500/mo"
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Employment Type</label>
              <select
                value={newJob.employmentType}
                onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Contract">Contract</option>
                <option value="Part-Time">Part-Time</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="new-job-desc" className="block text-xs font-medium text-[#A3A3A3] mb-1">Description & Requirements</label>
            <textarea
              id="new-job-desc"
              ref={descInputRef}
              rows={3}
              value={newJob.description}
              onChange={(e) => {
                setNewJob({ ...newJob, description: e.target.value });
                if (modalFieldErrors.description) setModalFieldErrors((prev) => ({ ...prev, description: '' }));
              }}
              aria-invalid={!!modalFieldErrors.description}
              aria-describedby={modalFieldErrors.description ? 'job-desc-error' : undefined}
              placeholder="Describe role responsibilities, team structure, and technical requirements..."
              className={`w-full bg-[#202020] border ${
                modalFieldErrors.description ? 'border-[#EF4444]/60 focus:border-[#EF4444]' : 'border-[#303030] focus:border-[#777777]'
              } rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
            />
            {modalFieldErrors.description && (
              <p id="job-desc-error" className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalFieldErrors.description}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
            <Button variant="ghost" size="sm" onClick={() => setShowNewJobModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={createLoading}>
              Publish Position
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
