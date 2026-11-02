import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * MarketingFooter
 *
 * Professional, authentication-aware public marketing footer.
 * Provides role-aware Dashboard link for authenticated users,
 * hiding Sign In / Register to avoid redundant authentication actions.
 */
export default function MarketingFooter() {
  const { isAuthenticated, initialLoading, dashboardPath } = useAuth();

  return (
    <footer className="border-t border-[#1B1B1B] py-12 px-6 bg-[#080808] text-xs text-[#737373]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <Link
            to="/"
            className="flex items-center transition-opacity hover:opacity-90"
            aria-label="Hirevoxa Home"
          >
            <img
              src="/images/hirevoxa-logo.png"
              alt="Hirevoxa"
              className="h-8 md:h-9 w-auto object-contain hidden sm:block"
            />
            <img
              src="/images/hirevoxa-icon.png"
              alt="Hirevoxa"
              className="h-7 w-7 object-contain block sm:hidden"
            />
          </Link>
          <span>© {new Date().getFullYear()} Hirevoxa Inc. All rights reserved.</span>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>

          {/* Authentication-aware footer actions */}
          {initialLoading ? (
            <div className="h-4 w-16 bg-[#171717] rounded animate-pulse" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="text-[#F5F5F5] font-semibold hover:text-white transition-colors flex items-center gap-1.5"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

