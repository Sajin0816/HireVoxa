import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ search: '', employmentType: '', skill: '', page: 1 });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getJobs({ ...filters, limit: 12 }).then((res) => { if (active) { setJobs(res.data || []); setPagination(res.pagination); } }).catch((err) => active && setError(err.message || 'Unable to load jobs.')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  return <div className="space-y-7">
    <div><p className="text-xs uppercase tracking-[0.2em] text-[#777777]">Marketplace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Find your next role.</h1><p className="mt-2 text-sm text-[#A3A3A3]">Browse published engineering opportunities with real requirements and timezone expectations.</p></div>
    <div className="grid gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 md:grid-cols-[1fr_180px_180px]">
      <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" /><input value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search titles, skills, or descriptions" className="w-full rounded-xl border border-[#303030] bg-[#202020] py-2.5 pl-10 pr-3 text-sm text-[#F5F5F5] outline-none focus:border-[#666666]" /></label>
      <select value={filters.employmentType} onChange={(e) => updateFilter('employmentType', e.target.value)} className="rounded-xl border border-[#303030] bg-[#202020] px-3 py-2.5 text-sm text-[#D4D4D4] outline-none"><option value="">All employment types</option><option>Full-Time</option><option>Contract</option><option>Part-Time</option></select>
      <input value={filters.skill} onChange={(e) => updateFilter('skill', e.target.value)} placeholder="Filter by skill" className="rounded-xl border border-[#303030] bg-[#202020] px-3 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-[#666666]" />
    </div>
    {error && <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#F87171]">{error}</div>}
    {loading ? <div className="py-16 text-center text-sm text-[#777777]">Loading published roles…</div> : jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-[#404040] p-12 text-center"><SlidersHorizontal className="mx-auto h-6 w-6 text-[#777777]" /><p className="mt-3 text-sm font-semibold">No published roles match these filters.</p><p className="mt-1 text-xs text-[#777777]">Try a broader search or check back soon.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{jobs.map((job) => <Link to={`/candidate/jobs/${job._id}`} key={job._id} className="group rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 transition-colors hover:border-[#606060]"><div className="flex items-start justify-between gap-4"><div><Badge variant="open" size="sm">Published</Badge><h2 className="mt-3 text-lg font-semibold group-hover:text-white">{job.title}</h2><p className="mt-1 text-xs text-[#888888]">{job.department} · {job.locationRequirement || 'Remote'} · {job.employmentType}</p></div><ArrowRight className="h-4 w-4 text-[#777777] transition-transform group-hover:translate-x-1" /></div><p className="mt-4 line-clamp-2 text-sm leading-6 text-[#A3A3A3]">{job.description}</p><div className="mt-4 flex flex-wrap gap-2">{(job.requiredSkills || []).slice(0, 5).map((skill) => <span key={skill} className="rounded-full border border-[#303030] bg-[#202020] px-2.5 py-1 text-[11px] text-[#B5B5B5]">{skill}</span>)}</div><div className="mt-5 flex items-center justify-between border-t border-[#303030] pt-4 text-xs text-[#888888]"><span>{job.minimumExperience || 0}+ years experience</span><span>{job.timeZoneOverlapRequirements || 'Timezone details provided in role'}</span></div></Link>)}</div>}
    {pagination?.pages > 1 && <div className="flex items-center justify-center gap-3"><button disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="rounded-full border border-[#303030] px-4 py-2 text-xs disabled:opacity-40">Previous</button><span className="text-xs text-[#888888]">Page {pagination.page} of {pagination.pages}</span><button disabled={filters.page >= pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="rounded-full border border-[#303030] px-4 py-2 text-xs disabled:opacity-40">Next</button></div>}
  </div>;
}
