import React, { useState } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import LogoutModal from './LogoutModal';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, token, initialLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#303030] border-t-[#F5F5F5] rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#777777]">Verifying credentials...</p>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#171717] border border-[#303030] rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-[#F5F5F5] mb-2 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-[#A3A3A3] mb-6 leading-relaxed">
            This workspace is reserved for authorized accounts. You are currently authenticated with a{' '}
            <strong className="text-[#F5F5F5]">{user.role}</strong> account.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowLogoutModal(true)}
              className="w-full text-xs"
            >
              Sign Out & Switch Account
            </Button>
          </div>
        </div>

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
          isSubmitting={isLoggingOut}
        />
      </div>
    );
  }

  return children ? children : <Outlet />;
}
