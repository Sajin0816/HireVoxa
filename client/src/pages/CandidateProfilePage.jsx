import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Save, UserRound } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';
import FieldError from '../components/common/FieldError';
import { getInputErrorClass, focusFirstError } from '../utils/validation';

const emptyProfile = {
  name: '',
  title: '',
  headline: '',
  summary: '',
  country: '',
  city: '',
  location: '',
  timeZone: '',
  skills: [],
  yearsOfExperience: 0,
  seniority: '',
  availability: 'Immediate',
  employmentPreference: 'Any',
  desiredRole: '',
  desiredEmploymentType: '',
  desiredCompensation: '',
  startDate: '',
  portfolioUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  compensationExpectation: ''
};

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [skillsText, setSkillsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const nameInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    api.getMyProfile()
      .then((res) => {
        setProfile({ ...emptyProfile, ...res.data });
        setSkillsText((res.data?.skills || []).join(', '));
      })
      .catch((err) => setFeedback({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!profile.name?.trim()) {
      errs.name = 'Please enter your professional name.';
    }
    if (!profile.title?.trim()) {
      errs.title = 'Please enter your professional title.';
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstError(errs, { name: nameInputRef, title: titleInputRef });
      return;
    }

    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.updateMyProfile({
        ...profile,
        skills: skillsText.split(',').map((skill) => skill.trim()).filter(Boolean)
      });
      setProfile({ ...emptyProfile, ...res.data });
      setSkillsText((res.data?.skills || []).join(', '));
      setFeedback({ type: 'success', text: 'Your profile is saved.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Unable to save your profile.' });
    } finally {
      setSaving(false);
    }
  };

  const input = (field, label, type = 'text', placeholder = '', ref = null) => {
    const hasError = !!fieldErrors[field];
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">{label}</span>
        <input
          id={`profile-${field}`}
          ref={ref}
          type={type}
          value={profile[field] ?? ''}
          onChange={(e) => set(field, type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `profile-${field}-error` : undefined}
          className={`w-full rounded-xl border ${getInputErrorClass(
            hasError,
            'border-[#303030] bg-[#202020] focus:border-[#666666]',
            'border-[#EF4444]/60 bg-[#202020] focus:border-[#EF4444]'
          )} px-3.5 py-2.5 text-sm text-[#F5F5F5] outline-none transition-colors`}
        />
        <FieldError id={`profile-${field}-error`} error={fieldErrors[field]} />
      </label>
    );
  };

  if (loading) return <div className="py-20 text-center text-sm text-[#777777]">Loading your profile…</div>;

  return (
    <form noValidate onSubmit={save} className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#777777]">Professional profile</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Tell teams what you do best.</h1>
          <p className="mt-2 text-sm text-[#A3A3A3]">Only information you choose to save is used for job matching and applications.</p>
        </div>
        <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] px-4 py-3 text-right">
          <p className="text-2xl font-bold">{profile.completeness || 0}%</p>
          <p className="text-xs text-[#888888]">profile complete</p>
        </div>
      </div>

      {feedback.text && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-sm ${
            feedback.type === 'error'
              ? 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#F87171]'
              : 'border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]'
          }`}
        >
          {feedback.type !== 'error' && <CheckCircle2 className="h-4 w-4" />}
          {feedback.text}
        </div>
      )}

      <section className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 sm:p-6">
        <div className="flex items-center gap-3 border-b border-[#303030] pb-5">
          <UserRound className="h-5 w-5 text-[#A3A3A3]" />
          <div>
            <h2 className="font-semibold">Core information</h2>
            <p className="text-xs text-[#777777]">The essentials recruiters use to understand your fit.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {input('name', 'Professional name', 'text', 'Your name', nameInputRef)}
          {input('title', 'Professional title', 'text', 'Senior Frontend Engineer', titleInputRef)}
          {input('headline', 'Headline', 'text', 'React engineer building reliable products')}
          {input('yearsOfExperience', 'Years of experience', 'number', '0')}
          {input('country', 'Country or region', 'text', 'Colombia')}
          {input('city', 'City (optional)', 'text', 'Medellín')}
          {input('timeZone', 'Timezone / work-hour overlap', 'text', 'UTC-5 / EST overlap')}
          {input('seniority', 'Seniority', 'text', 'Senior')}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">Availability</span>
            <select
              value={profile.availability || ''}
              onChange={(e) => set('availability', e.target.value)}
              className="w-full rounded-xl border border-[#303030] bg-[#202020] px-3.5 py-2.5 text-sm text-[#F5F5F5] outline-none"
            >
              <option>Immediate</option>
              <option>2 Weeks</option>
              <option>1 Month</option>
              <option>More than 1 Month</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">Preferred employment</span>
            <select
              value={profile.employmentPreference || ''}
              onChange={(e) => set('employmentPreference', e.target.value)}
              className="w-full rounded-xl border border-[#303030] bg-[#202020] px-3.5 py-2.5 text-sm text-[#F5F5F5] outline-none"
            >
              <option>Any</option>
              <option>Full-Time</option>
              <option>Contract</option>
              <option>Part-Time</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">Technical skills</span>
          <input
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="w-full rounded-xl border border-[#303030] bg-[#202020] px-3.5 py-2.5 text-sm text-[#F5F5F5] outline-none focus:border-[#666666]"
          />
          <span className="mt-1.5 block text-[11px] text-[#777777]">Separate skills with commas.</span>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-[#A3A3A3]">Professional summary</span>
          <textarea
            value={profile.summary || ''}
            onChange={(e) => set('summary', e.target.value)}
            rows={5}
            placeholder="Briefly describe your experience, strengths, and the work you want to do."
            className="w-full resize-y rounded-xl border border-[#303030] bg-[#202020] px-3.5 py-2.5 text-sm leading-6 text-[#F5F5F5] outline-none focus:border-[#666666]"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 sm:p-6">
        <h2 className="font-semibold">Opportunity preferences</h2>
        <p className="mt-1 text-xs text-[#777777]">These details help us show relevant roles. They are optional.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {input('desiredRole', 'Desired role', 'text', 'Staff Frontend Engineer')}
          {input('desiredEmploymentType', 'Desired employment type', 'text', 'Full-Time')}
          {input('desiredCompensation', 'Compensation preference', 'text', '$5,000–$7,000 / month')}
          {input('startDate', 'Earliest start date', 'text', 'June 2026')}
          {input('portfolioUrl', 'Portfolio URL')}
          {input('githubUrl', 'GitHub URL')}
          {input('linkedinUrl', 'LinkedIn URL')}
          {input('compensationExpectation', 'Additional compensation context')}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={saving} icon={Save}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
