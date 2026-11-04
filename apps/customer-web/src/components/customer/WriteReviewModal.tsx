import React, { useState } from 'react';
import { useSalon } from '../../context/CustomerContext';
import { Star, X, CheckCircle2, User, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';

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

  // Dual review sync states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedForGoogle, setCopiedForGoogle] = useState(false);
  const [lastSubmittedScore, setLastSubmittedScore] = useState(5);
  const [lastSubmittedComment, setLastSubmittedComment] = useState('');

  if (!isOpen || !selectedSalonForDetail) return null;

  const handleClose = () => {
    setIsSubmitting(false);
    setIsSubmitted(false);
    setCopiedForGoogle(false);
    setComment('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !comment.trim()) return;
    setIsSubmitting(true);

    try {
      const finalName = customerName.trim() || userProfile.name || 'Anonymous Customer';
      if (finalName !== userProfile.name) {
        updateCustomerName(finalName);
      }

      const avgScore = Number(
        ((haircutQuality + staffBehaviour + cleanliness + pricing + overallExperience) / 5).toFixed(1)
      );

      await addReview(selectedSalonForDetail.id, {
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
          overallExperience,
        },
      });

      setLastSubmittedScore(Math.round(avgScore));
      setLastSubmittedComment(comment);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToGoogle = () => {
    navigator.clipboard.writeText(lastSubmittedComment);
    setCopiedForGoogle(true);

    const salon = selectedSalonForDetail as any;
    const url = salon.googlePlaceId
      ? `https://search.google.com/local/writereview?placeid=${salon.googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.name + ' ' + salon.locality)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const criteriaFields = [
    { label: 'Haircut & Styling Quality', val: haircutQuality, setVal: setHaircutQuality },
    { label: 'Staff Behaviour & Hospitality', val: staffBehaviour, setVal: setStaffBehaviour },
    { label: 'Cleanliness & Hygiene', val: cleanliness, setVal: setCleanliness },
    { label: 'Pricing & Value for Money', val: pricing, setVal: setPricing },
    { label: 'Overall Experience', val: overallExperience, setVal: setOverallExperience },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121217] border border-zinc-800 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* POST-SUBMISSION: DUAL SYNC TO GOOGLE REVIEWS */}
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Added to Kumbhkaran Salons
              </span>
              <h3 className="text-lg font-black text-white mt-1.5 font-['Syne',sans-serif]">
                Review Published Successfully!
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Your feedback is now visible to customers in {selectedSalonForDetail.locality}.
              </p>
            </div>

            {/* Google Reviews Sync Prompt */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left space-y-3 shadow-inner">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-bold text-white">
                  Also post to Google Reviews?
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Google requires reviews to be confirmed via your Google account to prevent spam. Tap below and we’ll copy your review text to your clipboard so you can paste it directly onto Google Maps in 5 seconds!
              </p>

              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(lastSubmittedScore)}
                  </div>
                  <span className="text-zinc-300 truncate max-w-[200px] text-[11px]">
                    "{lastSubmittedComment}"
                  </span>
                </div>
                {copiedForGoogle && (
                  <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePostToGoogle}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <span>Add to Google Reviews</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* REVIEW ENTRY FORM */
          <>
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
                onClick={handleClose}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-1">
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
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-400'
                  }`}
                >
                  {isSubmitting ? 'Publishing Review...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
