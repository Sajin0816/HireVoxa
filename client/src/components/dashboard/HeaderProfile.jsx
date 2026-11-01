import React, { useState } from 'react';
import { Bell, ArrowRight, CheckCircle2, PhoneCall } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

export default function HeaderProfile() {
  const { user } = useAuth();
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [callBooked, setCallBooked] = useState(false);

  const profile = {
    name: user?.name || 'Hiring Lead',
    email: user?.email || 'employer@hirevoxa.com',
    role: user?.companyName ? `${user.companyName} • Hiring Lead` : 'Employer Workspace',
    joinedDate: user?.joinedDate || 'Active Member',
    avatar: user?.avatar || null
  };

  const ae = user?.accountExecutive;
  const notifications = [];

  const getInitials = (name) => {
    if (!name) return 'HL';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="relative bg-[#171717] border border-[#303030] rounded-3xl p-5 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
      {/* Left: User Avatar & Details */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-14 h-14 rounded-2xl object-cover border border-[#303030] shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#262626] border border-[#303030] shadow-md flex items-center justify-center text-base font-bold text-[#F5F5F5] select-none">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-[#171717] rounded-full" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight">{profile.name}</h2>
          <p className="text-sm text-[#A3A3A3] mt-0.5">{profile.email}</p>
        </div>
      </div>

      {/* Right Controls matching screenshot: AE box, Schedule Call, Bell, Joined Date */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
        {/* Account Executive Pill Box */}
        {ae?.name && <div className="flex items-center gap-3 bg-[#202020] border border-[#303030] px-3.5 py-2 rounded-2xl">
          <img
            src={ae.avatar}
            alt={ae.name}
            className="w-9 h-9 rounded-xl object-cover border border-[#303030]"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-[#F5F5F5] leading-snug">{ae.name}</p>
            <p className="text-xs text-[#8E8E8E] mt-0.5 leading-none">{ae.role}</p>
          </div>
        </div>}

        {/* Schedule Call Button */}
        {ae?.name && <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCallModal(true)}
          icon={ArrowRight}
          iconPosition="right"
          className="text-sm font-semibold px-4 py-2"
        >
          Schedule Call
        </Button>}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-full bg-[#202020] border border-[#303030] hover:bg-[#282828] flex items-center justify-center text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#10B981] rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#202020] border border-[#303030] rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#303030]">
                <span className="text-xs font-semibold text-[#F5F5F5]">Notifications</span>
            <span className="text-[10px] text-[#777777] font-mono">{notifications.length} updates</span>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? <p className="p-3 text-xs text-[#777777]">No new notifications.</p> : notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#171717] hover:bg-[#282828] text-xs transition-colors border border-[#303030]">
                    <p className="font-semibold text-[#F5F5F5]">{n.title}</p>
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5">{n.detail}</p>
                    <span className="text-[9px] text-[#777777] mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Joined Date */}
        <div className="text-[11px] text-[#777777] pl-1 font-medium whitespace-nowrap">
          Joined Date: <span className="text-[#A3A3A3]">{profile.joinedDate}</span>
        </div>
      </div>

      {/* Schedule Call Modal */}
      <Modal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setCallBooked(false);
        }}
        title={`Schedule Strategy Call with ${ae.name}`}
        subtitle="Dedicated Hirevoxa Account Executive"
      >
        {callBooked ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Strategy Call Booked!</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              {ae.name} has been notified and a calendar invitation for your 30-minute requisition sync will be sent to your email.
            </p>
            <Button
              className="mt-6"
              variant="primary"
              onClick={() => {
                setShowCallModal(false);
                setCallBooked(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCallBooked(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Topic for Call</label>
              <select className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]">
                <option>New Engineering Requisition Kickoff</option>
                <option>Reviewing LatAm Candidate Shortlist</option>
                <option>Custom Technical Assessment Calibration</option>
                <option>Contractor Invoicing & Compliance Sync</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Preferred Date</label>
                <input
                  type="date"
                  defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Time Slot (EST)</label>
                <select className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]">
                  <option>10:00 AM - 10:30 AM EST</option>
                  <option>01:00 PM - 01:30 PM EST</option>
                  <option>03:30 PM - 04:00 PM EST</option>
                  <option>05:00 PM - 05:30 PM EST</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Notes / Roles to discuss</label>
              <textarea
                rows={3}
                placeholder="Share any specific role priorities, required skills, or team timezone preferences..."
                className="w-full bg-[#202020] border border-[#303030] rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCallModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={PhoneCall}>
                Confirm Requisition Call
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
