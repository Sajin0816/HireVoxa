import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Download,
  Calendar,
  Lock,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardExpMonth, setCardExpMonth] = useState('12');
  const [cardExpYear, setCardExpYear] = useState('2028');

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Placement Payment Modal
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.getCompanyBilling();
      if (res?.data) {
        setBillingData(res.data);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err.message);
      setNotification({ type: 'error', message: err.message || 'Failed to load billing overview' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleUpgradeToPro = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.subscribePro({
        plan: 'pro',
        paymentMethod: {
          brand: cardBrand,
          last4: cardLast4,
          expMonth: Number(cardExpMonth),
          expYear: Number(cardExpYear)
        }
      });
      setShowUpgradeModal(false);
      setNotification({
        type: 'success',
        message: 'Successfully upgraded to Employer Pro ($199/month)! Your limits are now expanded to 50 active jobs.'
      });
      await fetchBilling();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Upgrade failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPro = async () => {
    try {
      setActionLoading(true);
      await api.cancelSubscription();
      setShowCancelModal(false);
      setNotification({
        type: 'info',
        message: 'Employer Pro cancellation scheduled. Your benefits will remain active until the end of your billing cycle.'
      });
      await fetchBilling();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Cancellation request failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayPlacement = async (feeId) => {
    try {
      setActionLoading(true);
      const res = await api.payPlacementFee(feeId);
      setSelectedPlacement(null);
      setNotification({
        type: 'success',
        message: res.message || 'Placement fee payment confirmed. 90-day replacement guarantee is active.'
      });
      await fetchBilling();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Payment processing failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const currentPlan = billingData?.company?.plan || 'starter';
  const isPro = currentPlan === 'pro';
  const usage = billingData?.usage || { activeJobs: 0, maxActiveJobs: 5, searchTier: 'standard' };
  const subscription = billingData?.subscription;
  const placementFees = billingData?.placementFees || [];
  const invoices = billingData?.invoices || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F59E0B]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Billing & Monetization Hub</h1>
          </div>
          <p className="text-xs text-[#737373] mt-1">
            Authoritative plan management, Employer Pro subscriptions, placement invoicing, and 90-day guarantee tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchBilling}
            disabled={loading}
          >
            Refresh
          </Button>
          {!isPro ? (
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={() => setShowUpgradeModal(true)}
              className="bg-[#F59E0B] text-black hover:bg-[#D97706] font-bold"
            >
              Upgrade to Pro ($199/mo)
            </Button>
          ) : (
            <Badge variant="success" className="text-xs px-3 py-1">
              Active Employer Pro
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            notification.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : notification.type === 'error'
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
              : 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Current Plan & Entitlements Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-2xl bg-[#111111] border border-[#262626] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Current Organization Plan
              </span>
              <Badge variant={isPro ? 'warning' : 'info'} className="text-xs px-3 py-1">
                {isPro ? 'Employer Pro Tier' : 'Employer Starter (Free Pilot)'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <h2 className="text-3xl font-extrabold text-[#F5F5F5]">
                {isPro ? 'Employer Pro' : 'Employer Starter'}
              </h2>
              <span className="text-lg font-bold text-[#F59E0B]">
                {isPro ? '$199.00 / Month' : '$0.00 / Free Pilot'}
              </span>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6 max-w-xl">
              {isPro
                ? 'Your organization has full access to 50 active job requisitions, advanced candidate filters, multi-seat recruitment, and export tools.'
                : 'Your organization is evaluating Hirevoxa on the Starter Pilot. You have access to core candidate discovery, applicant tracking, and up to 5 active requisitions.'}
            </p>

            {/* Usage Progress Bar */}
            <div className="bg-[#171717] border border-[#262626] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#D4D4D4]">Active Requisition Capacity</span>
                <span className="text-[#F5F5F5]">{usage.activeJobs} of {usage.maxActiveJobs} slots used</span>
              </div>
              <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usage.activeJobs >= usage.maxActiveJobs ? 'bg-[#EF4444]' : 'bg-[#10B981]'
                  }`}
                  style={{
                    width: `${Math.min(100, (usage.activeJobs / usage.maxActiveJobs) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#737373] mt-2">
                <span>Search Tier: <strong className="text-[#A3A3A3] capitalize">{usage.searchTier}</strong></span>
                <span>Team Seats: <strong className="text-[#A3A3A3]">{usage.teamMembersLimit || (isPro ? 10 : 2)}</strong></span>
                <span>CSV Export: <strong className="text-[#A3A3A3]">{usage.canExportCSV ? 'Enabled' : 'Pro only'}</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1F1F1F] flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-[#737373]">
              {subscription?.cancelAtPeriodEnd
                ? 'Cancellation pending at cycle end.'
                : isPro
                ? `Renews on ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'Next Month'}`
                : 'Free evaluation pilot — No automatic credit card charges.'}
            </span>

            <div className="flex items-center gap-3">
              {isPro ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs text-[#EF4444] hover:bg-[#EF4444]/10"
                >
                  Cancel Pro Subscription
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowUpRight}
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-[#F59E0B] text-black hover:bg-[#D97706] font-bold text-xs"
                >
                  Upgrade to Pro ($199/mo)
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Successful Placement Terms Callout */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#141414] to-[#0E0E0E] border border-[#262626] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10B981] mb-3">
              <Shield className="w-4 h-4" />
              <span>Placement Guarantee</span>
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">$2,500 Placement Fee</h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
              Only qualifying hires trigger a placement fee. Backed by our 90-day replacement guarantee.
            </p>

            <div className="space-y-3 border-t border-[#1F1F1F] pt-4 text-xs text-[#737373]">
              <div className="flex justify-between">
                <span>Contractual Trigger:</span>
                <span className="text-[#F5F5F5] font-semibold">Offer Accepted (Hired)</span>
              </div>
              <div className="flex justify-between">
                <span>Guarantee Duration:</span>
                <span className="text-[#F5F5F5] font-semibold">90 Calendar Days</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Terms:</span>
                <span className="text-[#F5F5F5] font-semibold">Net-14 Invoicing</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1F1F1F]">
            <a
              href="/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#F59E0B] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>View Full Terms of Monetization</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 4. Placement Fees Table */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Successful Placements & Guarantee Tracking</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Every candidate hired through Hirevoxa is logged here with its 90-day replacement policy.
            </p>
          </div>
          <span className="text-xs text-[#A3A3A3] font-semibold">
            {placementFees.length} Recorded Placement{placementFees.length === 1 ? '' : 's'}
          </span>
        </div>

        {placementFees.length === 0 ? (
          <div className="p-12 text-center text-[#737373]">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No placements recorded yet</p>
            <p className="text-xs mt-1">
              When a candidate moves to 'Hired', their qualifying placement record will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A3A3A3]">
              <thead className="bg-[#171717] text-[#737373] uppercase text-[10px] tracking-wider border-b border-[#262626]">
                <tr>
                  <th className="px-6 py-3.5">Placement Ref</th>
                  <th className="px-6 py-3.5">Candidate & Role</th>
                  <th className="px-6 py-3.5">Fee Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">90-Day Guarantee Expiry</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {placementFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-[#151515] transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-[#F5F5F5]">
                      {fee.placementId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#F5F5F5]">{fee.candidateName || 'Placed Engineer'}</div>
                      <div className="text-[11px] text-[#737373]">{fee.jobTitle || 'Engineering Role'}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#F5F5F5]">
                      {fee.feeFormatted || '$2,500.00'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          fee.status === 'paid'
                            ? 'success'
                            : fee.status === 'invoiced'
                            ? 'info'
                            : fee.status === 'waived'
                            ? 'default'
                            : 'warning'
                        }
                        className="capitalize text-[11px]"
                      >
                        {fee.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#A3A3A3]">
                      {fee.replacementGuaranteeExpiry
                        ? new Date(fee.replacementGuaranteeExpiry).toLocaleDateString()
                        : '90 Days Active'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {fee.status === 'paid' ? (
                        <span className="text-[11px] text-[#10B981] font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Paid
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePayPlacement(fee.id)}
                          disabled={actionLoading}
                          className="bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold py-1 px-3"
                        >
                          Pay Placement Fee
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Invoices & Billing History Table */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Invoices & Receipts</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Official itemized tax receipts for subscriptions and successful placement transactions.
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-[#737373]">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No invoices generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A3A3A3]">
              <thead className="bg-[#171717] text-[#737373] uppercase text-[10px] tracking-wider border-b border-[#262626]">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#151515] transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-[#F5F5F5]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 capitalize text-[#E5E5E5]">
                      {inv.type ? inv.type.replace('_', ' ') : 'Placement Fee'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#F5F5F5]">
                      {inv.amountFormatted}
                    </td>
                    <td className="px-6 py-4 text-[#737373]">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Immediate'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={inv.status === 'paid' ? 'success' : 'warning'}
                        className="capitalize text-[11px]"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-[#F59E0B] font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline">
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Upgrade to Pro Modal */}
      {showUpgradeModal && (
        <Modal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Upgrade to Employer Pro ($199/month)"
        >
          <form onSubmit={handleUpgradeToPro} className="space-y-5">
            <div className="bg-[#171717] border border-[#303030] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#F5F5F5]">Employer Pro Subscription</span>
                <span className="text-base font-extrabold text-[#F59E0B]">$199.00 / month</span>
              </div>
              <ul className="text-xs text-[#A3A3A3] space-y-1.5 pt-2 border-t border-[#262626]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Expand capacity to 50 active job requisitions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Advanced candidate search filters & talent lists</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Multi-seat recruiter access (up to 10 team members)</span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                Card Brand
              </label>
              <select
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="w-full bg-[#111111] border border-[#303030] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="American Express">American Express</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Card Number (Test Mode)
                </label>
                <input
                  type="text"
                  value={`•••• •••• •••• ${cardLast4}`}
                  disabled
                  className="w-full bg-[#111111] border border-[#303030] rounded-lg px-3 py-2 text-sm text-[#737373] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#111111] border border-[#303030] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#737373] pt-2">
              <Lock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Simulated provider test mode: No real funds will be charged.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowUpgradeModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={actionLoading}
                className="bg-[#F59E0B] text-black hover:bg-[#D97706] font-bold"
              >
                {actionLoading ? 'Activating Pro...' : 'Confirm Upgrade ($199/mo)'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Cancel Pro Modal */}
      {showCancelModal && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancel Employer Pro Subscription"
        >
          <div className="space-y-4">
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Are you sure you want to cancel your Employer Pro subscription?
            </p>
            <p className="text-xs text-[#737373] leading-relaxed">
              Your Pro entitlements (50 active jobs, advanced filters, CSV exports) will remain active until the end of your current monthly billing period. After that, your account will smoothly revert to the Employer Starter pilot.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
              >
                Keep Employer Pro
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelPro}
                disabled={actionLoading}
              >
                {actionLoading ? 'Scheduling Cancellation...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
