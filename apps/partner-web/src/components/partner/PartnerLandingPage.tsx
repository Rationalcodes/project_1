import React, { useState } from 'react';
import {
  Store,
  Scissors,
  Users,
  QrCode,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Printer,
  ChevronRight,
  Zap,
  Star,
  Check,
  Play,
  Plus,
  Minus,
  MapPin,
  DollarSign,
  ShieldCheck,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import logoFallback from '../../assets/logo.png';

interface PartnerLandingPageProps {
  onStartRegistration: () => void;
  onOpenSignIn: () => void;
  onExploreDemo: () => void;
  onGoogleSuccess: (credential: string, clientId?: string) => void;
}

type SubPageTab = 'offerings' | 'simulator' | 'standee' | 'calculator' | 'setup';

export const PartnerLandingPage: React.FC<PartnerLandingPageProps> = ({
  onStartRegistration,
  onOpenSignIn,
  onExploreDemo,
}) => {
  const { t } = useLanguage();

  // Page-in-page active sub-page state
  const [activeTab, setActiveTab] = useState<SubPageTab>('offerings');

  // Simulator state
  const [simQueue, setSimQueue] = useState(3);
  const [simChairs, setSimChairs] = useState(3);
  const simWaitMins = Math.max(0, Math.round((simQueue * 16) / Math.max(1, simChairs)));

  // Calculator state
  const [calcChairs, setCalcChairs] = useState(3);
  const [calcPrice, setCalcPrice] = useState(150);
  const extraWalkinsDaily = Math.round(calcChairs * 1.5);
  const extraMonthlyCash = extraWalkinsDaily * calcPrice * 30;

  const tabs = [
    { id: 'offerings' as const, label: 'What You Get', icon: Sparkles, badge: '4 Benefits' },
    { id: 'simulator' as const, label: 'Live Chair Simulator', icon: Users, badge: 'Interactive' },
    { id: 'standee' as const, label: 'Counter QR Standee', icon: QrCode, badge: 'Printable' },
    { id: 'calculator' as const, label: 'Earnings Calculator', icon: DollarSign, badge: 'Extra Cash' },
    { id: 'setup' as const, label: '3-Min Launch', icon: Zap, badge: 'Simple' },
  ];

  return (
    <div className="w-full text-stone-900 space-y-6 py-2 sm:py-4 selection:bg-orange-500/20 selection:text-orange-950">
      {/* =========================================================================
       * COMPACT HERO: Catchy, Point-to-Point, Clean Warm Canvas
       * ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-[#E8E2D8] p-5 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF3EC] border border-[#FED7CC] text-[#E05326] text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#E05326] animate-pulse" />
            <span>SLOON • India's #1 Salon Queue Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight font-serif">
            Stop Losing Customers to <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E05326] via-[#D4481D] to-orange-600">
              Crowded Waiting Benches.
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
            Customers check your live queue on Google Maps and walk in right when a chair is ready. No crowded benches, no phone interruptions, zero commission on cash.
          </p>

          {/* Point to Point Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              100% Cash Stays With You
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-[#E05326] stroke-[2.5]" />
              Zero Machine Needed
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 font-semibold flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5 text-[#E05326] stroke-[2.5]" />
              Setup in 3 Minutes
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartRegistration}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#E05326] hover:bg-[#D0481E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Store className="w-4 h-4 text-white" />
              <span>Register Salon Free</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              type="button"
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <Play className="w-3.5 h-3.5 text-[#E05326] fill-[#FFF3EC]" />
              <span>Open Live Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * PAGE-IN-PAGE CONTAINER: Sub-Page Nav Tabs + Focused View Area
       * ========================================================================= */}
      <div className="rounded-3xl bg-white border border-[#E8E2D8] shadow-xs overflow-hidden">
        {/* Page-in-Page Navigation Bar */}
        <div className="border-b border-[#E8E2D8] bg-[#FAF7F2] p-2 sm:p-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#18181B] text-white shadow-xs font-bold'
                      : 'bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200/70 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E05326]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page-in-Page Content Area */}
        <div className="p-4 sm:p-7 md:p-8">
          {/* ===================================================================
           * SUB-PAGE 1: WHAT YOU GET (Point to Point Cards)
           * =================================================================== */}
          {activeTab === 'offerings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-black text-stone-900">The 4 Big Things SLOON Gives Your Salon</h3>
                  <p className="text-xs text-stone-500">Everything needed to attract walk-ins and run chairs smoothly.</p>
                </div>
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="self-start sm:self-auto text-xs font-bold text-[#E05326] hover:text-[#D0481E] flex items-center gap-1 cursor-pointer"
                >
                  <span>Start in 3 mins</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Live Queue on Map */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] border border-[#FED7CC] flex items-center justify-center text-[#E05326]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-900">1. Live Queue on Customer Map</h4>
                      <p className="text-[11px] text-stone-500">Nearby clients see wait time before leaving home</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Clients don't leave because of crowded benches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Shows exact wait time (e.g. 15 min, 2 waiting)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tap + / - on counter to update in 1 second</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Counter QR Standee */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] border border-[#FED7CC] flex items-center justify-center text-[#E05326]">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-900">2. Printable Counter QR Standee</h4>
                      <p className="text-[11px] text-stone-500">Print in 1 click for your front counter</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Walk-ins scan with phone camera to check place</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ready-to-print luxury design on standard A4 paper</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero paper registers, zero fighting over turns</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Keep 100% Cash */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-900">3. Zero Commission on Cash</h4>
                      <p className="text-[11px] text-stone-500">100% of your earnings stay in your hand</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Collect directly in cash or your own counter UPI QR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>No bank delays, no hidden platform cuts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Runs on any regular smartphone you already own</span>
                    </li>
                  </ul>
                </div>

                {/* 4. Stylist & Chair Management */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] border border-[#FED7CC] flex items-center justify-center text-[#E05326]">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-900">4. Stylist & Rush Tracking</h4>
                      <p className="text-[11px] text-stone-500">See cuts served per barber & peak hours</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Track daily haircuts completed by each stylist</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Live hourly rush chart (know peak rush 5 PM – 8 PM)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified Google & in-app reviews build trust</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
           * SUB-PAGE 2: LIVE SIMULATOR (Interactive Counter & Chairs)
           * =================================================================== */}
          {activeTab === 'simulator' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-2 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-stone-900">Live Chair & Queue Simulator</h3>
                  <p className="text-xs text-stone-500">Test clicking + and - below to see how wait time recalculates live.</p>
                </div>
                <div className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC] self-start sm:self-auto">
                  ● Real-time Math
                </div>
              </div>

              {/* Counter Control Strip */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] uppercase font-bold text-stone-500">Waiting Customers</div>
                    <div className="text-2xl font-black text-[#E05326]">{simQueue} People</div>
                  </div>
                  <div className="pl-4 border-l border-stone-200 text-center sm:text-left">
                    <div className="text-[10px] uppercase font-bold text-stone-500">Estimated Wait</div>
                    <div className="text-2xl font-black text-stone-900">~{simWaitMins} Min</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 mr-2 hidden sm:inline">Counter Buttons:</span>
                  <button
                    type="button"
                    onClick={() => setSimQueue((prev) => Math.max(0, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 font-black text-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-2xs"
                    title="Customer haircut completed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimQueue((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white font-black text-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs shadow-orange-500/20"
                    title="New walk-in arrived"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chair Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Array.from({ length: simChairs }).map((_, idx) => {
                  const isBusy = idx < Math.min(simChairs, simQueue > 0 ? 2 : 0);
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isBusy
                          ? 'bg-[#FFF3EC] border-[#FED7CC] text-stone-900 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-600 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-stone-900">Chair #{idx + 1}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isBusy ? 'bg-orange-100 text-[#E05326]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isBusy ? 'In Service' : 'Ready'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {isBusy ? 'Haircut in progress (~10m remaining)' : 'Ready for next walk-in'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Customer Phone Notification Mock */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-3 text-xs shadow-2xs">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  📱
                </span>
                <div className="flex-1">
                  <div className="font-bold text-stone-900">What your customers see on their phone:</div>
                  <div className="text-stone-500 text-[11px]">
                    "Adarsh Men's Parlour: {simQueue} waiting (~{simWaitMins} min). Walk in now!"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
           * SUB-PAGE 3: COUNTER QR STANDEE (Printable Preview)
           * =================================================================== */}
          {activeTab === 'standee' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-2 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-stone-900">Printable Counter QR Standee</h3>
                  <p className="text-xs text-stone-500">Put this on your front desk so walk-ins scan to check queue.</p>
                </div>
                <button
                  type="button"
                  onClick={onStartRegistration}
                  className="px-3.5 py-1.5 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-bold self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  Generate For Your Salon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Visual Standee Card */}
                <div className="max-w-xs mx-auto w-full rounded-3xl bg-white border-2 border-[#E8E2D8] p-6 text-center space-y-4 shadow-xl">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC] text-[10px] font-black uppercase tracking-wider">
                    SLOON Partner Standee
                  </div>
                  <div>
                    <h4 className="font-black text-stone-900 text-base font-serif">Your Studio Name</h4>
                    <p className="text-[11px] text-stone-500">Scan to view live queue & wait time</p>
                  </div>

                  {/* QR Box */}
                  <div className="w-40 h-40 mx-auto bg-[#FAF7F2] p-3 rounded-2xl flex items-center justify-center border border-stone-200 shadow-inner">
                    <QrCode className="w-32 h-32 text-stone-800" />
                  </div>

                  <div className="text-[11px] font-bold text-[#E05326]">
                    ⚡ No App Download Needed
                  </div>
                </div>

                {/* Catchy 3 Steps */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-stone-900 text-sm">How it works on your counter:</h4>
                    <p className="text-xs text-stone-500">Zero tech knowledge required. Works with any mobile camera.</p>
                  </div>

                  <div className="space-y-3 text-xs text-stone-700">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                      <span className="w-6 h-6 rounded-lg bg-[#18181B] text-white font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <strong className="text-stone-900">Print from browser:</strong> Click print on any regular printer or laminate for an acrylic stand.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                      <span className="w-6 h-6 rounded-lg bg-[#18181B] text-white font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div>
                        <strong className="text-stone-900">Customer scans:</strong> Customer opens phone camera, scans QR, and joins the queue instantly.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8]">
                      <span className="w-6 h-6 rounded-lg bg-[#E05326] text-white font-black text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <strong className="text-stone-900">Zero crowding:</strong> Customer can wait outside, drink tea, and step in right when chair is free!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
           * SUB-PAGE 4: EARNINGS CALCULATOR (Direct Value)
           * =================================================================== */}
          {activeTab === 'calculator' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-2 border-b border-stone-200">
                <h3 className="text-lg font-black text-stone-900">Extra Revenue Estimator</h3>
                <p className="text-xs text-stone-500">How much extra money you capture by stopping queue drop-offs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  {/* Chairs Slider */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>Chairs in Your Salon:</span>
                      <span className="text-[#E05326] text-sm font-black">{calcChairs} Chairs</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={calcChairs}
                      onChange={(e) => setCalcChairs(Number(e.target.value))}
                      className="w-full accent-[#E05326] cursor-pointer"
                    />
                  </div>

                  {/* Price Slider */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                      <span>Average Haircut / Service Price:</span>
                      <span className="text-[#E05326] text-sm font-black">₹{calcPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="500"
                      step="20"
                      value={calcPrice}
                      onChange={(e) => setCalcPrice(Number(e.target.value))}
                      className="w-full accent-[#E05326] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Big Result Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFF3EC] via-white to-white border-2 border-[#FED7CC] text-center space-y-3 shadow-xs">
                  <div className="text-[11px] uppercase font-black tracking-wider text-stone-500">
                    Estimated Extra Cash in Your Pocket
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#E05326] font-serif">
                    +₹{extraMonthlyCash.toLocaleString('en-IN')} <span className="text-xs text-stone-500 font-sans font-normal">/ month</span>
                  </div>
                  <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                    By saving ~<strong className="text-stone-900 font-black">{extraWalkinsDaily} walk-ins per day</strong> who would otherwise turn back due to a crowded room.
                  </p>
                  <div className="pt-2 border-t border-stone-200 text-[11px] text-emerald-700 font-bold">
                    ✓ 0% commission. You keep every rupee.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
           * SUB-PAGE 5: 3-MINUTE LAUNCH & FAQS (Quick Steps)
           * =================================================================== */}
          {activeTab === 'setup' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-2 border-b border-stone-200">
                <h3 className="text-lg font-black text-stone-900">Launch in 3 Simple Minutes</h3>
                <p className="text-xs text-stone-500">No bank visits, no paperwork. Straight from your phone.</p>
              </div>

              {/* 4 Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">1-Tap Google Sign In</h4>
                  <p className="text-[11px] text-stone-500">No long forms or password hassle.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">Shop Name & Chairs</h4>
                  <p className="text-[11px] text-stone-500">Tell us how many chairs you operate.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">Pin Map Location</h4>
                  <p className="text-[11px] text-stone-500">Tap map so nearby users route to you.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-[#E05326] text-white font-black text-xs flex items-center justify-center">
                    4
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">Print QR & Live!</h4>
                  <p className="text-[11px] text-stone-500">Start welcoming walk-ins today.</p>
                </div>
              </div>

              {/* Instant FAQs */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <strong className="text-stone-900 text-xs block">Need a tablet?</strong>
                  <span className="text-[11px] text-stone-500 block">No! Runs on any normal smartphone or counter laptop.</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <strong className="text-stone-900 text-xs block">Any commission on cash?</strong>
                  <span className="text-[11px] text-stone-500 block">Zero. 100% of your haircut price is paid directly to you.</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
                  <strong className="text-stone-900 text-xs block">Can I add multiple shops?</strong>
                  <span className="text-[11px] text-stone-500 block">Yes! Manage multiple branches from one partner login.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Permanent Action Bar inside Page-in-Page */}
        <div className="border-t border-[#E8E2D8] bg-[#FAF7F2] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600 text-center sm:text-left">
            <span className="font-bold text-stone-900">Join hundreds of salon owners.</span> Get verified in 3 minutes.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Partner Sign In
            </button>
            <button
              type="button"
              onClick={onStartRegistration}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Register Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
