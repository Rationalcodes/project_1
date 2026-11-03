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
    <div className="space-y-6 pb-28 text-slate-100">
      {/* Zero-Hassle Customer Profile Header */}
      <div className="bg-gradient-to-br from-[#1c1c25] via-[#14141c] to-[#0c0c10] border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-2xl shadow-xl border-2 border-amber-300">
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
                  className="px-2.5 py-1 bg-zinc-900 border border-amber-400 rounded-xl text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-500 text-black font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white truncate">
                  {userProfile.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                  title="Edit your name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Zero-Sign Up Walk-In Access
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 mt-1">
              No phone number or password required. Pure walk-in clarity.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <div
            onClick={() => setCustomerTab('favourites')}
            className="cursor-pointer hover:bg-zinc-800/40 p-2 rounded-xl transition-colors"
          >
            <div className="text-lg font-black text-amber-400">{userProfile.savedSalons.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Favourites</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-white">{userProfile.recentlyViewed.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Viewed</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-emerald-400">{userReviews.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Reviews</div>
          </div>
        </div>
      </div>

      {/* Customer Name Setting Card */}
      <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-amber-400" />
          Your Display Name
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-zinc-200 font-semibold">Customer Name</div>
            <div className="text-[10px] text-zinc-500">Only your name is displayed when you leave reviews</div>
          </div>

          <button
            onClick={() => setIsEditingName(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs text-amber-400 font-bold"
          >
            {userProfile.name || 'Set Name'}
          </button>
        </div>
      </section>

      {/* Location & Discovery Preferences */}
      <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Location & Search Preferences
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-zinc-300">Default Discovery Locality</span>
          <span className="font-semibold text-white">{userLocation.name}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-zinc-800/60">
          <span className="text-zinc-300">Discovery Radius</span>
          <select
            value={preferredRadius}
            onChange={(e) => {
              setPreferredRadius(e.target.value);
              triggerNotification(`Discovery radius updated to ${e.target.value}`);
            }}
            className="bg-zinc-900 border border-zinc-700 text-xs text-amber-400 rounded-lg px-2 py-1 font-semibold focus:outline-none"
          >
            <option value="3 km">3 km</option>
            <option value="5 km">5 km</option>
            <option value="10 km">10 km</option>
            <option value="15 km">15 km</option>
          </select>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          Alerts & Push Notifications
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-zinc-200 font-semibold">Short Queue Walk-In Alerts</div>
            <div className="text-[10px] text-zinc-500">Notify when favourite salons have &lt; 3 waiting</div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => {
              setNotificationsEnabled(e.target.checked);
              triggerNotification(e.target.checked ? "Queue notifications turned ON" : "Queue notifications turned OFF");
            }}
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-zinc-800/60">
          <div>
            <div className="text-zinc-200 font-semibold">Stale Queue Warnings</div>
            <div className="text-[10px] text-zinc-500">Warn me when salon queue data is &gt; 30 mins old</div>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
        </div>
      </section>

      {/* Customer Review History */}
      <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Your Review History ({userReviews.length})
        </h3>

        {userReviews.length === 0 ? (
          <p className="text-xs text-zinc-500">
            You haven't reviewed any salons yet. Visit a studio and rate your experience!
          </p>
        ) : (
          <div className="space-y-2.5">
            {userReviews.map((rev) => (
              <div key={rev.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{rev.salonName}</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
                <p className="text-zinc-400 italic">"{rev.comment}"</p>
                <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1">
                  <span>{rev.date}</span>
                  {rev.verifiedVisit && (
                    <span className="text-emerald-400">✓ Verified Walk-In</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Privacy Promise Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-zinc-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <strong className="text-zinc-200">Kumbhakaran Privacy Philosophy:</strong> We do not track personal phone numbers, spam WhatsApp, or sell user records. You only enter your name to discover live salon queues.
        </div>
      </div>
    </div>
  );
};
