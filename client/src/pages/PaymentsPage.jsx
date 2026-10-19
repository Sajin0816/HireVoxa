import React from 'react';
import { CreditCard, Shield, Clock, FileText, AlertTriangle } from 'lucide-react';
import Badge from '../components/common/Badge';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#303030]">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#F5F5F5]" />
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Contractor Billing & Compliance</h1>
        </div>
        <p className="text-xs text-[#777777] mt-1">
          International contractor payment infrastructure, tax documentation, and payroll orchestration.
        </p>
      </div>

      {/* Primary Coming-Soon Hero Card */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl p-8 relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202020] border border-[#303030] text-[#A3A3A3] text-xs font-semibold mb-4">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Planned for Phase 2 Integration</span>
          </div>

          <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
            Integrated Cross-Border Contractor Payments
          </h2>

          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-3 leading-relaxed">
            Hirevoxa is architecting an integrated compliance and contractor disbursement module. In this version, payment processing is safely gated. No raw banking or credit card credentials are collected or stored.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Badge variant="default">W-8BEN Tax Document Compliance</Badge>
            <Badge variant="default">Multi-Currency Payouts (USD / BRL / MXN / COP)</Badge>
            <Badge variant="default">Consolidated US Monthly Invoicing</Badge>
          </div>
        </div>
      </div>

      {/* Feature Blueprint */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171717] border border-[#303030] rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5] mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#F5F5F5]">Consolidated Invoicing</h3>
          <p className="text-xs text-[#777777] mt-2 leading-relaxed">
            US hiring companies receive a single monthly itemized invoice in US Dollars, eliminating individual international wire transfers.
          </p>
        </div>

        <div className="bg-[#171717] border border-[#303030] rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#10B981] mb-4">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#F5F5F5]">Tax & Legal Shield</h3>
          <p className="text-xs text-[#777777] mt-2 leading-relaxed">
            Automated international independent contractor agreements, W-8BEN filing collection, and local labor compliance checks.
          </p>
        </div>

        <div className="bg-[#171717] border border-[#303030] rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#D4D4D4] mb-4">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#F5F5F5]">Local Bank Disbursals</h3>
          <p className="text-xs text-[#777777] mt-2 leading-relaxed">
            Direct deposits into local banking systems in São Paulo, Mexico City, Medellín, and Buenos Aires at market-competitive exchange rates.
          </p>
        </div>
      </div>

      {/* Transparent Disclaimer Box */}
      <div className="p-4 bg-[#171717] border border-[#303030] rounded-2xl flex items-start gap-3 text-xs text-[#A3A3A3]">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
        <div>
          <span className="font-bold text-[#F5F5F5]">Compliance Notice:</span> Hirevoxa does not claim to operate a depository bank or money transmitter. Fully licensed third-party banking APIs will be integrated upon regulatory clearance.
        </div>
      </div>
    </div>
  );
}
