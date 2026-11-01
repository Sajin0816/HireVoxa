import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldAlert,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';

export default function AdminBillingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Waive Modal State
  const [waiveTarget, setWaiveTarget] = useState(null);
  const [waiveReason, setWaiveReason] = useState('');

  // Dispute Modal State
  const [disputeTarget, setDisputeTarget] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminBillingMetrics();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin billing data:', err.message);
      setNotification({ type: 'error', message: err.message || 'Failed to load revenue metrics' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleGenerateInvoice = async (placementFeeId) => {
    try {
      setActionLoading(true);
      const res = await api.adminGenerateInvoice({
        placementFeeId,
        notes: 'Official Hirevoxa Placement Invoice issued by Platform Operations'
      });
      setNotification({ type: 'success', message: res.message || 'Invoice generated successfully' });
      await loadMetrics();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Invoice generation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaiveFee = async (e) => {
    e.preventDefault();
    if (!waiveTarget) return;
    try {
      setActionLoading(true);
      const res = await api.adminWaivePlacementFee(waiveTarget._id || waiveTarget.id, waiveReason);
      setWaiveTarget(null);
      setWaiveReason('');
      setNotification({ type: 'success', message: res.message || 'Placement fee waived successfully' });
      await loadMetrics();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Fee waiver failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeFee = async (e) => {
    e.preventDefault();
    if (!disputeTarget) return;
    try {
      setActionLoading(true);
      const res = await api.adminDisputePlacementFee(disputeTarget._id || disputeTarget.id, disputeReason);
      setDisputeTarget(null);
      setDisputeReason('');
      setNotification({ type: 'info', message: res.message || 'Placement fee marked in dispute' });
      await loadMetrics();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Dispute update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setActionLoading(true);
      const blob = await api.exportBillingCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hirevoxa-billing-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'CSV export failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCents = (cents) => {
    if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const metrics = data?.metrics || {};
  const placements = data?.recentPlacements || [];
  const subscriptions = data?.recentSubscriptions || [];
  const invoices = data?.recentInvoices || [];

  const filteredPlacements = placements.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = (p.placementId || '').toLowerCase().includes(q);
      const matchComp = (p.companyName || p.companyId || '').toLowerCase().includes(q);
      const matchCand = (p.candidateName || '').toLowerCase().includes(q);
      if (!matchId && !matchComp && !matchCand) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="pb-4 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#10B981]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Revenue & Billing Governance</h1>
          </div>
          <p className="text-xs text-[#737373] mt-1">
            Authoritative financial dashboard: Invoiced revenue, cash collected, MRR, placement tracking, and audit controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={loadMetrics}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            disabled={actionLoading}
            className="text-xs font-semibold"
          >
            Export CSV
          </Button>
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

      {/* 3. Top Metrics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Collected Cash */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5">
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2">
            <span className="uppercase font-semibold tracking-wider">Collected Cash</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#10B981] mb-1">
            {formatCents(metrics.collectedRevenueCents)}
          </div>
          <p className="text-[11px] text-[#737373]">
            Verified reconciled payments
          </p>
        </div>

        {/* Metric 2: Invoiced Revenue */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5">
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2">
            <span className="uppercase font-semibold tracking-wider">Total Invoiced</span>
            <FileText className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-black text-[#F5F5F5] mb-1">
            {formatCents(metrics.invoicedRevenueCents)}
          </div>
          <p className="text-[11px] text-[#737373]">
            Outstanding: {formatCents(metrics.outstandingBalanceCents)}
          </p>
        </div>

        {/* Metric 3: Employer Pro MRR */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5">
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2">
            <span className="uppercase font-semibold tracking-wider">Monthly Recurring (MRR)</span>
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-black text-[#F59E0B] mb-1">
            {formatCents(metrics.estimatedMrrCents)}
          </div>
          <p className="text-[11px] text-[#737373]">
            {metrics.activeProSubscriptions || 0} Active Pro Subscriptions
          </p>
        </div>

        {/* Metric 4: Placement Fees Count */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5">
          <div className="flex items-center justify-between text-xs text-[#737373] mb-2">
            <span className="uppercase font-semibold tracking-wider">Total Placements</span>
            <CreditCard className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-black text-[#F5F5F5] mb-1">
            {metrics.totalPlacements || 0}
          </div>
          <p className="text-[11px] text-[#737373]">
            {metrics.paidPlacements || 0} Paid | {metrics.eligiblePlacements || 0} Eligible
          </p>
        </div>
      </div>

      {/* 4. Placement Fees Governance Table */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden">
        <div className="p-6 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F5F5F5]">Qualifying Placement Fees Management</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Review placed talent milestones, issue formal Net-14 invoices, or log administrative waivers with audit notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                placeholder="Search placements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#171717] border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#171717] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="all">All Statuses</option>
              <option value="eligible">Eligible</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        {filteredPlacements.length === 0 ? (
          <div className="p-12 text-center text-[#737373]">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No placement records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A3A3A3]">
              <thead className="bg-[#171717] text-[#737373] uppercase text-[10px] tracking-wider border-b border-[#262626]">
                <tr>
                  <th className="px-6 py-3.5">Ref ID</th>
                  <th className="px-6 py-3.5">Company & Candidate</th>
                  <th className="px-6 py-3.5">Fee</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Guarantee Date</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {filteredPlacements.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-[#151515] transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-[#F5F5F5]">
                      {p.placementId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#F5F5F5]">{p.companyName || p.companyId}</div>
                      <div className="text-[11px] text-[#737373]">{p.candidateName} — {p.jobTitle}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#F5F5F5]">
                      {formatCents(p.feeAmountCents)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          p.status === 'paid'
                            ? 'success'
                            : p.status === 'invoiced'
                            ? 'info'
                            : p.status === 'waived'
                            ? 'default'
                            : p.status === 'disputed'
                            ? 'danger'
                            : 'warning'
                        }
                        className="capitalize text-[11px]"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#737373]">
                      {p.replacementGuaranteeExpiry
                        ? new Date(p.replacementGuaranteeExpiry).toLocaleDateString()
                        : 'Active 90d'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'eligible' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleGenerateInvoice(p._id || p.id)}
                            disabled={actionLoading}
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-semibold py-1 px-2.5"
                          >
                            Generate Invoice
                          </Button>
                        )}
                        {p.status !== 'waived' && p.status !== 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWaiveTarget(p)}
                            disabled={actionLoading}
                            className="text-[11px] text-[#A3A3A3] hover:text-[#EF4444]"
                          >
                            Waive
                          </Button>
                        )}
                        {p.status !== 'disputed' && p.status !== 'waived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisputeTarget(p)}
                            disabled={actionLoading}
                            className="text-[11px] text-[#A3A3A3] hover:text-[#F59E0B]"
                          >
                            Dispute
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Subscriptions & Invoices Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscriptions */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Recent Subscriptions</h3>
            <span className="text-xs text-[#737373]">{subscriptions.length} records</span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="py-8 text-center text-[#737373] text-xs">No subscriptions logged</div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((s) => (
                <div key={s._id || s.id} className="p-3 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wide">
                      {s.plan === 'pro' ? 'Employer Pro ($199/mo)' : 'Employer Starter (Pilot)'}
                    </div>
                    <div className="text-[11px] text-[#737373]">Company: {s.companyId}</div>
                  </div>
                  <Badge variant={s.status === 'active' ? 'success' : 'default'} className="capitalize text-[10px]">
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Recent Invoices</h3>
            <span className="text-xs text-[#737373]">{invoices.length} records</span>
          </div>

          {invoices.length === 0 ? (
            <div className="py-8 text-center text-[#737373] text-xs">No invoices logged</div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv._id || inv.id} className="p-3 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#F5F5F5] font-mono">
                      {inv.invoiceNumber} — {formatCents(inv.amountCents)}
                    </div>
                    <div className="text-[11px] text-[#737373]">Company: {inv.companyName || inv.companyId}</div>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} className="capitalize text-[10px]">
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Waive Modal */}
      {waiveTarget && (
        <Modal
          isOpen={!!waiveTarget}
          onClose={() => setWaiveTarget(null)}
          title={`Waive Placement Fee — ${waiveTarget.placementId}`}
        >
          <form onSubmit={handleWaiveFee} className="space-y-4">
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Waiving this fee removes the payable amount ($2,500) and marks the record as waived in financial reports. A documented justification is required for the audit trail.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                Audit Justification (Required)
              </label>
              <textarea
                rows={3}
                required
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="e.g. Promotional pilot waiver approved by executive agreement..."
                className="w-full bg-[#111111] border border-[#303030] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#EF4444]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setWaiveTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={actionLoading || waiveReason.trim().length < 5}
              >
                {actionLoading ? 'Waiving...' : 'Confirm Fee Waiver'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Dispute Modal */}
      {disputeTarget && (
        <Modal
          isOpen={!!disputeTarget}
          onClose={() => setDisputeTarget(null)}
          title={`Dispute Placement Fee — ${disputeTarget.placementId}`}
        >
          <form onSubmit={handleDisputeFee} className="space-y-4">
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Place this fee in dispute under 90-day replacement policy evaluation. The company will not be billed while this is open.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] uppercase mb-1.5">
                Dispute Reason
              </label>
              <textarea
                rows={3}
                required
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Early departure within 30 days under replacement guarantee review..."
                className="w-full bg-[#111111] border border-[#303030] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDisputeTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={actionLoading || disputeReason.trim().length < 5}
                className="bg-[#F59E0B] text-black font-bold"
              >
                {actionLoading ? 'Updating...' : 'Log Dispute'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
