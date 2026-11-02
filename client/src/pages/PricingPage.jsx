import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import Button from '../components/common/Button';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MarketingNavbar from '../components/common/MarketingNavbar';
import MarketingFooter from '../components/common/MarketingFooter';

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await api.getPricing();
        if (res?.data) {
          setPricingData(res.data);
        }
      } catch (err) {
        console.warn('Using default pricing structure:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, []);

  const starterPrice = pricingData?.EMPLOYER_STARTER?.priceFormatted || '$0';
  const proPrice = pricingData?.EMPLOYER_PRO?.priceFormatted || '$199';
  const placementFee = pricingData?.SUCCESSFUL_PLACEMENT?.feeFormatted || '$2,500';
  const guaranteeDays = pricingData?.SUCCESSFUL_PLACEMENT?.guaranteePeriodDays || 90;

  const pricingNavLinks = [
    { label: 'Home', to: '/' },
    { label: 'How It Works', href: '/#workflow' },
    { label: 'Roles', href: '/#roles' },
    { label: 'Pricing', to: '/pricing', isHighlight: true },
    { label: 'FAQ', href: '/#faq' }
  ];

  const faqs = [
    {
      q: 'Do software candidates ever pay to use Hirevoxa?',
      a: 'Never. Candidate membership, profile creation, skill assessments, job discovery, direct applications, and interview scheduling are 100% free forever. We will never introduce candidate paywalls or deduct fees from candidate compensation.'
    },
    {
      q: 'What is the Employer Starter pilot?',
      a: `Employer Starter ($0) allows verified hiring companies to evaluate Hirevoxa without payment details. You can publish up to 5 active requisitions and evaluate candidates directly before upgrading to a paid tier.`
    },
    {
      q: 'When is the $2,500 placement fee charged?',
      a: `The $2,500 fee is a success-based placement fee triggered only when you officially hire a candidate (Application status marked as 'Hired'). Creating requisitions, shortlisting talent, and conducting interviews carry zero placement cost.`
    },
    {
      q: `How does the ${guaranteeDays}-day replacement guarantee work?`,
      a: `Every qualifying placement is backed by a full ${guaranteeDays}-day replacement guarantee. If a placed software engineer departs or does not meet agreed performance benchmarks within ${guaranteeDays} days, Hirevoxa will replace the talent at no additional placement fee or issue a full credit.`
    },
    {
      q: 'What is included in the $199/month Employer Pro plan?',
      a: 'Employer Pro provides higher requisition limits (up to 50 active jobs), advanced search filters (seniority, compensation, timezone overlap), saved searches, team collaboration with up to 10 recruiter accounts, advanced analytics, and CSV data exports.'
    },
    {
      q: 'Can I cancel Employer Pro at any time?',
      a: 'Yes. You can cancel your subscription from your Billing Hub with one click. Your Pro entitlements remain active until the end of your current monthly billing period with no penalty.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] selection:bg-[#F59E0B] selection:text-black font-sans">
      {/* 1. Header Navigation */}
      <MarketingNavbar links={pricingNavLinks} />

      {/* 2. Hero Headline */}
      <section className="pt-16 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171717] border border-[#262626] text-xs text-[#A3A3A3] mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Transparent, Performance-Driven Recruitment Monetization</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#F5F5F5] tracking-tight leading-[1.1] mb-6">
          Predictable pricing built for high-growth tech teams.
        </h1>
        <p className="text-base sm:text-lg text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed">
          Zero cost for engineering candidates. Free pilot evaluation for hiring organizations.
          Scalable monthly tools and success-based placement guarantees.
        </p>
      </section>

      {/* 3. Core Pricing Tiers Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: Candidate (Free Forever) */}
          <div className="rounded-2xl bg-[#111111] border border-[#262626] p-8 flex flex-col justify-between hover:border-[#383838] transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full border border-[#10B981]/20">
                  Engineering Talent
                </span>
                <span className="text-xs text-[#737373]">No Card Required</span>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Candidate Free Forever</h2>
              <p className="text-sm text-[#A3A3A3] mb-6 leading-relaxed">
                Build your profile, showcase engineering expertise, and connect directly with verified US tech companies.
              </p>
              <div className="mb-8">
                <span className="text-4xl font-black text-[#F5F5F5]">$0</span>
                <span className="text-xs text-[#737373] ml-2 uppercase font-medium">Free forever</span>
              </div>

              <div className="border-t border-[#1F1F1F] pt-6 mb-8">
                <span className="text-xs font-semibold text-[#D4D4D4] uppercase tracking-wider block mb-4">Included Capabilities:</span>
                <ul className="space-y-3 text-sm text-[#A3A3A3]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Full engineering profile & portfolio showcase</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Private, authenticated resume upload & virus scanning</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Discover US software jobs matching your timezone</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Track applications from interview to formal offer</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Zero candidate commissions or deductions</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link to="/register?role=candidate" className="w-full">
              <Button variant="secondary" size="lg" className="w-full justify-center">
                Join as Candidate
              </Button>
            </Link>
          </div>

          {/* Card 2: Employer Starter ($0 Pilot) */}
          <div className="rounded-2xl bg-[#111111] border border-[#262626] p-8 flex flex-col justify-between hover:border-[#383838] transition-all relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full border border-[#3B82F6]/20">
                  Hiring Organizations
                </span>
                <span className="text-xs text-[#737373]">Evaluation Pilot</span>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Employer Starter</h2>
              <p className="text-sm text-[#A3A3A3] mb-6 leading-relaxed">
                Evaluate Hirevoxa talent matching, post real requisitions, and review calibrated Latin American engineers.
              </p>
              <div className="mb-8">
                <span className="text-4xl font-black text-[#F5F5F5]">{starterPrice}</span>
                <span className="text-xs text-[#737373] ml-2 uppercase font-medium">To start (Pilot)</span>
              </div>

              <div className="border-t border-[#1F1F1F] pt-6 mb-8">
                <span className="text-xs font-semibold text-[#D4D4D4] uppercase tracking-wider block mb-4">Pilot Limits & Access:</span>
                <ul className="space-y-3 text-sm text-[#A3A3A3]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span><strong>Up to 5 active requisitions</strong> simultaneously</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>Standard candidate discovery & matching</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>Applicant tracking pipeline (Review, Shortlist, Interview)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>Integrated interview coordination</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>No credit card required to evaluate</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link to="/register?role=company" className="w-full">
              <Button variant="secondary" size="lg" className="w-full justify-center">
                Start Free Pilot
              </Button>
            </Link>
          </div>

          {/* Card 3: Employer Pro ($199/month) */}
          <div className="rounded-2xl bg-[#161616] border-2 border-[#F59E0B] p-8 flex flex-col justify-between shadow-2xl shadow-[#F59E0B]/10 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-black text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
              Most Popular for Teams
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/20">
                  Scaling Teams
                </span>
                <span className="text-xs text-[#A3A3A3]">Monthly Billing</span>
              </div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Employer Pro</h2>
              <p className="text-sm text-[#A3A3A3] mb-6 leading-relaxed">
                For organizations hiring multiple engineers with advanced filters, team collaboration, and high limits.
              </p>
              <div className="mb-8">
                <span className="text-4xl font-black text-[#F5F5F5]">{proPrice}</span>
                <span className="text-xs text-[#A3A3A3] ml-2 uppercase font-medium">per month</span>
              </div>

              <div className="border-t border-[#262626] pt-6 mb-8">
                <span className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider block mb-4">All Starter Features Plus:</span>
                <ul className="space-y-3 text-sm text-[#E5E5E5]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span><strong>Up to 50 active job requisitions</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>Advanced candidate filters (seniority, rate, overlap)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>Saved talent profiles & custom shortlists</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>Multi-seat team recruitment (up to 10 members)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>Hiring metrics & full CSV data exports</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link to={user ? "/app/payments" : "/register?role=company&plan=pro"} className="w-full">
              <Button variant="primary" size="lg" className="w-full justify-center">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Successful Placement Fee Banner ($2,500) */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#141414] border border-[#333333] p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-semibold text-[#10B981] mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Success-Based Contractual Milestone</span>
              </div>
              <h2 className="text-3xl font-bold text-[#F5F5F5] mb-4">
                Successful Placement Fee — {placementFee}
              </h2>
              <p className="text-base text-[#A3A3A3] leading-relaxed mb-6 max-w-2xl">
                Payable strictly upon a confirmed hire. Unlike traditional agencies charging 20–25% of annual salary,
                Hirevoxa charges a flat, transparent fee of {placementFee} backed by our industry-leading {guaranteeDays}-day replacement policy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#262626]">
                <div>
                  <span className="text-xs text-[#737373] block uppercase">Fee Trigger</span>
                  <span className="text-sm font-semibold text-[#F5F5F5]">Confirmed 'Hired' Status</span>
                </div>
                <div>
                  <span className="text-xs text-[#737373] block uppercase">Replacement Guarantee</span>
                  <span className="text-sm font-semibold text-[#F5F5F5]">{guaranteeDays} Full Calendar Days</span>
                </div>
                <div>
                  <span className="text-xs text-[#737373] block uppercase">Payment Terms</span>
                  <span className="text-sm font-semibold text-[#F5F5F5]">Net-14 Official Invoicing</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center bg-[#0F0F0F] border border-[#262626] rounded-xl p-8 text-center">
              <span className="text-xs text-[#A3A3A3] uppercase tracking-wider block mb-2">Flat Rate Per Hire</span>
              <span className="text-4xl font-extrabold text-[#10B981] mb-2">{placementFee}</span>
              <span className="text-xs text-[#737373] block mb-6">Backed by {guaranteeDays}-day guarantee</span>
              <Link to="/register?role=company" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#F5F5F5] mb-3">Frequently Asked Questions</h2>
          <p className="text-sm text-[#A3A3A3]">
            Straightforward answers regarding Hirevoxa plans, pilot limits, and billing terms.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#111111] border border-[#222222] overflow-hidden transition-colors"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-sm sm:text-base text-[#F5F5F5] hover:text-white"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#737373] transition-transform ${
                    openFaq === idx ? 'rotate-180 text-[#F59E0B]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-sm text-[#A3A3A3] leading-relaxed border-t border-[#1C1C1C] pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Footer */}
      <MarketingFooter />
    </div>
  );
}
