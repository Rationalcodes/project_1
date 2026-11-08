import React from 'react';
import { useSalon } from '../../context/CustomerContext';
import { Heart, Bell, ArrowRight, Store } from 'lucide-react';
import { getTheme } from '../../theme';
import { SalonCard } from '../common/SalonCard';

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

  const theme = getTheme(genderFilter);
  const isWomen = genderFilter === 'women';
  const savedSalons = salons.filter((s) => userProfile.savedSalons.includes(s.id));

  return (
    <div className="space-y-5 pb-28 text-stone-900 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {isWomen ? 'Favourite Beauty Studios' : 'Favourite Grooming Spots'}
            </h1>
            <span
              className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: theme.primary }}
            >
              {isWomen ? 'Women' : 'Men'}
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Keep an eye on live physical waiting lines at your top-frequented salons.
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black shadow-2xs"
          style={{
            backgroundColor: `${theme.primary}0D`,
            borderColor: `${theme.primary}33`,
            color: theme.primary,
          }}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>{savedSalons.length} Saved</span>
        </div>
      </div>

      {/* Queue Alert Settings Banner */}
      <div
        className="border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs bg-white"
        style={{ borderColor: theme.border }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}
          >
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-stone-900">Low Queue Notifications</h4>
            <p className="text-[11px] text-stone-500 font-medium">
              We monitor physical queues and alert you when your saved studios have fewer than 3 people waiting.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerNotification('Queue walk-in alerts active for your saved studios')}
          className="px-3.5 py-2 rounded-xl text-white font-bold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
          style={{ backgroundColor: theme.primary }}
        >
          {userProfile.notifyOnShortQueue ? 'Active' : 'Enable'}
        </button>
      </div>

      {/* Saved Salons List / Grid */}
      {savedSalons.length === 0 ? (
        <div
          className="bg-white border rounded-3xl p-10 text-center space-y-3 shadow-2xs"
          style={{ borderColor: theme.border }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}
          >
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-stone-900">No Favourite Studios Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Tap the heart icon on any salon card while exploring to keep track of its live waiting lines here.
          </p>
          <button
            type="button"
            onClick={() => setCustomerTab('explore')}
            className="mt-2 px-5 py-2.5 rounded-xl text-white font-black text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            style={{ backgroundColor: theme.primary }}
          >
            <span>Discover Studios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedSalons.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              onSelect={setSelectedSalonForDetail}
              isSaved={true}
              onToggleFavorite={toggleFavorite}
              experience={genderFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};
