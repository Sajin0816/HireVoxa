import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    jobs: 4,
    talents: 9,
    recommendations: 9
  });
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function loadCounts() {
      try {
        const [jobsRes, candRes, recRes] = await Promise.allSettled([
          api.getJobs(),
          api.getCandidates(),
          api.getRecommendations()
        ]);

        const newCounts = { ...counts };
        if (jobsRes.status === 'fulfilled' && jobsRes.value?.data) {
          newCounts.jobs = jobsRes.value.data.length;
        }
        if (candRes.status === 'fulfilled' && candRes.value?.data) {
          newCounts.talents = candRes.value.data.length;
        }
        if (recRes.status === 'fulfilled' && recRes.value?.data) {
          newCounts.recommendations = recRes.value.data.length;
        }
        setCounts(newCounts);
      } catch (err) {
        console.warn('Could not update live sidebar counts:', err);
      }
    }
    loadCounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          counts={counts}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-[#101010] h-full shadow-2xl z-10 border-r border-[#303030]">
            <Sidebar
              collapsed={false}
              setCollapsed={() => setMobileMenuOpen(false)}
              counts={counts}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 flex flex-col min-w-0 bg-[#090909] ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#101010] border-b border-[#303030] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#171717] text-[#A3A3A3] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/app" className="flex items-center gap-2">
              <img
                src="/images/hirevoxa-icon.png"
                alt="Hirevoxa — Engineering Talent, Amplified"
                className="w-7 h-7 object-contain"
              />
              <span className="font-extrabold text-sm tracking-tight text-[#F5F5F5]">Hirevoxa</span>
            </Link>
          </div>

          <Link
            to="/"
            className="text-xs text-[#A3A3A3] hover:text-white px-2.5 py-1 rounded-lg bg-[#171717] border border-[#303030]"
          >
            Public Site
          </Link>
        </header>

        {/* Global Minimalist Workspace Header Info */}
        <div className="bg-[#101010] border-b border-[#202020] px-6 py-2 flex items-center justify-between text-[11px] text-[#777777]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>
              Connected to <strong>Hirevoxa Latin America Engineering Network</strong>
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px]">
            Mode: In-Memory Persistent Store • Role: {user?.role || 'Company'}
          </span>
        </div>

        {/* Scrollable Page Body */}
        <main className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full">
          <Outlet context={{ counts, setCounts }} />
        </main>
      </div>
    </div>
  );
}
