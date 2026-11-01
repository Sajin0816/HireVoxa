import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, UserRound, Calendar, Clock } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';

export default function CandidateOverviewPage() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getMyProfile(),
      api.getApplications(),
      api.getJobs({ limit: 4 }),
      api.getInterviews()
    ])
      .then(([profileRes, applicationRes, jobsRes, interviewsRes]) => {
        setProfile(profileRes.data);
        setApplications(applicationRes.data || []);
        setJobs(jobsRes.data || []);
        setInterviews(interviewsRes.data || []);
      })
      .catch((err) => setError(err.message || 'Unable to load your workspace.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-sm text-[#777777]">Loading your workspace…</div>;
  if (error) return <div className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-5 text-sm text-[#F87171]">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#777777]">Candidate workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Build your next opportunity.</h1>
          <p className="mt-2 max-w-xl text-sm text-[#A3A3A3]">
            Keep your professional profile current, discover vetted roles, and follow every application from one private workspace.
          </p>
        </div>
        <Link
          to="/candidate/jobs"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#090909] hover:bg-white"
        >
          Explore jobs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Profile completeness', value: `${profile?.completeness || 0}%`, icon: UserRound, href: '/candidate/profile' },
          { label: 'Active applications', value: applications.filter(a => !['Withdrawn', 'Rejected'].includes(a.status)).length, icon: FileText, href: '/candidate/applications' },
          { label: 'Scheduled interviews', value: interviews.filter(i => ['Pending', 'Confirmed'].includes(i.status)).length, icon: Calendar, href: '/candidate/applications' },
          { label: 'Open roles', value: jobs.length, icon: BriefcaseBusiness, href: '/candidate/jobs' }
        ].map(({ label, value, icon: Icon, href }) => (
          <Link to={href} key={label} className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 hover:border-[#505050]">
            <Icon className="h-5 w-5 text-[#A3A3A3]" />
            <p className="mt-5 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-[#888888]">{label}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming Interviews Card */}
      {interviews.length > 0 && (
        <section className="rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FBBF24]" />
              <h2 className="text-base font-bold text-white">Upcoming Interviews</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {interviews.slice(0, 2).map((int) => (
              <div key={int._id} className="rounded-xl border border-[#303030] bg-[#1B1B1B] p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{int.jobTitle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30">
                    {int.status}
                  </span>
                </div>
                <p className="text-xs text-[#999999] flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-[#777777]" />
                  <span>{new Date(int.proposedDate).toLocaleString()} ({int.timeZone})</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Applications Section */}
      <section className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Recent applications</h2>
            <p className="mt-1 text-xs text-[#888888]">Your current persisted application status.</p>
          </div>
          <Link to="/candidate/applications" className="text-xs font-semibold text-[#D4D4D4] hover:text-white">
            View all
          </Link>
        </div>
        {applications.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#777777]">
            No applications yet. Published roles will appear in Find jobs.
          </div>
        ) : (
          <div className="mt-5 divide-y divide-[#303030]">
            {applications.slice(0, 3).map((application) => (
              <Link
                to={`/candidate/applications/${application._id}`}
                key={application._id}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#202020]/50 rounded-xl px-2"
              >
                <div>
                  <p className="text-sm font-semibold">{application.job?.title || 'Engineering opportunity'}</p>
                  <p className="mt-1 text-xs text-[#777777]">
                    Submitted {new Date(application.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={
                    application.status === 'Rejected'
                      ? 'error'
                      : application.status === 'Hired'
                      ? 'success'
                      : application.status === 'Withdrawn'
                      ? 'default'
                      : 'open'
                  }
                >
                  {application.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
