import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import logoFallback from '../../assets/logo.png';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Store,
  RefreshCw,
  Edit3,
  LogOut,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface PendingApprovalScreenProps {
  onEditDetails?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ onEditDetails }) => {
  const { activeSalon, partnerUser, checkApprovalStatus, logout, setPartnerView } = useSalon();
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  if (!activeSalon) return null;

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      const isApproved = await checkApprovalStatus();
      if (!isApproved) {
        setCheckResult('Status: In Review. Your application is currently awaiting administrator authorization at SLOON HQ.');
      }
    } catch {
      setCheckResult('Could not reach verification server. Please verify your connection.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4 px-2 sm:px-0 text-[#241810] animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            src={logoFallback}
            alt="SLOON"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-stone-700 border border-[#E8E0D5]">
            Partner OS
          </span>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E0D5] text-stone-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Approval Gate Hero Card */}
      <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        {/* Animated Status Beacon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Administrator Authorization</span>
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#241810] tracking-tight">
            Your Studio is Awaiting Admin Access
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Welcome to the SLOON platform! To protect customer trust and guarantee genuine studio locations, every newly registered salon is reviewed by our administration before operational platform access is granted.
          </p>
        </div>

        {/* Live Status Checker Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1E130D] hover:bg-stone-800 text-[#FAF5EE] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking HQ Status...' : 'Check Approval Status'}</span>
          </button>

          {onEditDetails && (
            <button
              type="button"
              onClick={onEditDetails}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-stone-100 border border-[#E8E0D5] text-[#241810] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-500" />
              <span>Edit Submitted Details</span>
            </button>
          )}
        </div>

        {checkResult && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 max-w-md mx-auto animate-in fade-in">
            {checkResult}
          </div>
        )}
      </div>

      {/* Review Workflow Timeline */}
      <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Onboarding & Verification Steps
        </h3>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              ✓
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-stone-900">Application Submitted</div>
              <p className="text-[11px] text-stone-500">
                Studio coordinates, contact details, and initial service rates successfully received.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 animate-pulse">
              2
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-950">Administrator Review & Pinpoint Check</div>
              <p className="text-[11px] text-amber-800">
                SLOON HQ is verifying studio location accuracy and contact authenticity. Average turnaround: under 24 hours.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 opacity-60">
            <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-stone-700">Platform Access & Live Queue Unlocked</div>
              <p className="text-[11px] text-stone-500">
                Your salon appears on the customer app, and your live walk-in desk is unlocked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Studio Dossier */}
      <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#C85322]" />
            <h3 className="text-xs font-bold text-[#241810] uppercase tracking-wider">
              Submitted Application Dossier
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
            ID: {activeSalon.id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
            <span className="text-stone-500 text-[11px] block">Studio Name</span>
            <span className="font-bold text-[#241810] text-sm">{activeSalon.name}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
            <span className="text-stone-500 text-[11px] block">Location & Locality</span>
            <span className="font-bold text-[#241810]">{activeSalon.locality}, {activeSalon.city}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
            <span className="text-stone-500 text-[11px] block">Registered Owner & Contact</span>
            <span className="font-bold text-[#241810]">{activeSalon.ownerName || partnerUser?.name} ({activeSalon.phone})</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
            <span className="text-stone-500 text-[11px] block">Coordinates</span>
            <span className="font-mono text-stone-700">{Number(activeSalon.coordinates.lat).toFixed(4)}, {Number(activeSalon.coordinates.lng).toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Expedited Verification & Support Contact */}
      <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-[#241810] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#C85322]" />
            <span>Need Fast-Track Authorization?</span>
          </div>
          <p className="text-stone-600 text-[11px]">
            If you are launching today or need immediate verification, contact our Partner Onboarding Desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919179144544"
            className="px-4 py-2 rounded-full bg-white border border-[#E8E0D5] text-stone-800 hover:border-[#C85322] font-bold text-xs shadow-2xs transition-colors"
          >
            Call Support
          </a>
          <a
            href="mailto:partner@sloon.in"
            className="px-4 py-2 rounded-full bg-[#1E130D] text-white hover:bg-stone-800 font-bold text-xs shadow-2xs transition-colors"
          >
            Email HQ
          </a>
        </div>
      </div>
    </div>
  );
};
