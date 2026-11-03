import React, { useState } from 'react';
import { useSalon } from '../../context/CustomerContext';
import { Star, X, CheckCircle2, User } from 'lucide-react';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ isOpen, onClose }) => {
  const { selectedSalonForDetail, addReview, userProfile, updateCustomerName } = useSalon();

  const [customerName, setCustomerName] = useState(userProfile.name || '');
  const [comment, setComment] = useState('');
  const [haircutQuality, setHaircutQuality] = useState(5);
  const [staffBehaviour, setStaffBehaviour] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [pricing, setPricing] = useState(5);
  const [overallExperience, setOverallExperience] = useState(5);
  const [verifiedVisit, setVerifiedVisit] = useState(true);

  if (!isOpen || !selectedSalonForDetail) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const finalName = customerName.trim() || userProfile.name || 'Anonymous Customer';
    if (finalName !== userProfile.name) {
      updateCustomerName(finalName);
    }

    const avgScore = Number(
      ((haircutQuality + staffBehaviour + cleanliness + pricing + overallExperience) / 5).toFixed(1)
    );

    addReview(selectedSalonForDetail.id, {
      customerName: finalName,
      customerAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating: Math.round(avgScore),
      comment,
      verifiedVisit,
      criteria: {
        haircutQuality,
        staffBehaviour,
        cleanliness,
        pricing,
        overallExperience
      }
    });

    setComment('');
    onClose();
  };

  const criteriaFields = [
    { label: 'Haircut & Styling Quality', val: haircutQuality, setVal: setHaircutQuality },
    { label: 'Staff Behaviour & Hospitality', val: staffBehaviour, setVal: setStaffBehaviour },
    { label: 'Cleanliness & Hygiene', val: cleanliness, setVal: setCleanliness },
    { label: 'Pricing & Value for Money', val: pricing, setVal: setPricing },
    { label: 'Overall Experience', val: overallExperience, setVal: setOverallExperience }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121217] border border-zinc-800 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">
              Rate {selectedSalonForDetail.name}
            </h3>
            <p className="text-xs text-zinc-400">
              Only your name is required — zero phone numbers or signups needed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Frictionless: Customer Name Only */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Your Name
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name (e.g. Rahul, Alex, Priya)..."
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Criteria Ratings */}
          <div className="space-y-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Rate by Experience Criteria:
            </span>

            {criteriaFields.map((field) => (
              <div key={field.label} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{field.label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.setVal(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= field.val
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment text area */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Your Review & Walk-In Feedback
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the haircut? Did the queue wait match the app? Did you skip useless phone calls?"
              rows={3}
              required
              className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none shadow-inner"
            />
          </div>

          {/* Verified visit toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mark as Verified Physical Walk-In</span>
            </div>
            <input
              type="checkbox"
              checked={verifiedVisit}
              onChange={(e) => setVerifiedVisit(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
