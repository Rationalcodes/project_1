import React, { useState } from 'react';
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  QrCode,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Printer,
  Sparkles
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';

export const HelpSupportView: React.FC = () => {
  const { activeSalon, setPartnerView } = usePartner();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does updating the physical waiting count work?',
      a: 'When a new walk-in sits on your waiting bench, tap [+]. When a customer sits in a barber chair to begin their service, tap [−]. That is it! The count broadcasts live to customers on Google Maps and SLOON so they know when to walk in.',
    },
    {
      q: 'Does SLOON support online appointment bookings or digital tokens?',
      a: 'No. SLOON strictly reflects actual physical waiting counts. Customers do not book time slots or hold digital queue tokens. This prevents no-shows and keeps your chairs filled with real walk-in clients who are physically present.',
    },
    {
      q: 'How do I print the Counter QR Standee for my reception desk?',
      a: 'Go to the Live Queue desk or click "Standee (A4)" in the top header. Click "Print Standee (A4)" to print directly on any standard office printer. Place it in a plastic stand or frame on your cash counter.',
    },
    {
      q: 'Do I need any specialized POS hardware or tablet?',
      a: 'Zero hardware required. You can manage the platform directly from your existing Android or iPhone, or an existing laptop/desktop browser at your reception counter.',
    },
    {
      q: 'Is there any commission on cash or UPI payments?',
      a: '0% commission. Customers pay you directly at your counter via cash or your existing shop QR code. SLOON never touches or takes a percentage of your service earnings.',
    },
    {
      q: 'How do I update my salon prices and services?',
      a: 'Navigate to "Services & Pricing" in the left sidebar. You can edit prices inline, pause temporary unavailable services, or add new combo packages anytime.',
    },
  ];

  return (
    <div className="space-y-6 text-stone-900 max-w-4xl">
      {/* Header Bar */}
      <div className="pb-3 border-b border-stone-200">
        <h2 className="text-xl font-black font-serif tracking-tight text-stone-900">
          Help & Support Desk
        </h2>
        <p className="text-xs text-stone-500 font-medium">
          Operational guides, best practices, and direct contact channels for {activeSalon?.name || 'your studio'}.
        </p>
      </div>

      {/* 3 Quick Help Guides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white border border-[#E7DED5] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] text-[#FF6422] flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Live Queue Best Practice</h3>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            Keep your count updated at each chair transition. Salons with fresh waiting counts get 3× more walk-in visits.
          </p>
          <button
            type="button"
            onClick={() => setPartnerView('live-queue')}
            className="text-[11px] font-bold text-[#FF6422] hover:underline cursor-pointer block pt-1"
          >
            Open Live Queue Desk →
          </button>
        </div>

        <div className="bg-white border border-[#E7DED5] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] text-[#FF6422] flex items-center justify-center font-bold">
            <Printer className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Print Counter Standee</h3>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            Place your A4 QR standee on the reception counter so walk-in clients can scan with any smartphone camera.
          </p>
          <button
            type="button"
            onClick={() => setPartnerView('live-queue')}
            className="text-[11px] font-bold text-[#FF6422] hover:underline cursor-pointer block pt-1"
          >
            Preview Standee →
          </button>
        </div>

        <div className="bg-white border border-[#E7DED5] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] text-[#FF6422] flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">Verification Support</h3>
          <p className="text-stone-500 leading-relaxed text-[11px]">
            Need to update your salon coordinates or verify newly added barber chairs? Our team reviews changes within 2 hours.
          </p>
          <a
            href="mailto:support@sloon.in"
            className="text-[11px] font-bold text-[#FF6422] hover:underline cursor-pointer block pt-1"
          >
            Email Support HQ →
          </a>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white border border-[#E7DED5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <BookOpen className="w-4 h-4 text-[#FF6422]" />
          <h3 className="text-sm font-black text-stone-900 font-serif">
            Frequently Asked Operational Questions
          </h3>
        </div>

        <div className="divide-y divide-stone-100">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left flex items-center justify-between gap-3 text-xs font-bold text-stone-900 hover:text-[#FF6422] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-stone-600 leading-relaxed pr-6 animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Channels */}
      <div className="bg-white border border-[#E7DED5] rounded-3xl p-5 sm:p-6 shadow-2xs">
        <h3 className="text-sm font-black text-stone-900 font-serif mb-3">
          Direct Partner Support Channels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="mailto:support@sloon.in"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] hover:border-orange-300 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white text-[#FF6422] flex items-center justify-center font-bold border border-stone-200 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-stone-900 group-hover:text-[#FF6422] transition-colors">
                Email Technical Desk
              </div>
              <div className="text-[11px] text-stone-500">support@sloon.in • Responds in 2 hours</div>
            </div>
          </a>

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7DED5] hover:border-orange-300 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold border border-stone-200 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp Partner Hotline
              </div>
              <div className="text-[11px] text-stone-500">Live chat for urgent counter assistance</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
