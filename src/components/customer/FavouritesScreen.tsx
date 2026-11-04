import React from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/SalonContext';
import { Heart, Bell, Trash2, ArrowRight, Users, Clock, Navigation, Star } from 'lucide-react';

export const FavouritesScreen: React.FC = () => {
  const {
    salons,
    userProfile,
    toggleFavorite,
    setSelectedSalonForDetail,
    setCustomerTab,
    triggerNotification,
    genderFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';
  const savedSalons = salons.filter(s => userProfile.savedSalons.includes(s.id));

  return (
    <div className="space-y-5 pb-28 text-stone-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight">
            {isWomen ? 'Favourite Beauty Studios' : 'Favourite Grooming Spots'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Keep an instant eye on live walk-in queues at your top studios
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-xs ${
          isWomen
            ? 'bg-rose-50 border-rose-200 text-[#E11D48]'
            : 'bg-orange-50 border-orange-200 text-[#FF6422]'
        }`}>
          <Heart className={`w-3.5 h-3.5 ${isWomen ? 'fill-[#E11D48]' : 'fill-[#FF6422]'}`} />
          <span>{savedSalons.length} Saved</span>
        </div>
      </div>

      {/* Queue Alert Settings Banner */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs ${
        isWomen
          ? 'bg-gradient-to-r from-rose-50 via-pink-50/40 to-white border-[#FED7CC]'
          : 'bg-gradient-to-r from-orange-50 via-amber-50/40 to-white border-orange-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isWomen
              ? 'bg-rose-100 text-[#E11D48]'
              : 'bg-orange-100 text-[#FF6422]'
          }`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Smart Short Queue Alerts</h4>
            <p className="text-[11px] text-stone-500">
              Get notified when any favourite studio queue drops below 3 people.
            </p>
          </div>
        </div>

        <button
          onClick={() => triggerNotification("Queue push alerts enabled for your favourite studios")}
          className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs transition-colors shrink-0 shadow-xs ${
            isWomen
              ? 'bg-[#E11D48] hover:bg-rose-700'
              : 'bg-[#FF6422] hover:bg-orange-600'
          }`}
        >
          {userProfile.notifyOnShortQueue ? 'Active' : 'Enable'}
        </button>
      </div>

      {savedSalons.length === 0 ? (
        <div className={`bg-white border rounded-3xl p-10 text-center space-y-3 shadow-sm ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <Heart className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-900">No Favourites Added Yet</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Tap the heart icon on any studio card to save it here for quick walk-in monitoring.
          </p>
          <button
            onClick={() => setCustomerTab('explore')}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors inline-block shadow-xs ${
              isWomen
                ? 'bg-[#E11D48] hover:bg-rose-700'
                : 'bg-[#FF6422] hover:bg-orange-600'
            }`}
          >
            Discover Studios
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
                className={`bg-white border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all cursor-pointer shadow-[0_2px_12px_rgba(40,20,10,0.04)] hover:shadow-xl ${
                  isWomen
                    ? 'rounded-3xl border-[#FED7CC] hover:border-rose-400 hover:bg-[#FFFDFB]'
                    : 'rounded-2xl border-[#E8E2D8] hover:border-orange-400 hover:bg-[#FFFDF9]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img src={salon.coverImage} alt={salon.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      {salon.name}
                      <span className="text-amber-800 text-xs font-semibold flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {salon.rating}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">{salon.locality} • {salon.distanceKm} km</p>
                    <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{freshness.text}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                  isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
                }`}>
                  {/* Live Queue Badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-center ${queueInfo.badgeClass}`}>
                    <div className="text-base font-extrabold flex items-center justify-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{salon.currentQueue}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700">
                      ~{waitTime}m wait
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(salon.id);
                      }}
                      className="p-2 rounded-xl bg-white border border-[#E2DDD5] text-stone-400 hover:text-rose-500 transition-colors shadow-xs"
                      title="Remove from favourites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedSalonForDetail(salon)}
                      className={`px-3.5 py-1.5 rounded-xl text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                        isWomen
                          ? 'bg-[#E11D48] hover:bg-rose-700'
                          : 'bg-[#FF6422] hover:bg-orange-600'
                      }`}
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
