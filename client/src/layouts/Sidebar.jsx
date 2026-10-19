import React from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, counts = {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      badge: counts.recommendations ? `${counts.recommendations}` : '9+'
    },
    {
      name: 'Jobs',
      path: '/app/jobs',
      icon: Briefcase,
      badge: counts.jobs ? `${counts.jobs}` : '4'
    },
    {
      name: 'Talents',
      path: '/app/talents',
      icon: Users,
      badge: counts.talents ? `${counts.talents}` : '9'
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
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#202020] text-[#FFFFFF] border border-[#303030]'
                    : 'text-[#8E8E8E] hover:text-[#EDEDED] hover:bg-[#171717]'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#171717] text-[#A3A3A3] font-bold border border-[#303030]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Workspace Hub Secondary Links */}
        {!collapsed && (
          <div className="px-5 mt-6 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#555555]">
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
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#202020] text-white border border-[#303030]'
                    : 'text-[#777777] hover:text-[#D4D4D4] hover:bg-[#171717]'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[#303030] space-y-1.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#777777] hover:text-[#FFFFFF] hover:bg-[#171717] transition-colors"
          title={collapsed ? "Public Landing Page" : undefined}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Public Marketing Site</span>}
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors"
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
