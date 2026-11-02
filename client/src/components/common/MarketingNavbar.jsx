import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu, X, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

/**
 * MarketingNavbar
 *
 * Professional, authentication-aware public marketing navigation.
 * Renders distinct states for:
 * 1. loading: Neutral reserved placeholder (prevents flash of Sign In/Register).
 * 2. authenticated: Single prominent Dashboard button routing to user's role workspace.
 * 3. unauthenticated: Sign In and Get Started/Register buttons.
 *
 * Fully responsive across desktop (1280px), tablet (768px), and mobile (375px).
 */
export default function MarketingNavbar({ links }) {
  const { user, isAuthenticated, initialLoading, dashboardPath } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Default marketing navigation links
  const defaultLinks = [
    { label: 'Value', href: '/#value' },
    { label: 'How It Works', href: '/#workflow' },
    { label: 'Roles', href: '/#roles' },
    { label: 'Matching', href: '/#matching' },
    { label: 'Pricing', to: '/pricing', isHighlight: true },
    { label: 'FAQ', href: '/#faq' }
  ];

  const navLinks = links || defaultLinks;

  return (
    <nav className="sticky top-0 z-40 bg-[#090909]/95 backdrop-blur-md border-b border-[#303030]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
          aria-label="Hirevoxa Home"
        >
          {/* Desktop & Tablet: Full brand logo */}
          <img
            src="/images/hirevoxa-logo.png"
            alt="Hirevoxa — Engineering Talent, Amplified"
            className="h-10 md:h-11 w-auto object-contain hidden sm:block"
          />
          {/* Mobile / Compact: Standalone metallic H symbol */}
          <img
            src="/images/hirevoxa-icon.png"
            alt="Hirevoxa — Engineering Talent, Amplified"
            className="h-9 w-9 object-contain block sm:hidden"
          />
        </Link>

        {/* Desktop Public Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
          {navLinks.map((link) => {
            if (link.to) {
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`transition-colors hover:text-white ${
                    link.isHighlight ? 'text-[#F59E0B]' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a
                key={link.label}
                href={link.href}
                className={`transition-colors hover:text-white ${
                  link.isHighlight ? 'text-[#F59E0B]' : ''
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Desktop Authentication CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {initialLoading ? (
            // Neutral loading placeholder - avoids layout shift and auth flashing
            <div
              className="h-9 w-28 rounded-xl bg-[#171717] border border-[#2E2E2E] animate-pulse"
              aria-label="Verifying session"
            />
          ) : isAuthenticated ? (
            // Authenticated: Single prominent Dashboard button with role-based routing
            <Button
              variant="primary"
              size="sm"
              icon={LayoutDashboard}
              onClick={() => navigate(dashboardPath)}
              className="text-xs font-bold px-4 py-2 flex items-center gap-2 shadow-sm"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Button>
          ) : (
            // Unauthenticated: Sign In and Get Started/Register buttons
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls (< 768px) */}
        <div className="flex md:hidden items-center gap-2">
          {initialLoading ? (
            <div className="h-8 w-20 rounded-lg bg-[#171717] border border-[#2E2E2E] animate-pulse" />
          ) : isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              icon={LayoutDashboard}
              onClick={() => navigate(dashboardPath)}
              className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold px-2.5 py-1.5">
                Sign In
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] border border-transparent hover:border-[#303030] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#262626] bg-[#0E0E0E] px-4 pt-4 pb-6 space-y-4 animate-tab-fade">
          {/* Public Nav Links */}
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              if (link.to) {
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#1A1A1A] hover:text-white ${
                      link.isHighlight ? 'text-[#F59E0B]' : 'text-[#A3A3A3]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#1A1A1A] hover:text-white ${
                    link.isHighlight ? 'text-[#F59E0B]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#222222]">
            {initialLoading ? (
              <div className="h-10 w-full rounded-xl bg-[#171717] border border-[#2E2E2E] animate-pulse" />
            ) : isAuthenticated ? (
              <div className="space-y-3">
                {/* User info pill */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#171717] border border-[#262626] text-xs text-[#A3A3A3]">
                  <User className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate flex-1">
                    <span className="font-medium text-white">{user?.name || user?.email}</span>
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-[#252525] uppercase tracking-wider text-emerald-400 font-mono">
                      {user?.role || 'user'}
                    </span>
                  </div>
                </div>

                {/* Prominent Dashboard CTA */}
                <Button
                  variant="primary"
                  size="md"
                  icon={LayoutDashboard}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(dashboardPath);
                  }}
                  className="w-full justify-center text-xs font-bold py-3"
                  aria-label="Go to Dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="secondary" size="md" className="w-full justify-center text-xs font-semibold py-2.5">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="primary" size="md" className="w-full justify-center text-xs font-semibold py-2.5">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

