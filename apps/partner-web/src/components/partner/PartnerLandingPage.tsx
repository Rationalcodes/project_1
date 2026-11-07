import React, { useState } from 'react';
import {
  Store,
  Scissors,
  Users,
  QrCode,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Printer,
  ChevronRight,
  HelpCircle,
  Zap,
  Star,
  Check,
  Sliders,
  Play,
  RotateCcw,
  Plus,
  Minus,
  Building,
  Award,
  Layers,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import { useLanguage } from '../../i18n/LanguageContext';
import logoWhite from '../../assets/logo-white.png';
import logoFallback from '../../assets/logo.png';

interface PartnerLandingPageProps {
  onStartRegistration: () => void;
  onOpenSignIn: () => void;
  onExploreDemo: () => void;
  onGoogleSuccess: (credential: string, clientId?: string) => void;
}

export const PartnerLandingPage: React.FC<PartnerLandingPageProps> = ({
  onStartRegistration,
  onOpenSignIn,
  onExploreDemo,
  onGoogleSuccess,
}) => {
  const { t, languageInfo } = useLanguage();

  // Interactive Live Queue Simulator State on Homepage
  const [simQueue, setSimQueue] = useState(3);
  const [simChairs, setSimChairs] = useState(3);
  const [calculatorChairs, setCalculatorChairs] = useState(3);
  const [calculatorAvgTicket, setCalculatorAvgTicket] = useState(150);

  // Dynamic calculations for the ROI Calculator
  const estimatedSavedCustomersPerDay = Math.round(calculatorChairs * 1.5);
  const estimatedExtraMonthlyRevenue = estimatedSavedCustomersPerDay * calculatorAvgTicket * 30;

  // Simulator stats
  const simWaitMins = Math.max(0, Math.round((simQueue * 18) / Math.max(1, simChairs)));

  return (
    <div className="w-full text-slate-100 space-y-16 sm:space-y-24 py-4 sm:py-8 selection:bg-amber-500/30 selection:text-amber-300">
      {/* =========================================================================
       * 1. HERO SECTION: Value Proposition & High-Impact Visuals
       * ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#14141d] via-[#101016] to-[#0a0a0d] border border-zinc-800/80 p-6 sm:p-10 md:p-14 shadow-2xl">
        {/* Ambient Warm Amber Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>SLOON Partner OS • Built for Indian Barbershops & Salons</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Turn Waiting-Room Crowds into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
              Predictable Salon Revenue.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate customer walkouts caused by packed waiting benches. SLOON provides real-time queue telemetry, instant counter QR check-ins, and automated chair turnaround tracking.
          </p>

          {/* Key Trust Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              0% Commission on Cash
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Zero Hardware Required
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Ready in 3 Minutes
            </span>
          </div>

          {/* Action Callouts */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onStartRegistration}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Store className="w-4 h-4 text-black" />
              <span>Register Your Salon Free</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>

            <button
              type="button"
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 hover:text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>Test Drive Live Demo</span>
            </button>
          </div>

          {/* One-Tap Sign In Prompt for Existing Partners */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span>Already a registered partner?</span>
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-amber-400 hover:text-amber-300 font-extrabold underline underline-offset-4 cursor-pointer transition-colors"
            >
              Sign In to Your Dashboard →
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. INTERACTIVE LIVE QUEUE & CHAIR SIMULATOR (Try Before You Sign In)
       * ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Interactive Live Experience
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            See How Your Salon Counter Works in Real Time
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Test the live queue controls right now. As walk-ins arrive or chairs free up, customer wait times update instantly on the customer map.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-3xl bg-[#13131b] border border-amber-500/30 p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Studio Simulation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                ✂
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">Your Studio Name</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ● Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Counter Desk View • {simChairs} Active Chairs</p>
              </div>
            </div>

            {/* Live Queue Badge */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Live Queue</div>
                <div className="text-xl font-black text-amber-400">{simQueue} waiting</div>
              </div>
              <div className="text-right pl-3 border-l border-zinc-800">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Est. Wait</div>
                <div className="text-xl font-black text-white">~{simWaitMins} min</div>
              </div>
            </div>
          </div>

          {/* Simulator Chair Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: simChairs }).map((_, idx) => {
              const isOccupied = idx < Math.min(simChairs, simQueue > 0 ? 2 : 0);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isOccupied
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white">Chair #{idx + 1}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        isOccupied ? 'bg-amber-500/25 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isOccupied ? 'In Service' : 'Ready'}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {isOccupied ? 'Haircut + Styling (~12m remaining)' : 'Available for next walk-in'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Controls on the simulator */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-300">
              <span className="font-bold text-white">Try Queue Counter:</span> Click + or - to simulate walk-in customers arriving.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSimQueue((prev) => Math.max(0, prev - 1))}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                title="Customer completed or departed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-12 text-center font-black text-lg text-amber-400">
                {simQueue}
              </div>
              <button
                type="button"
                onClick={() => setSimQueue((prev) => prev + 1)}
                className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md shadow-amber-500/20"
                title="New customer arrived at salon"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 3. THE 5 CORE OFFERINGS (What We Provide to You)
       * ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            What SLOON Offers You
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            Everything You Need to Run a Modern Salon
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Built from scratch for Indian salon realities. Simple enough for single-chair barbers, powerful enough for multi-chair luxury studios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Walk-In Queue Telemetry */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">1. Live Walk-In Queue Telemetry</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Customers see your live queue count and estimated wait times on the map from home or office. They arrive right when a chair is ready instead of overcrowding your benches.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>One-tap + / - counter buttons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Zero hardware or tablet setup needed</span>
              </li>
            </ul>
          </div>

          {/* 2. Instant Counter QR Desk Standee */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">2. Printable Counter QR Standee</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate a ready-to-print luxury front-desk standee in 1 click. Walk-in customers scan with any phone camera to check in or track their position live.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Print directly from browser to A4 / Acrylic</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Instant QR link to share on WhatsApp</span>
              </li>
            </ul>
          </div>

          {/* 3. Chair & Stylist Management */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">3. Stylist & Chair Allocation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Assign active haircuts to individual barbers. Track chair turnaround speed, manage staff attendance, and display verified stylist ratings to clients.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Individual stylist profiles & photos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Track cuts served per barber daily</span>
              </li>
            </ul>
          </div>

          {/* 4. Real-time Revenue & Settlement Analytics */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">4. Daily Revenue & Rush Analytics</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Know your peak walk-in rush hours (e.g. 5 PM to 8 PM) so you can staff appropriately. Real-time telemetry starts realistically from ₹0 every morning.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Daily walk-in counts & popular services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Peak hour rush distribution chart</span>
              </li>
            </ul>
          </div>

          {/* 5. Service & Pricing Catalog */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">5. Transparent Service Catalog</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Set transparent pricing for haircuts, shaves, beard trims, and facials. Customers see exact prices and duration before stepping into your salon.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Add, update, or pause services instantly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Unisex, Men-only, or Women-only categorization</span>
              </li>
            </ul>
          </div>

          {/* 6. Multi-Language Automatic Translation */}
          <div className="p-6 rounded-3xl bg-[#14141c] border border-zinc-800/90 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-500/5 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">6. 100% Indian Language Support</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Switch seamlessly between English, Hindi, and Marathi with 1 tap. Built to ensure every salon owner and barber feels completely at home.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>English as default with instant Hindi / Marathi</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Clean translation with zero spinning badges</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 4. OLD WAY VS. SLOON PARTNER WAY (Comparison)
       * ========================================================================= */}
      <section className="rounded-3xl bg-[#111118] border border-zinc-800 p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            The Competitive Edge
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Why Modern Salons Switch to SLOON
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Traditional Way */}
          <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm uppercase tracking-wider">
              <span>✕ The Old Traditional Way</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span>Customers walk in, see 5 people waiting on the bench, and immediately turn back to go to a competitor.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span>Frequent arguments over "whose turn was next" due to unmanaged manual walk-ins.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span>Barbers constantly interrupted by phone calls asking: "Bhai kitna time lagega?"</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span>Zero customer data, no verified Google reviews, and paper registers getting lost.</span>
              </li>
            </ul>
          </div>

          {/* The SLOON Partner Way */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm uppercase tracking-wider">
              <span>✓ The SLOON Partner Way</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-200">
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                <span>Customers check your live wait time from anywhere and arrive right on schedule. 0 walkouts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                <span>Sequential digital tickets with QR standee scanning. Perfectly fair, transparent turns.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                <span>Clients see the live queue on map directly. Phone calls drop by 80%, barbers stay focused on cutting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                <span>Real-time daily revenue tracking, verified ratings, and repeat customer retention.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 5. REVENUE & EXTRA WALK-IN CALCULATOR (CEO Perspective)
       * ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-r from-[#171722] via-[#13131c] to-[#101016] border border-amber-500/30 p-6 sm:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg">
            <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ROI & Revenue Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              How Much Extra Revenue Will SLOON Bring You?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              By displaying live wait times, you eliminate walkout drop-offs during rush hours and turn waiting bench chaos into steady, continuous chair occupancy.
            </p>

            {/* Slider 1: Chairs */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Number of Chairs in Your Salon:</span>
                <span className="text-amber-400 text-sm">{calculatorChairs} Chairs</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={calculatorChairs}
                onChange={(e) => setCalculatorChairs(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Average Service Ticket */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Average Service Price:</span>
                <span className="text-amber-400 text-sm">₹{calculatorAvgTicket}</span>
              </div>
              <input
                type="range"
                min="80"
                max="600"
                step="20"
                value={calculatorAvgTicket}
                onChange={(e) => setCalculatorAvgTicket(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-amber-500/40 text-center space-y-4 min-w-[280px] shadow-2xl">
            <div className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">
              Estimated Monthly Extra Earnings
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-['Syne',sans-serif]">
              +₹{estimatedExtraMonthlyRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-400 max-w-xs mx-auto">
              Based on capturing ~<strong className="text-white">{estimatedSavedCustomersPerDay} extra walk-ins</strong> every day that would otherwise turn back due to crowded waiting rooms.
            </div>
            <div className="pt-2 border-t border-zinc-800 text-[11px] text-emerald-400 font-bold">
              ✓ 100% of this goes straight into your pocket
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 6. 3-MINUTE ONBOARDING WALKTHROUGH
       * ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Frictionless Setup
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Get Your Salon Live in 4 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            No complex documents or bank visits. Register straight from your phone in under 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#14141c] border border-zinc-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-extrabold text-white text-sm">Identity & Contact</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your salon name, category (Unisex, Men, or Women), and owner contact phone.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#14141c] border border-zinc-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-extrabold text-white text-sm">Interactive GPS Pin</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tap the map to set your exact salon coordinates so nearby customers find you on turn-by-turn routing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#14141c] border border-zinc-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-extrabold text-white text-sm">Chairs & Timings</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Specify your number of active chairs and working hours (e.g. 9:00 AM – 9:30 PM).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#14141c] border border-zinc-800 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-sm flex items-center justify-center">
              4
            </div>
            <h3 className="font-extrabold text-white text-sm">Print QR & Go Live!</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly print your counter desk QR standee and start accepting transparent walk-ins.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 7. FREQUENTLY ASKED QUESTIONS (Owner Trust & Clarity)
       * ========================================================================= */}
      <section className="rounded-3xl bg-[#13131b] border border-zinc-800/90 p-6 sm:p-10 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[11px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <h4 className="font-extrabold text-white text-xs sm:text-sm">Do I need to buy a POS machine or tablet?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No! SLOON runs seamlessly on any Android phone, iPhone, tablet, or desktop computer you already have.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <h4 className="font-extrabold text-white text-xs sm:text-sm">Is there any commission on cash payments?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero commission. You collect 100% of your service price directly from the customer in cash or via your own counter UPI QR.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <h4 className="font-extrabold text-white text-xs sm:text-sm">What if my internet is slow or temporarily down?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              SLOON caches your salon queue locally on your browser. Your counter controls continue to work even on low connectivity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <h4 className="font-extrabold text-white text-xs sm:text-sm">Can I register multiple salon branches?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Yes! You can manage multiple branches under a single partner account and switch between them effortlessly from the top bar.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 8. BOTTOM HIGH-CONVERSION CTA BANNER
       * ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-8 sm:p-12 text-center text-black space-y-6 shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight">
            Ready to Take Your Salon into the Digital Era?
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-black/85 max-w-lg mx-auto leading-relaxed">
            Join hundreds of forward-thinking salon owners across India. Get verified, eliminate crowded benches, and delight your walk-in clients today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={onStartRegistration}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-black hover:bg-zinc-900 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-2xl transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Register Your Salon in 3 Mins</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={onOpenSignIn}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-black font-extrabold text-sm sm:text-base border border-black/20 transition-all cursor-pointer"
          >
            <span>Partner Sign In</span>
          </button>
        </div>
      </section>
    </div>
  );
};
