import React, { useEffect, useRef } from 'react';
import { LogOut, X } from 'lucide-react';
import Button from './Button';

/**
 * Shared Global Logout Confirmation Modal
 * Reused across Employer, Candidate, and Admin workspaces.
 *
 * Implements accessible focus management, Escape key listener,
 * backdrop dismissal, click-through isolation, and double-submit prevention.
 */
export default function LogoutModal({ isOpen, onClose, onConfirm, isSubmitting = false }) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus Cancel button on open as the safe default action
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      aria-describedby="logout-modal-description"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm motion-safe:transition-opacity motion-safe:duration-200"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className="relative w-full max-w-md bg-[#171717] border border-[#303030] rounded-2xl p-6 shadow-2xl z-10 motion-safe:transition-all motion-safe:duration-200 motion-safe:transform motion-safe:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Header Button */}
        <button
          type="button"
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="absolute right-4 top-4 p-1 rounded-lg text-[#777777] hover:text-[#F5F5F5] hover:bg-[#252525] transition-colors disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header Icon + Content */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 flex items-center justify-center text-[#EF4444] shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 id="logout-modal-title" className="text-base font-bold text-[#F5F5F5] tracking-tight">
              Confirm Logout
            </h3>
            <p id="logout-modal-description" className="text-xs text-[#A3A3A3] mt-1.5 leading-relaxed">
              Are you sure you want to log out of your Hirevoxa account?
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#D4D4D4] hover:text-[#FFFFFF] bg-[#202020] hover:bg-[#282828] border border-[#303030] transition-colors focus:outline-none focus:ring-1 focus:ring-[#505050] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] border border-[#EF4444]/30 transition-colors flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-[#EF4444] disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <span>Yes, Log Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

