import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Briefcase, Check, Clock, Globe } from 'lucide-react';
import SkillIcon from '../common/SkillIcon';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { api } from '../../services/api';

export default function JobsTable({ jobs = [], onJobUpdated, onJobCreated }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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
    if (!newJob.title || !newJob.description) {
      setFormError('Please fill out the job title and description.');
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
  const defaultTableJobs = jobs.length > 0 ? jobs : [
    {
      _id: 'job-001',
      title: 'Front-End Developer',
      department: 'Engineering',
      requiredSkills: ['Python', 'JavaScript', 'React'],
      minimumExperience: 6,
      employmentType: 'Full-time',
      status: 'Open'
    },
    {
      _id: 'job-002',
      title: 'Front-End Developer',
      department: 'Engineering',
      requiredSkills: ['Python', 'JavaScript', 'React'],
      minimumExperience: 6,
      employmentType: 'Full-time',
      status: 'Trial'
    },
    {
      _id: 'job-003',
      title: 'Front-End Developer',
      department: 'Engineering',
      requiredSkills: ['Python', 'JavaScript', 'React'],
      minimumExperience: 6,
      employmentType: 'Full-time',
      status: 'Fulfilled'
    }
  ];

  return (
    <div className="bg-[#171717] border border-[#303030] rounded-3xl p-6 shadow-sm">
      {/* Table Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#303030] mb-5 gap-3">
        <div>
          <span className="text-xs text-[#777777] font-medium block">
            These are all
          </span>
          <h3 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            Your job
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
            <tr className="border-b border-[#303030] text-[11px] font-semibold text-[#777777]">
              <th className="pb-3.5 pl-3 font-normal">Info</th>
              <th className="pb-3.5 px-3 font-normal">Skills</th>
              <th className="pb-3.5 px-3 font-normal">Experience</th>
              <th className="pb-3.5 px-3 font-normal">Commit.</th>
              <th className="pb-3.5 px-3 font-normal">Status</th>
              <th className="pb-3.5 pr-3 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202020] text-xs">
            {defaultTableJobs.map((job) => (
              <tr
                key={job._id}
                className="hover:bg-[#202020] transition-colors duration-150 group"
              >
                {/* Info Column */}
                <td className="py-4 pl-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#A3A3A3] shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#F5F5F5] text-xs group-hover:text-white transition-colors">
                        {job.title}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Skills Column with icons */}
                <td className="py-4 px-3">
                  <div className="flex items-center gap-1.5">
                    {(job.requiredSkills || ['Python', 'JavaScript', 'React']).slice(0, 3).map((skill) => (
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
                {selectedJob.description || 'Core engineering role responsible for architecting and shipping features in full synchronization with US engineering team.'}
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
                <p className="text-xs font-bold text-[#F5F5F5] mt-1">{selectedJob.budgetRange || '$4,500 - $5,500/mo'}</p>
                <p className="text-[11px] text-[#A3A3A3] mt-0.5">{selectedJob.timeZoneOverlapRequirements || 'EST +/- 2 hrs'}</p>
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
      </Modal>

      {/* Post New Job Modal */}
      <Modal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        title="Post New Engineering Requisition"
        subtitle="Create an active position to receive calibrated LatAm engineer shortlists."
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#F87171]">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Full-Stack Engineer"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
            />
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
              placeholder="React, TypeScript, Node.js"
              className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Budget Range (Monthly USD)</label>
              <input
                type="text"
                value={newJob.budgetRange}
                onChange={(e) => setNewJob({ ...newJob, budgetRange: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
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
            <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Description & Requirements</label>
            <textarea
              rows={3}
              required
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              placeholder="Detail the technical responsibilities and goals..."
              className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
            <Button variant="ghost" size="sm" onClick={() => setShowNewJobModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={createLoading}>
              Create Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
