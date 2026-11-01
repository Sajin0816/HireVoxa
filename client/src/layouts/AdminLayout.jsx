import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GitPullRequest,
  LifeBuoy,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminRole = user?.adminRole || 'owner';

  const roleBadgeConfig = {
    owner: { label: 'Platform Owner', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    ops_admin: { label: 'Operations Admin', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
    analyst: { label: 'Read-only Analyst', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
  };

  const currentBadge = roleBadgeConfig[adminRole] || roleBadgeConfig.owner;

  const navItems = [
    { label: 'Overview', to: '/admin', end: true, icon: LayoutDashboard },
    { label: 'User Management', to: '/admin/users', icon: Users },
    { label: 'Companies & Verification', to: '/admin/companies', icon: Building2 },
    { label: 'Job Moderation', to: '/admin/jobs', icon: Briefcase },
    { label: 'Hiring Oversight', to: '/admin/applications', icon: GitPullRequest },
    { label: 'Revenue & Billing', to: '/admin/billing', icon: DollarSign },
    { label: 'Support & Issues', to: '/admin/support', icon: LifeBuoy },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Reports & Exports', to: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Platform Settings', to: '/admin/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#111111] border-b border-[#262626]">
        <Link to="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-white text-base tracking-wide">Hirevoxa Ops</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop / Mobile */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-[#111111] border-r border-[#262626] flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-[#262626] flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide text-white block">Hirevoxa Ops</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Control Panel</span>
              </div>
            </Link>
          </div>

          {/* Current Admin Tier Badge */}
          <div className="px-5 py-3 border-b border-[#262626]/60 bg-[#161616]">
            <div className="text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
              <span>Security Tier:</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${currentBadge.color}`}>
                {currentBadge.label}
              </span>
            </div>
            <div className="text-xs font-medium text-zinc-200 truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[11px] text-zinc-500 truncate">{user?.email || 'admin@hirevoxa.internal'}</div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      isActive
                        ? 'bg-[#1B1B1B] text-emerald-400 border-emerald-500/20 shadow-sm'
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-[#161616] hover:border-zinc-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#262626] space-y-2">
          <Link
            to="/app"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-[#181818] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Switch to Recruiter App</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-[#090909] min-h-screen flex flex-col">
        {/* Top Operational Status Bar */}
        <header className="h-14 border-b border-[#262626] bg-[#111111]/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-300">Phase 4.5 Internal Operations Workspace</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-mono">
              In-Memory Demo Active
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-400 hidden sm:inline">Role: <strong className="text-zinc-200">{adminRole}</strong></span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <div key={location.pathname} className="animate-tab-fade">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
