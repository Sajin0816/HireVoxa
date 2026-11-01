import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Search, Plus, Eye, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import SkillIcon from '../components/common/SkillIcon';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import FieldError from '../components/common/FieldError';
import { getInputErrorClass, focusFirstError } from '../utils/validation';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Input refs for accessibility focus
  const titleRef = useRef(null);
  const skillsRef = useRef(null);
  const descRef = useRef(null);

  // New Job Form
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    requiredSkills: '',
    minimumExperience: 4,
    employmentType: 'Full-Time',
    budgetRange: '$4,500 - $5,500/mo',
    timeZoneOverlapRequirements: 'EST +/- 2 hours',
    description: '',
    status: 'Open'
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.employmentType = typeFilter;
      const res = await api.getJobs(params);
      setJobs(res?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load persisted jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter, typeFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await api.updateJob(jobId, { status: newStatus });
      fetchJobs();
      if (selectedJob) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.warn('Status update failed:', err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to remove this job requisition?')) return;
    try {
      await api.deleteJob(jobId);
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      console.warn('Delete job failed:', err);
    }
  };

  const validateCreate = () => {
    const errs = {};
    if (!newJob.title?.trim()) {
      errs.title = 'Please enter a job title.';
    }
    if (!newJob.requiredSkills?.trim()) {
      errs.requiredSkills = 'Please list required skills.';
    }
    if (!newJob.description?.trim()) {
      errs.description = 'Please enter a job description.';
    }
    return errs;
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const errs = validateCreate();
    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      focusFirstError(errs, {
        title: titleRef,
        requiredSkills: skillsRef,
        description: descRef
      });
      return;
    }

    setCreateLoading(true);
    try {
      const skillsArray = typeof newJob.requiredSkills === 'string'
        ? newJob.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : newJob.requiredSkills;

      await api.createJob({
        ...newJob,
        requiredSkills: skillsArray
      });
      setCreateSuccess(true);
      setFieldErrors({});
      fetchJobs();
      setNewJob({
        title: '',
        department: 'Engineering',
        requiredSkills: '',
        minimumExperience: 4,
        employmentType: 'Full-Time',
        budgetRange: '$4,500 - $5,500/mo',
        timeZoneOverlapRequirements: 'EST +/- 2 hours',
        description: '',
        status: 'Open'
      });
    } catch (err) {
      console.warn('Create job failed:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#F5F5F5]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Engineering Requisitions</h1>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Manage your open positions, required skill profiles, and compensation budgets.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setCreateSuccess(false);
            setFieldErrors({});
            setShowCreateModal(true);
          }}
          className="text-xs font-semibold"
        >
          Post New Position
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requisitions by title, skills, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#202020] border border-[#303030] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Trial">Trial</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="On Hold">On Hold</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
          >
            <option value="all">All Employment Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Contract">Contract</option>
            <option value="Part-Time">Part-Time</option>
          </select>
        </div>
      </div>

      {/* Requisitions Grid */}
      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#F87171] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchJobs} className="text-xs shrink-0">
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <div className="py-16 text-center text-[#777777] text-sm">
          Loading active requisitions...
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm bg-[#171717] rounded-3xl border border-[#EF4444]/20 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <p className="text-[#F87171] font-medium">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchJobs}>
            Retry Loading Requisitions
          </Button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center text-[#777777] text-sm bg-[#171717] rounded-3xl border border-[#303030]">
          No jobs found matching your filters. Click "Post New Position" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-[#171717] border border-[#303030] hover:border-[#404040] rounded-3xl p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-[#303030]">
                  <div>
                    <h3 className="font-bold text-base text-[#F5F5F5]">{job.title}</h3>
                    <p className="text-xs text-[#777777]">{job.department || 'Engineering'}</p>
                  </div>
                  <Badge variant={job.status}>{job.status}</Badge>
                </div>

                <p className="text-xs text-[#A3A3A3] mt-3 line-clamp-2 leading-relaxed">
                   {job.description || 'No role description provided.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="default">{job.minimumExperience}+ yrs exp req</Badge>
                  <Badge variant="default">{job.employmentType || 'Full-time'}</Badge>
                   <Badge variant="trial">{job.budgetRange || 'Budget not provided'}</Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-[#303030]">
                  <span className="text-[10px] uppercase font-semibold text-[#777777] tracking-wider block mb-1.5">
                    Required Competencies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(job.requiredSkills || []).map((skill) => (
                      <SkillIcon key={skill} skill={skill} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#303030] flex items-center justify-between">
                <span className="text-[11px] text-[#777777] font-mono">
                   {job.timeZoneOverlapRequirements || 'Timezone details not provided'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => setSelectedJob(job)}
                  className="text-xs"
                >
                  Manage Role
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Requisition Details'}
        subtitle={`Department: ${selectedJob?.department} • ID: ${selectedJob?._id}`}
      >
        {selectedJob && (
          <div className="space-y-5 text-xs">
            <div>
              <span className="text-xs text-[#777777] block mb-1.5">Change Status</span>
              <div className="flex flex-wrap gap-2">
                {['Open', 'Trial', 'Fulfilled', 'On Hold', 'Draft'].map((st) => (
                  <button
                    key={st}
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
              <span className="text-xs text-[#777777] uppercase block mb-1">Role Description</span>
              <p className="text-xs text-[#D4D4D4] leading-relaxed bg-[#202020] p-3 rounded-xl border border-[#303030]">
                {selectedJob.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Budget Benchmark</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedJob.budgetRange}</span>
              </div>
              <div className="p-3 bg-[#202020] rounded-xl border border-[#303030]">
                <span className="text-[10px] text-[#777777] uppercase block">Timezone Alignment</span>
                <span className="text-xs font-bold text-white mt-1 block">{selectedJob.timeZoneOverlapRequirements}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#303030]">
              <button
                onClick={() => handleDeleteJob(selectedJob._id)}
                className="text-xs text-[#EF4444] hover:underline flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Position</span>
              </button>

              <Button variant="secondary" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Position Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Post New Engineering Requisition"
        subtitle="Specify role requirements to activate deterministic matching."
      >
        {createSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Position Published</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              Your requisition has been posted and will immediately rank Latin American candidates in your Recommended workspace.
            </p>
            <Button className="mt-6" variant="primary" onClick={() => setShowCreateModal(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleCreateJob} className="space-y-4">
            <div>
              <label htmlFor="create-job-title" className="block text-xs font-medium text-[#A3A3A3] mb-1">Job Title</label>
              <input
                id="create-job-title"
                ref={titleRef}
                type="text"
                placeholder="e.g. Senior DevOps & Cloud Engineer"
                value={newJob.title}
                onChange={(e) => {
                  setNewJob({ ...newJob, title: e.target.value });
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                }}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? 'create-job-title-error' : undefined}
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.title,
                  'border-[#303030] focus:border-[#777777]'
                )} rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
              <FieldError id="create-job-title-error" error={fieldErrors.title} />
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
              <label htmlFor="create-job-skills" className="block text-xs font-medium text-[#A3A3A3] mb-1">Required Skills (comma separated)</label>
              <input
                id="create-job-skills"
                ref={skillsRef}
                type="text"
                placeholder="Docker, Kubernetes, AWS, Terraform"
                value={newJob.requiredSkills}
                onChange={(e) => {
                  setNewJob({ ...newJob, requiredSkills: e.target.value });
                  if (fieldErrors.requiredSkills) setFieldErrors((prev) => ({ ...prev, requiredSkills: '' }));
                }}
                aria-invalid={!!fieldErrors.requiredSkills}
                aria-describedby={fieldErrors.requiredSkills ? 'create-job-skills-error' : undefined}
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.requiredSkills,
                  'border-[#303030] focus:border-[#777777]'
                )} rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none transition-colors`}
              />
              <FieldError id="create-job-skills-error" error={fieldErrors.requiredSkills} />
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
              <label htmlFor="create-job-desc" className="block text-xs font-medium text-[#A3A3A3] mb-1">Description & Scope</label>
              <textarea
                id="create-job-desc"
                ref={descRef}
                rows={3}
                placeholder="Describe role responsibilities and requirements..."
                value={newJob.description}
                onChange={(e) => {
                  setNewJob({ ...newJob, description: e.target.value });
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
                }}
                aria-invalid={!!fieldErrors.description}
                aria-describedby={fieldErrors.description ? 'create-job-desc-error' : undefined}
                className={`w-full bg-[#202020] border ${getInputErrorClass(
                  fieldErrors.description,
                  'border-[#303030] focus:border-[#777777]'
                )} rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none transition-colors`}
              />
              <FieldError id="create-job-desc-error" error={fieldErrors.description} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#303030]">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={createLoading}>
                Publish Requisition
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
