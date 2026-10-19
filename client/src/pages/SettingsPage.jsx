import React, { useState } from 'react';
import { Settings, Shield, Bell, User, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || 'Richard Feynman',
    email: user?.email || 'richardfeynman@gmail.com',
    company: user?.companyName || 'Acme Technologies',
    role: user?.role === 'candidate' ? 'Software Engineer' : 'Engineering Director'
  });

  const [notifications, setNotifications] = useState({
    newCandidates: true,
    interviewReminders: true,
    weeklyReport: false
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#303030]">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#F5F5F5]" />
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Platform Settings</h1>
        </div>
        <p className="text-xs text-[#777777] mt-1">
          Configure recruitment workspace preferences, team details, and notification alerts.
        </p>
      </div>

      {savedNotice && (
        <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/30 rounded-2xl flex items-center gap-2 text-xs text-[#10B981]">
          <CheckCircle2 className="w-4 h-4" />
          <span>Workspace preferences saved successfully.</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#F5F5F5]" />
          <span>Account Profile</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-4 max-w-xl text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Display Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              />
            </div>
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Work Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Company Name</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              />
            </div>
            <div>
              <label className="block text-[#A3A3A3] mb-1 font-medium">Role / Department</label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="sm">
              Save Account Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F5F5F5]" />
          <span>Notification Alerts</span>
        </h3>

        <div className="space-y-3 max-w-xl text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] border border-[#303030] hover:border-[#404040] cursor-pointer transition-colors">
            <div>
              <p className="font-semibold text-[#F5F5F5]">New Candidate Recommendations</p>
              <p className="text-[#777777] text-[11px]">Instant alert when a candidate matches above 8.0</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newCandidates}
              onChange={(e) => setNotifications({ ...notifications, newCandidates: e.target.checked })}
              className="w-4 h-4 accent-[#10B981]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#202020] border border-[#303030] hover:border-[#404040] cursor-pointer transition-colors">
            <div>
              <p className="font-semibold text-[#F5F5F5]">Interview Confirmations & Updates</p>
              <p className="text-[#777777] text-[11px]">Calendar dispatch and rescheduling alerts</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.interviewReminders}
              onChange={(e) => setNotifications({ ...notifications, interviewReminders: e.target.checked })}
              className="w-4 h-4 accent-[#10B981]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
