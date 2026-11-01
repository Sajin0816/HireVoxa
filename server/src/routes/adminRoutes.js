import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin, requireAdminRole, requireAdminWrite } from '../middleware/adminAuthMiddleware.js';
import {
  getAdminSummary,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  updateUserRole,
  getAdminCompanies,
  getAdminCompanyById,
  verifyCompany,
  getAdminJobs,
  getAdminJobById,
  moderateJob,
  getAdminApplications,
  getAdminAuditLogs,
  getAdminSupportTickets,
  getAdminSupportTicketById,
  createAdminSupportTicket,
  updateAdminSupportTicket,
  addSupportTicketNote,
  getAdminSettings,
  updateAdminSettings,
  exportReportCsv
} from '../controllers/adminController.js';

const router = express.Router();

// Apply auth protection & admin requirement to all admin routes
router.use(protect, requireAdmin);

// Overview Dashboard
router.get('/summary', getAdminSummary);

// User Management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.patch('/users/:id/status', requireAdminWrite, updateUserStatus);
router.patch('/users/:id/role', requireAdminRole('owner'), updateUserRole);

// Company Management & Verification
router.get('/companies', getAdminCompanies);
router.get('/companies/:id', getAdminCompanyById);
router.patch('/companies/:id/verify', requireAdminWrite, verifyCompany);

// Job Moderation
router.get('/jobs', getAdminJobs);
router.get('/jobs/:id', getAdminJobById);
router.patch('/jobs/:id/moderate', requireAdminWrite, moderateJob);

// Application & Hiring Workflow Oversight
router.get('/applications', getAdminApplications);

// Audit Logs (Append-only, strictly read-only through API)
router.get('/audit-logs', getAdminAuditLogs);

// Support & Issue Management
router.get('/support-tickets', getAdminSupportTickets);
router.get('/support-tickets/:id', getAdminSupportTicketById);
router.post('/support-tickets', requireAdminWrite, createAdminSupportTicket);
router.patch('/support-tickets/:id', requireAdminWrite, updateAdminSupportTicket);
router.post('/support-tickets/:id/notes', requireAdminWrite, addSupportTicketNote);

// Platform Settings (Owner only for updates)
router.get('/settings', getAdminSettings);
router.patch('/settings', requireAdminRole('owner'), updateAdminSettings);

// Reports & Data Exports
router.get('/reports/export/:type', exportReportCsv);

export default router;
