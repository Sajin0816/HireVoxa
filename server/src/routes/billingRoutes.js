import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPricingConfig,
  getCompanyBilling,
  createSubscription,
  cancelSubscription,
  payPlacementFee,
  handleWebhook,
  getAdminBillingMetrics,
  adminGenerateInvoice,
  adminWaivePlacementFee,
  adminDisputePlacementFee,
  adminExportBillingCSV
} from '../controllers/billingController.js';

const router = Router();

// Public Pricing Configuration
router.get('/pricing', getPricingConfig);

// Recruiter Billing Operations
router.get('/company', protect, authorize('company', 'admin'), getCompanyBilling);
router.post('/subscribe', protect, authorize('company'), createSubscription);
router.post('/cancel', protect, authorize('company'), cancelSubscription);
router.post('/placements/:id/pay', protect, authorize('company', 'admin'), payPlacementFee);

// Webhook listener (provider callbacks)
router.post('/webhook', handleWebhook);

// Admin Governance & Revenue Operations
router.get('/admin/metrics', protect, authorize('admin'), getAdminBillingMetrics);
router.post('/admin/invoices/generate', protect, authorize('admin'), adminGenerateInvoice);
router.post('/admin/placements/:id/waive', protect, authorize('admin'), adminWaivePlacementFee);
router.post('/admin/placements/:id/dispute', protect, authorize('admin'), adminDisputePlacementFee);
router.get('/admin/export', protect, authorize('admin'), adminExportBillingCSV);

export default router;
