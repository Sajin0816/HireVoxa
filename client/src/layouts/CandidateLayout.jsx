import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, FileText, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { label: 'Overview', path: '/candidate', icon: LayoutDashboard, end: true },
  { label: 'My profile', path: '/candidate/profile', icon: UserRound },
  { label: 'Find jobs', path: '/candidate/jobs', icon: BriefcaseBusiness },
  { label: 'My applications', path: '/candidate/applications', icon: FileText },
  { label: 'Resume', path: '/candidate/resume', icon: FileText }
];

export default function CandidateLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = (
    <div className="flex h-full flex-col bg-[#111111] border-r border-[#303030]">
      <div className="flex items-center justify-between px-5 py-6">
        <Link to="/candidate" className="flex items-center gap-3">
          <img src="/images/hirevoxa-logo.png" alt="Hirevoxa" className="h-8 max-w-[150px] object-contain" />
        </Link>
        <button onClick={() => setOpen(false)} className="md:hidden text-[#A3A3A3]" aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-5 pb-5 border-b border-[#252525]">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#666666]">Engineer workspace</p>
        <p className="mt-2 truncate text-sm font-semibold text-[#F5F5F5]">{user?.name || 'Candidate'}</p>
        <p className="truncate text-xs text-[#777777]">{user?.email}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {links.map(({ label, path, icon: Icon, end }) => (
          <NavLink key={path} to={path} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-[#202020] text-[#FFFFFF] border border-[#303030]' : 'text-[#8E8E8E] hover:bg-[#171717] hover:text-[#F5F5F5]'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[#303030] p-3">
        <Link to="/" className="mb-1 block rounded-xl px-3 py-2.5 text-xs text-[#8E8E8E] hover:bg-[#171717] hover:text-[#F5F5F5]">Public site</Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] md:flex">
      <aside className="hidden w-64 shrink-0 md:block">{navigation}</aside>
      {open && <div className="fixed inset-0 z-40 md:hidden"><button className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} aria-label="Close navigation" /><aside className="relative z-10 h-full w-72">{navigation}</aside></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#202020] bg-[#101010] px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-[#A3A3A3] hover:bg-[#202020]" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="text-sm font-semibold">Candidate workspace</span>
          <Link to="/candidate/profile" className="text-[#A3A3A3]" aria-label="Profile"><UserRound className="h-5 w-5" /></Link>
        </header>
        <div className="border-b border-[#202020] bg-[#101010] px-6 py-2.5 text-xs text-[#8E8E8E]">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#10B981]" /> Your private candidate workspace
        </div>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
