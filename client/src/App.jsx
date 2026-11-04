import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { getApiConfigurationError } from './services/api';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import RecommendedPage from './pages/RecommendedPage';
import JobsPage from './pages/JobsPage';
import TalentsPage from './pages/TalentsPage';
import InterviewsPage from './pages/InterviewsPage';
import CalendarPage from './pages/CalendarPage';
import MessagesPage from './pages/MessagesPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import CandidateLayout from './layouts/CandidateLayout';
import CandidateOverviewPage from './pages/CandidateOverviewPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateResumePage from './pages/CandidateResumePage';
import CandidateJobsPage from './pages/CandidateJobsPage';
import CandidateJobDetailPage from './pages/CandidateJobDetailPage';
import CandidateApplicationsPage from './pages/CandidateApplicationsPage';
import CandidateApplicationDetailPage from './pages/CandidateApplicationDetailPage';
import AdminLayout from './layouts/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCompaniesPage from './pages/admin/AdminCompaniesPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import PricingPage from './pages/PricingPage';

export default function App() {
  const configError = getApiConfigurationError();

  if (configError) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6" role="alert">
        <div className="max-w-xl w-full bg-[#1E293B] border border-red-500/40 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-lg font-semibold">Preview Configuration Required</h1>
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed font-mono bg-black/40 p-3 rounded-lg border border-red-500/20">
            {configError}
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Action Required in Vercel Dashboard:</p>
            <p>1. Open frontend project settings &gt; Environment Variables</p>
            <p>2. Add <span className="text-white font-mono">VITE_API_BASE_URL</span> set to your Preview backend HTTPS URL</p>
            <p>3. Select scope: <span className="text-amber-400 font-semibold">Preview</span> only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Landing Page with 3D Showcase */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Workspace Application Shell */}
          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRoles={['company', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="recommended" element={<RecommendedPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="talents" element={<TalentsPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CandidateOverviewPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
            <Route path="resume" element={<CandidateResumePage />} />
            <Route path="jobs" element={<CandidateJobsPage />} />
            <Route path="jobs/:jobId" element={<CandidateJobDetailPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="applications/:id" element={<CandidateApplicationDetailPage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>

          {/* Operations Admin Workspace Application Shell */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
