import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
