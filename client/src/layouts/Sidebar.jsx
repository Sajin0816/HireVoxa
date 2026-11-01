import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Video,
  MessageSquare,
  BarChart3,
  FileText,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoutModal from '../components/common/LogoutModal';

export default function Sidebar({ collapsed, setCollapsed, counts = {} }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleOpenLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const primaryNavItems = [
    {
      name: 'Dashboard',
      path: '/app',
      icon: LayoutDashboard,
      end: true
    },
    {
      name: 'Recommended',
      path: '/app/recommended',
      icon: Sparkles,
      badge: counts.recommendations ? `${counts.recommendations}` : ''
    },
    {
      name: 'Jobs',
      path: '/app/jobs',
      icon: Briefcase,
      badge: counts.jobs ? `${counts.jobs}` : ''
    },
    {
      name: 'Applications',
      path: '/app/applications',
      icon: FileText,
      badge: counts.applications ? `${counts.applications}` : ''
    },
    {
      name: 'Talents',
      path: '/app/talents',
      icon: Users,
      badge: counts.talents ? `${counts.talents}` : ''
    },
    {
      name: 'Payment',
      path: '/app/payments',
      icon: CreditCard
    },
    {
      name: 'Settings',
      path: '/app/settings',
      icon: Settings
    }
  ];

  const secondaryNavItems = [
    { name: 'Interviews', path: '/app/interviews', icon: Video },
    { name: 'Calendar', path: '/app/calendar', icon: Calendar },
    { name: 'Messages', path: '/app/messages', icon: MessageSquare },
    { name: 'Reports', path: '/app/reports', icon: BarChart3 }
  ];

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen bg-[#101010] border-r border-[#303030] z-40 transition-all duration-300 flex flex-col justify-between select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Brand Header */}
        <div>
          <div className="flex items-center justify-between px-5 py-6">
            <Link to="/app" className="flex items-center gap-3 overflow-hidden focus:outline-none">
              {collapsed ? (
                <img
                  src="/images/hirevoxa-icon.png"
                  alt="Hirevoxa — Engineering Talent, Amplified"
                  className="w-8 h-8 object-contain shrink-0 transition-transform duration-200 hover:scale-105"
                />
              ) : (
                <img
                  src="/images/hirevoxa-logo.png"
                  alt="Hirevoxa — Engineering Talent, Amplified"
                  className="h-8 max-w-[150px] object-contain shrink-0 transition-opacity duration-200 hover:opacity-90"
                />
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-7 h-7 rounded-lg bg-[#171717] border border-[#303030] hover:bg-[#202020] text-[#A3A3A3] hover:text-[#FFFFFF] flex items-center justify-center transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary Navigation List matching Screenshot */}
          <nav className="px-3 space-y-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                    isActive
                      ? 'bg-[#202020] text-[#FFFFFF] border-[#303030] shadow-sm'
                      : 'border-transparent text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-[#171717] hover:border-[#222222]'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#171717] text-[#A3A3A3] font-bold border border-[#303030]">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Workspace Hub Secondary Links */}
          {!collapsed && (
            <div className="px-5 mt-6 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#666666]">
                Workspace
              </span>
            </div>
          )}
          <div className="px-3 space-y-1">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    isActive
                      ? 'bg-[#202020] text-white border-[#303030] shadow-sm'
                      : 'border-transparent text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-[#171717] hover:border-[#222222]'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-3 border-t border-[#303030] space-y-1.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8E8E8E] hover:text-[#FFFFFF] hover:bg-[#171717] transition-colors"
            title={collapsed ? "Public Landing Page" : undefined}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Public Marketing Site</span>}
          </Link>

          <button
            type="button"
            onClick={handleOpenLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#EF4444]/90 hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Global Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isSubmitting={isLoggingOut}
      />
    </>
  );
}
