import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  User,
  MapPin,
  Heart,
  Clock,
  Bell,
  Star,
  Sparkles,
  Edit2,
  Check,
  ShieldCheck
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    updateCustomerName,
    salons,
    setCustomerTab,
    triggerNotification,
    userLocation
  } = useSalon();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userProfile.notifyOnShortQueue);
  const [preferredRadius, setPreferredRadius] = useState('5 km');

  // Customer reviews across all salons
  const userReviews = salons.flatMap(s =>
    s.reviews
      .filter(r => r.customerName === userProfile.name)
      .map(r => ({ ...r, salonName: s.name, salonId: s.id }))
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateCustomerName(nameInput);
      setIsEditingName(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-stone-900">
      {/* Zero-Hassle Customer Profile Header */}
      <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-[#FF6422] flex items-center justify-center text-white font-extrabold text-2xl shadow-sm border-2 border-orange-300">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold shadow">
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  autoFocus
                  className="px-2.5 py-1 bg-[#FAF7F2] border border-[#FF6422] rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-[#FF6422] text-white font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-stone-900 truncate">
                  {userProfile.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-[#FF6422] transition-colors"
                  title="Edit your name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Zero-Sign Up Walk-In Access
              </span>
            </div>

            <p className="text-[11px] text-stone-500 mt-1">
              No phone number or password required. Pure walk-in clarity.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#E8E2D8] text-center">
          <div
            onClick={() => setCustomerTab('favourites')}
            className="cursor-pointer hover:bg-orange-50/50 p-2 rounded-xl transition-colors"
          >
            <div className="text-lg font-black text-[#FF6422]">{userProfile.savedSalons.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Favourites</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-stone-900">{userProfile.recentlyViewed.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Viewed</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-emerald-700">{userReviews.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Reviews</div>
          </div>
        </div>
      </div>

      {/* Customer Name Setting Card */}
      <section className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#FF6422]" />
          Your Display Name
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-stone-900 font-semibold">Customer Name</div>
            <div className="text-[10px] text-stone-500">Only your name is displayed when you leave reviews</div>
          </div>

          <button
            onClick={() => setIsEditingName(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E2DDD5] hover:border-[#FF6422] text-xs text-[#FF6422] font-bold shadow-xs"
          >
            {userProfile.name || 'Set Name'}
          </button>
        </div>
      </section>

      {/* Location & Discovery Preferences */}
      <section className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#FF6422]" />
          Location & Search Preferences
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-stone-700">Default Discovery Locality</span>
          <span className="font-semibold text-stone-900">{userLocation ? userLocation.name : 'Not set'}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-[#E8E2D8]">
          <span className="text-stone-700">Discovery Radius</span>
          <select
            value={preferredRadius}
            onChange={(e) => {
              setPreferredRadius(e.target.value);
              triggerNotification(`Discovery radius updated to ${e.target.value}`);
            }}
            className="bg-[#FAF7F2] border border-[#E2DDD5] text-xs text-stone-900 rounded-lg px-2 py-1 font-semibold focus:outline-none"
          >
            <option value="3 km">3 km</option>
            <option value="5 km">5 km</option>
            <option value="10 km">10 km</option>
            <option value="15 km">15 km</option>
          </select>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-[#FF6422]" />
          Alerts & Push Notifications
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-stone-900 font-semibold">Short Queue Walk-In Alerts</div>
            <div className="text-[10px] text-stone-500">Notify when favourite salons have &lt; 3 waiting</div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => {
              setNotificationsEnabled(e.target.checked);
              triggerNotification(e.target.checked ? "Queue notifications turned ON" : "Queue notifications turned OFF");
            }}
            className="accent-[#FF6422] w-4 h-4 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-[#E8E2D8]">
          <div>
            <div className="text-stone-900 font-semibold">Stale Queue Warnings</div>
            <div className="text-[10px] text-stone-500">Warn me when salon queue data is &gt; 30 mins old</div>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="accent-[#FF6422] w-4 h-4 rounded cursor-pointer"
          />
        </div>
      </section>

      {/* Customer Review History */}
      <section className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-[#FF6422]" />
          Your Review History ({userReviews.length})
        </h3>

        {userReviews.length === 0 ? (
          <p className="text-xs text-stone-500">
            You haven't reviewed any salons yet. Visit a studio and rate your experience!
          </p>
        ) : (
          <div className="space-y-2.5">
            {userReviews.map((rev) => (
              <div key={rev.id} className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">{rev.salonName}</span>
                  <div className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
                <p className="text-stone-600 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1">
                  <span>{rev.date}</span>
                  {rev.verifiedVisit && (
                    <span className="text-emerald-700 font-semibold">✓ Verified Walk-In</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Privacy Promise Banner */}
      <div className="bg-white border border-[#E8E2D8] p-3.5 rounded-2xl flex items-center gap-3 text-xs text-stone-600 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <strong className="text-stone-900">Kumbhkaran Privacy Philosophy:</strong> We do not track personal phone numbers, spam WhatsApp, or sell user records. You only enter your name to discover live salon queues.
        </div>
      </div>
    </div>
  );
};
