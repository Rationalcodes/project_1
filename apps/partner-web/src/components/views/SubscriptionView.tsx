import React from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';

export const SubscriptionView: React.FC = () => {
  const { activeSalon, partnerUser } = usePartner();

  return (
    <div className="space-y-6 text-stone-900 max-w-4xl">
      {/* Header Bar */}
      <div className="pb-3 border-b border-stone-200">
        <h2 className="text-xl font-black font-serif tracking-tight text-stone-900">
          Subscription & Billing
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          Manage your salon membership plan, review operational invariants, and download receipts.
        </p>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-white border border-[#E7DED5] rounded-3xl p-5 sm:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF5ED] border border-[#FED7CC] text-[#FF6422] text-[10px] font-black uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Current Active Plan</span>
            </div>
            <h3 className="text-2xl font-black text-stone-900 font-serif">
              SLOON Partner Founding Tier
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Studio: <strong className="text-stone-800">{activeSalon?.name || 'Active Studio'}</strong> • Account: {partnerUser?.email}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-3xl font-black text-stone-900 font-serif">
              ₹0 <span className="text-xs font-normal text-stone-500">/ month</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1">
              Active • 0% Commission
            </span>
          </div>
        </div>

        {/* Core Plan Guarantees & Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-stone-900">0% Commission on Cash & Direct UPI</div>
              <div className="text-stone-500 text-[11px] mt-0.5">
                All client payments collected at your salon remain 100% yours. No transaction cuts or payout withholding.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-stone-900">Real-Time Queue Discovery Broadcast</div>
              <div className="text-stone-500 text-[11px] mt-0.5">
                Physical waiting line syncs to nearby walk-in customers on Google Maps and SLOON discovery.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-stone-900">Printable Desk Standee QR (A4)</div>
              <div className="text-stone-500 text-[11px] mt-0.5">
                High-resolution ready-to-print standee for your reception desk so clients can scan with any camera.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-stone-900">Unlimited Staff & Menu Catalogue</div>
              <div className="text-stone-500 text-[11px] mt-0.5">
                Configure prices, master stylist chairs, and service descriptions with zero listing fees.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Invariants & Zero Hidden Fees Notice */}
      <div className="bg-white border border-[#E7DED5] rounded-3xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm font-serif">
          <ShieldCheck className="w-4 h-4 text-[#FF6422]" />
          <span>The SLOON Transparency Invariant</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          SLOON operates on an honest transparency model for Indian salon owners. We do not require salon owners to rent costly POS terminals, purchase proprietary hardware, or pay per-seat licenses. You control your physical waiting counter right on your existing smartphone or reception PC.
        </p>
      </div>

      {/* Invoice & Statement History Table */}
      <div className="bg-white border border-[#E7DED5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-black text-stone-900 font-serif">
              Billing History & Statements
            </h3>
            <p className="text-xs text-stone-500">Record of all platform subscription periods.</p>
          </div>
          <span className="text-xs font-bold text-stone-600 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-stone-400" />
            <span>1 Statement</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Plan Period</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              <tr>
                <td className="py-3 px-3 text-stone-900 font-semibold">01 Nov 2026</td>
                <td className="py-3 px-3 text-stone-700">Founding Partner Membership</td>
                <td className="py-3 px-3 text-stone-500">Nov 2026 – Nov 2027</td>
                <td className="py-3 px-3 font-black text-stone-900">₹0.00</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Paid / Complimentary
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6422] hover:underline cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
