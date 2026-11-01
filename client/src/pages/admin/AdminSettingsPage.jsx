import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Shield,
  Save,
  RefreshCw,
  Lock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState({
    allowCompanyRegistration: true,
    requireJobModeration: false,
    defaultCandidateReviewPeriodDays: 14,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const isOwner = currentUser?.adminRole === 'owner';

  const fetchSettings = async () => {
    setLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await api.getAdminSettings();
      if (res.success && res.settings) {
        setSettings({
          allowCompanyRegistration: res.settings.allowCompanyRegistration ?? true,
          requireJobModeration: res.settings.requireJobModeration ?? false,
          defaultCandidateReviewPeriodDays: res.settings.defaultCandidateReviewPeriodDays ?? 14,
          maintenanceMode: res.settings.maintenanceMode ?? false
        });
      }
    } catch (err) {
      setFeedback({ text: err.message || 'Failed to load platform settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setFeedback({ text: '', type: '' });

    try {
      const res = await api.updateAdminSettings(settings);
      if (res.success) {
        setFeedback({ text: 'Platform configuration updated and audited.', type: 'success' });
      }
    } catch (err) {
      setFeedback({ text: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-medium">Loading platform configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>Platform Administrative Settings</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global governance policies, registration gateways, and candidate application review policies.
          </p>
        </div>

        {!isOwner && (
          <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Owner Authorization Required</span>
          </div>
        )}
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-6">
        {/* Registration Gating */}
        <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
          <div className="space-y-0.5 max-w-lg">
            <label className="text-sm font-medium text-white block">Allow Company Self-Registration</label>
            <p className="text-xs text-zinc-400">
              When enabled, new organizations can create employer accounts. When disabled, organizations require operational pre-approval.
            </p>
          </div>
          <input
            type="checkbox"
            disabled={!isOwner}
            checked={settings.allowCompanyRegistration}
            onChange={(e) => setSettings({ ...settings, allowCompanyRegistration: e.target.checked })}
            className="w-4 h-4 rounded bg-[#1F1F1F] border-zinc-700 text-emerald-600 focus:ring-emerald-500"
          />
        </div>

        {/* Pre-publication Job Moderation */}
        <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
          <div className="space-y-0.5 max-w-lg">
            <label className="text-sm font-medium text-white block">Enforce Mandatory Job Pre-Approval</label>
            <p className="text-xs text-zinc-400">
              Require newly created jobs from unverified companies to receive explicit operations approval before publishing to candidates.
            </p>
          </div>
          <input
            type="checkbox"
            disabled={!isOwner}
            checked={settings.requireJobModeration}
            onChange={(e) => setSettings({ ...settings, requireJobModeration: e.target.checked })}
            className="w-4 h-4 rounded bg-[#1F1F1F] border-zinc-700 text-emerald-600 focus:ring-emerald-500"
          />
        </div>

        {/* Candidate Review Window */}
        <div className="flex items-center justify-between pb-6 border-b border-[#222222]">
          <div className="space-y-0.5 max-w-lg">
            <label className="text-sm font-medium text-white block">Default Candidate Review Window (Days)</label>
            <p className="text-xs text-zinc-400">
              Standard SLA window before pending candidate applications are highlighted in operations oversight.
            </p>
          </div>
          <input
            type="number"
            min={1}
            max={60}
            disabled={!isOwner}
            value={settings.defaultCandidateReviewPeriodDays}
            onChange={(e) => setSettings({ ...settings, defaultCandidateReviewPeriodDays: Number(e.target.value) })}
            className="w-20 bg-[#1F1F1F] border border-[#303030] rounded-lg p-2 text-xs text-center text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Maintenance Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 max-w-lg">
            <label className="text-sm font-medium text-white block">Platform Maintenance Mode</label>
            <p className="text-xs text-zinc-400">
              Restricts platform mutations to administrative operators during major system maintenance.
            </p>
          </div>
          <input
            type="checkbox"
            disabled={!isOwner}
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="w-4 h-4 rounded bg-[#1F1F1F] border-zinc-700 text-emerald-600 focus:ring-emerald-500"
          />
        </div>

        {/* Save button */}
        {isOwner && (
          <div className="pt-4 border-t border-[#222222] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Persisting...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
