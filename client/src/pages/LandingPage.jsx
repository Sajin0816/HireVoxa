import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Globe2,
  Cpu,
  CheckCircle2,
  Users,
  ChevronDown,
  Layers,
  Code,
  Terminal,
  ExternalLink,
  Sparkles,
  Briefcase
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import SkillIcon from '../components/common/SkillIcon';
import Hero3DCanvas from '../components/home/Hero3DCanvas';

export default function LandingPage() {
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireSubmitted, setHireSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const featuredRoles = [
    {
      title: 'Senior Frontend Engineer',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      experience: '7+ years',
      location: 'São Paulo, Brazil',
      timezone: 'GMT-3 (1 hr ahead of EST)',
      compensation: '$4,500 - $5,500/mo',
      summary: 'Specialized in design systems, high-throughput web apps, and modern React performance architecture.'
    },
    {
      title: 'Staff Full-Stack Engineer',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      experience: '8+ years',
      location: 'Buenos Aires, Argentina',
      timezone: 'GMT-3 (1 hr ahead of EST)',
      compensation: '$5,000 - $6,200/mo',
      summary: 'Experienced building distributed microservices and scalable SaaS interfaces for US growth-stage tech startups.'
    },
    {
      title: 'Backend Systems Engineer',
      skills: ['Python', 'Go', 'AWS', 'MongoDB'],
      experience: '6+ years',
      location: 'Medellín, Colombia',
      timezone: 'GMT-5 (Matches EST)',
      compensation: '$4,200 - $5,200/mo',
      summary: 'Architecting resilient data ingestion pipelines, cloud-native APIs, and zero-downtime database migrations.'
    }
  ];

  const faqs = [
    {
      q: 'Why should US tech companies hire engineering talent in Latin America?',
      a: 'Latin America offers senior software engineers with direct timezone overlap with US operational hours (EST, CST, and PST). Teams benefit from synchronous communication, strong cultural alignment with high-velocity product development, and transparent international compensation.'
    },
    {
      q: 'How does Hirevoxa evaluate candidate technical competence?',
      a: 'Every engineer in our directory undergoes verification of past employment records, standardized technical assessments, and a live peer architecture review covering system design, clean code practices, and English communication clarity.'
    },
    {
      q: 'How does the deterministic match score work?',
      a: 'Our match algorithm computes a calibrated score from 0 to 10 based on four transparent criteria: core skill requirements overlap (50%), verified years of relevant experience (25%), timezone proximity to US team hours (15%), and immediate availability (10%). We do not use opaque black-box models.'
    },
    {
      q: 'How are international contracts and compliance handled?',
      a: 'Hirevoxa facilitates standardized independent contractor agreements compliant with US cross-border labor regulations and IRS W-8BEN filing requirements, ensuring frictionless onboarding and automated monthly billing.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] selection:bg-[#282828] selection:text-white">
      {/* 1. Navigation Header */}
      <nav className="sticky top-0 z-40 bg-[#090909]/95 backdrop-blur-md border-b border-[#303030]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center transition-opacity hover:opacity-90">
            {/* Desktop & Tablet: Full official Hirevoxa brand logo with tagline */}
            <img
              src="/images/hirevoxa-logo.png"
              alt="Hirevoxa — Engineering Talent, Amplified"
              className="h-10 md:h-11 w-auto object-contain hidden sm:block"
            />
            {/* Mobile / Compact: Standalone metallic H symbol */}
            <img
              src="/images/hirevoxa-icon.png"
              alt="Hirevoxa — Engineering Talent, Amplified"
              className="h-9 w-9 object-contain block sm:hidden"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
            <a href="#value" className="hover:text-white transition-colors">Value</a>
            <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
            <a href="#matching" className="hover:text-white transition-colors">Matching</a>
            <Link to="/pricing" className="hover:text-white transition-colors text-[#F59E0B]">Pricing</Link>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold">
                Sign In
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="primary" size="sm" className="text-xs font-semibold">
                Recruitment Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section (3D Showcase inspired by HUSD) */}
      <section className="relative pt-12 pb-24 px-6 overflow-hidden border-b border-[#303030]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column: Bold Editorial Copy */}
            <div className="lg:col-span-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717] border border-[#303030] text-xs text-[#A3A3A3] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-medium">Vetted Latin American Software Engineers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#F5F5F5] tracking-tight leading-[1.1] mb-6">
                Exceptional engineering talent. A better way to hire.
              </h1>

              <p className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed max-w-xl mb-8">
                Discover engineering talent across Latin America, evaluate relevant skills, and build a focused shortlist for your next role.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => setShowHireModal(true)}
                  className="text-xs uppercase tracking-wider font-bold px-7 py-3.5"
                >
                  Find Your Next Engineer
                </Button>

                <Link to="/app/talents">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-xs uppercase tracking-wider font-semibold px-6 py-3.5"
                  >
                    Explore Talent
                  </Button>
                </Link>
              </div>

              {/* Sub-meta specs */}
              <div className="mt-12 pt-8 border-t border-[#303030] grid grid-cols-3 gap-6 text-left">
                <div>
                  <span className="text-2xl font-bold text-[#F5F5F5] block tracking-tight">0-3 hrs</span>
                  <span className="text-[11px] text-[#777777] block mt-1">US Timezone Alignment</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#F5F5F5] block tracking-tight">100%</span>
                  <span className="text-[11px] text-[#777777] block mt-1">English Fluent (B2-C2)</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#F5F5F5] block tracking-tight">48 hrs</span>
                  <span className="text-[11px] text-[#777777] block mt-1">Calibrated Shortlist</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Three.js 3D Sculptural Visual */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="w-full relative rounded-3xl bg-[#101010] border border-[#303030] overflow-hidden shadow-2xl">
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171717]/90 border border-[#303030] text-[10px] uppercase font-mono tracking-wider text-[#A3A3A3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Interactive Network Visual • R3F Three.js</span>
                </div>

                <Hero3DCanvas />

                <div className="p-4 bg-[#101010] border-t border-[#303030] flex items-center justify-between text-xs text-[#777777]">
                  <span>Drag to rotate precision architectural geometry</span>
                  <span className="font-mono text-[10px]">FPS: 60 • Three.js WebGL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hiring Problem & Value Proposition */}
      <section id="value" className="py-24 px-6 border-b border-[#303030]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
              Cross-Border Engineering Advantages
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
              Why US tech teams choose Latin American engineering hubs.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#171717] border border-[#303030] rounded-3xl p-8 hover:border-[#404040] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5] mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2.5">Real-Time Sync Collaboration</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                No 12-hour timezone delays or overnight standup friction. Engineers in Brazil, Argentina, Colombia, and Mexico operate in EST, CST, and PST windows.
              </p>
            </div>

            <div className="bg-[#171717] border border-[#303030] rounded-3xl p-8 hover:border-[#404040] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5] mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2.5">Deterministic Vetting</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Every engineer is vetted through live technical architecture reviews, coding standards evaluation, and English communication interviews before entering the candidate directory.
              </p>
            </div>

            <div className="bg-[#171717] border border-[#303030] rounded-3xl p-8 hover:border-[#404040] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#F5F5F5] mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-2.5">Transparent Economics</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Access tier-one software engineering expertise with transparent monthly compensation benchmarks. No hidden recruitment markups or complex agency retainers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How Hirevoxa Works */}
      <section id="workflow" className="py-24 px-6 border-b border-[#303030] bg-[#101010]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
              Structured Recruitment Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
              From open requisition to signed contract in days.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Publish Role Requirements',
                desc: 'Specify tech stack, seniority, budget range, and preferred timezone overlap.'
              },
              {
                step: '02',
                title: 'Calibrated Match Scoring',
                desc: 'Deterministic ranking compares required competencies, past experience, and availability.'
              },
              {
                step: '03',
                title: 'Direct Video Interviews',
                desc: 'Schedule live technical discussions directly with candidates with one click.'
              },
              {
                step: '04',
                title: 'Compliant Onboarding',
                desc: 'Standardized international contractor contracts and automated payroll invoicing.'
              }
            ].map((s) => (
              <div key={s.step} className="bg-[#171717] border border-[#303030] rounded-3xl p-7 relative">
                <span className="text-3xl font-extrabold text-[#404040] block mb-4 font-mono">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-[#F5F5F5] mb-2">{s.title}</h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Roles & Sample Candidates */}
      <section id="roles" className="py-24 px-6 border-b border-[#303030]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
                Active Profiles & Roles
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
                Featured engineering requisitions.
              </h2>
            </div>
            <Link to="/app/talents">
              <Button variant="secondary" size="sm" icon={ExternalLink} iconPosition="right" className="text-xs">
                Browse Full LatAm Directory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRoles.map((role, idx) => (
              <div
                key={idx}
                className="bg-[#171717] border border-[#303030] rounded-3xl p-6 flex flex-col justify-between hover:border-[#404040] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#303030] mb-4">
                    <span className="text-[11px] font-mono text-[#777777]">{role.location}</span>
                    <Badge variant="open" size="sm">Available</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">{role.title}</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">{role.summary}</p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {role.skills.map((skill) => (
                      <SkillIcon key={skill} skill={skill} />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#303030] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#777777] block uppercase font-medium">Monthly Comp</span>
                    <span className="text-xs font-bold text-[#F5F5F5]">{role.compensation}</span>
                  </div>
                  <Link to="/app/recommended">
                    <Button variant="secondary" size="sm" className="text-xs">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Candidate Evaluation and Matching Explanation */}
      <section id="matching" className="py-24 px-6 border-b border-[#303030] bg-[#101010]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
                Explainable Matching Engine
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight mb-4">
                Calibrated algorithms. No opaque claims.
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed mb-6">
                Hirevoxa calculates candidate compatibility deterministically. Every score on your dashboard shows an exact breakdown of why a talent matches your open requisition.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Technical Stack Overlap', weight: '50% Weight', desc: 'Direct intersection between required skills and candidate competencies.' },
                  { label: 'Verified Relevant Experience', weight: '25% Weight', desc: 'Years in target stack and architectural scope of previous projects.' },
                  { label: 'Timezone Synchronicity', weight: '15% Weight', desc: 'Proximity to team operational hours across US continental timezones.' },
                  { label: 'Immediate Availability', weight: '10% Weight', desc: 'Readiness to start immediately or within a two-week transition window.' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#171717] border border-[#303030]">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-[#F5F5F5]">{item.label}</h4>
                      <span className="text-[10px] font-mono text-[#A3A3A3] bg-[#202020] px-2 py-0.5 rounded-full border border-[#303030]">
                        {item.weight}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A3A3A3]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Live Match Breakdown Card */}
            <div className="lg:col-span-7 bg-[#171717] border border-[#303030] rounded-3xl p-8">
              <div className="flex items-center justify-between pb-4 border-b border-[#303030] mb-6">
                <div>
                  <span className="text-xs text-[#777777]">Evaluation Matrix Demo</span>
                  <h4 className="text-base font-bold text-[#F5F5F5]">Match Compatibility breakdown</h4>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#202020] border border-[#303030] text-xs font-mono font-bold text-[#F5F5F5]">
                  Score: 8.8 / 10
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A3A3A3]">React + TypeScript + Node Stack Alignment</span>
                    <span className="font-mono text-[#F5F5F5]">100% (5.0 / 5.0)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-[#F5F5F5] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A3A3A3]">Seniority (7 Years Experience vs 4 Req.)</span>
                    <span className="font-mono text-[#F5F5F5]">92% (2.3 / 2.5)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-[#A3A3A3] rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A3A3A3]">Timezone Alignment (São Paulo • GMT-3 • 1 hr from EST)</span>
                    <span className="font-mono text-[#F5F5F5]">100% (1.5 / 1.5)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-[#F5F5F5] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#A3A3A3]">Availability (Immediate Start)</span>
                    <span className="font-mono text-[#F5F5F5]">100% (1.0 / 1.0)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                    <div className="h-full bg-[#10B981] rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-[#202020] border border-[#303030] flex items-center justify-between text-xs">
                <span className="text-[#A3A3A3]">Candidate shortlisted for Senior Frontend Requisition.</span>
                <Link to="/app">
                  <Button variant="secondary" size="sm" className="text-xs">
                    Test in Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Benefits: For Companies vs For Candidates */}
      <section className="py-24 px-6 border-b border-[#303030]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Companies */}
            <div className="bg-[#171717] border border-[#303030] rounded-3xl p-8 sm:p-10">
              <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
                For US Startups & Tech Companies
              </span>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-6">Scale engineering capacity without friction.</h3>
              <ul className="space-y-4 text-xs text-[#A3A3A3]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Direct timezone overlap with San Francisco, New York, Austin, and Chicago.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Pre-screened technical competence and proven track record with US codebases.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Single-click interview scheduling and standardized contractor onboarding.</span>
                </li>
              </ul>
            </div>

            {/* For Candidates */}
            <div className="bg-[#171717] border border-[#303030] rounded-3xl p-8 sm:p-10">
              <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
                For Latin American Software Engineers
              </span>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-6">High-impact remote roles with US tech leaders.</h3>
              <ul className="space-y-4 text-xs text-[#A3A3A3]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Competitive USD-denominated compensation paid directly and transparently.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Work on modern stacks with venture-backed AI, fintech, and enterprise software startups.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Complete privacy controls over your resume, rate expectations, and profile status.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-24 px-6 border-b border-[#303030] bg-[#101010]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-[#777777] font-semibold block mb-2">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F5F5F5] tracking-tight">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#171717] border border-[#303030] rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-[#F5F5F5]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#777777] transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-[#A3A3A3] leading-relaxed border-t border-[#303030] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-24 px-6 border-b border-[#303030]">
        <div className="max-w-4xl mx-auto text-center bg-[#171717] border border-[#303030] rounded-3xl p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
            Build your LatAm engineering team today.
          </h2>
          <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-xl mx-auto mb-8 leading-relaxed">
            Discover verified senior talent across Brazil, Argentina, Colombia, and Mexico ready for immediate interview requests.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setShowHireModal(true)}
              className="text-xs uppercase tracking-wider font-bold px-8 py-3.5"
            >
              Find Your Next Engineer
            </Button>
            <Link to="/app">
              <Button variant="secondary" size="lg" className="text-xs uppercase tracking-wider font-semibold px-6 py-3.5">
                Launch Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="py-12 px-6 bg-[#090909] border-t border-[#303030]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#777777]">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link to="/" className="flex items-center transition-opacity hover:opacity-90">
              <img
                src="/images/hirevoxa-logo.png"
                alt="Hirevoxa — Engineering Talent, Amplified"
                className="h-8 md:h-9 w-auto object-contain hidden sm:block"
              />
              <img
                src="/images/hirevoxa-icon.png"
                alt="Hirevoxa — Engineering Talent, Amplified"
                className="h-7 w-7 object-contain block sm:hidden"
              />
            </Link>
            <span>© {new Date().getFullYear()} Hirevoxa Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/app" className="hover:text-white transition-colors">Workspace</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

      {/* Requisition Intake Modal */}
      <Modal
        isOpen={showHireModal}
        onClose={() => {
          setShowHireModal(false);
          setHireSubmitted(false);
        }}
        title="Find Your Next Engineer"
        subtitle="Submit technical specifications for customized LatAm talent shortlisting."
      >
        {hireSubmitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">Requisition Received</h4>
            <p className="text-xs text-[#A3A3A3] mt-2 max-w-sm mx-auto leading-relaxed">
              Your engineering role specifications have been registered. You can immediately review matching profiles in your workspace.
            </p>
            <Link to="/app">
              <Button className="mt-6" variant="primary">
                Open Workspace Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setHireSubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Target Engineering Role</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Frontend React Engineer"
                className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Primary Tech Stack</label>
                <input
                  type="text"
                  required
                  placeholder="React, TypeScript, Node"
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#777777]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Target Monthly Budget (USD)</label>
                <input
                  type="text"
                  defaultValue="$4,500 - $6,000/mo"
                  className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Timezone Alignment</label>
              <select className="w-full bg-[#202020] border border-[#303030] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]">
                <option>Eastern Time (EST) +/- 2 hours</option>
                <option>Central Time (CST) +/- 2 hours</option>
                <option>Pacific Time (PST) +/- 2 hours</option>
                <option>Any Latin American Hub</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowHireModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Requisition
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
