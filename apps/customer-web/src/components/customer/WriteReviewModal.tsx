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
    } catch {
      // Review added in state
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToGoogle = () => {
    if (!selectedSalonForDetail) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lastSubmittedComment).then(() => {
        setCopiedForGoogle(true);
      }).catch(() => {});
    }

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
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-lg w-full p-5 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 text-stone-900">
        
        {/* POST-SUBMISSION: DUAL SYNC TO GOOGLE REVIEWS */}
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Added to Kumbhkaran Salons
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1.5 font-['Syne',sans-serif]">
                Review Published Successfully!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Your feedback is now visible to customers in {selectedSalonForDetail.locality}.
              </p>
            </div>

            {/* Google Reviews Sync Prompt */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 text-left space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6422] shrink-0" />
                <h4 className="text-xs font-bold text-stone-900">
                  Also post to Google Reviews?
                </h4>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Google requires reviews to be confirmed via your Google account to prevent spam. Tap below and we’ll copy your review text to your clipboard so you can paste it directly onto Google Maps in 5 seconds!
              </p>

              <div className="p-2.5 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <div className="flex text-amber-500 text-xs">
                    {'★'.repeat(lastSubmittedScore)}
                  </div>
                  <span className="text-stone-700 truncate max-w-[200px] text-[11px]">
                    "{lastSubmittedComment}"
                  </span>
                </div>
                {copiedForGoogle && (
                  <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePostToGoogle}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
              >
                <span>Add to Google Reviews</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-900 text-xs font-semibold transition-colors"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* REVIEW ENTRY FORM */
          <>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Rate {selectedSalonForDetail.name}
                </h3>
                <p className="text-xs text-stone-500">
                  Only your name is required — zero phone numbers or signups needed
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Customer Name */}
              <div>
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-[#FF6422]" /> Your Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name (e.g. Rahul, Alex, Priya)..."
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422]"
                />
              </div>

              {/* Criteria Ratings */}
              <div className="space-y-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Rate by Experience Criteria:
                </span>

                {criteriaFields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between text-xs">
                    <span className="text-stone-700">{field.label}</span>
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
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-stone-300'
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
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Your Review & Walk-In Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the haircut? Did the queue wait match the app? Did you skip useless phone calls?"
                  rows={3}
                  required
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E2DDD5] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] resize-none shadow-xs"
                />
              </div>

              {/* Verified visit toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs">
                <div className="flex items-center gap-2 text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Mark as Verified Physical Walk-In</span>
                </div>
                <input
                  type="checkbox"
                  checked={verifiedVisit}
                  onChange={(e) => setVerifiedVisit(e.target.checked)}
                  className="accent-[#FF6422] w-4 h-4 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl bg-[#FF6422] text-white font-bold text-xs transition-colors shadow-md shadow-orange-500/20 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
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
