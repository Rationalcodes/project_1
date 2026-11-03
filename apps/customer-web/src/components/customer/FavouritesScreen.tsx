import React from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/CustomerContext';
import { Heart, Bell, Trash2, ArrowRight, Users, Clock, Navigation, Star } from 'lucide-react';

export const FavouritesScreen: React.FC = () => {
  const {
    salons,
    userProfile,
    toggleFavorite,
    setSelectedSalonForDetail,
    setCustomerTab,
    triggerNotification
  } = useSalon();

  const savedSalons = salons.filter(s => userProfile.savedSalons.includes(s.id));

  return (
    <div className="space-y-5 pb-28 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight font-['Syne',sans-serif]">
            Favourite Grooming Spots
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Keep an instant eye on live walk-in queues at your top salons
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
          <Heart className="w-3.5 h-3.5 fill-amber-400" />
          <span>{savedSalons.length} Saved</span>
        </div>
      </div>

      {/* Queue Alert Settings Banner */}
      <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900/80 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Smart Short Queue Alerts</h4>
            <p className="text-[11px] text-zinc-400">
              Get notified when any favourite studio queue drops below 3 people.
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerNotification("Queue push alerts enabled for your favourite salons")}
          className="px-3 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-colors shrink-0"
        >
          {userProfile.notifyOnShortQueue ? 'Active' : 'Enable'}
        </button>
      </div>

      {savedSalons.length === 0 ? (
        <div className="bg-[#14141b] border border-zinc-800 rounded-3xl p-10 text-center space-y-3">
          <Heart className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Favourites Added Yet</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Tap the heart icon on any salon card to save it here for quick walk-in monitoring.
          </p>
          <button
            onClick={() => setCustomerTab('explore')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors inline-block"
          >
            Discover Salons
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {savedSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
            const freshness = getQueueFreshness(salon.lastQueueUpdate);

            return (
              <div
                key={salon.id}
                onClick={() => setSelectedSalonForDetail(salon)}
                className="bg-[#15151d] hover:bg-[#1a1a24] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <img src={salon.coverImage} alt={salon.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {salon.name}
                      <span className="text-amber-400 text-xs font-semibold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" /> {salon.rating}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">{salon.locality} • {salon.distanceKm} km</p>
                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{freshness.text}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  {/* Live Queue Badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-center ${queueInfo.badgeClass}`}>
                    <div className="text-base font-extrabold flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{salon.currentQueue}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-400">
                      ~{waitTime}m wait
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(salon.id);
                      }}
                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove from favourites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedSalonForDetail(salon)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1"
                    >
                      <span>View</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
