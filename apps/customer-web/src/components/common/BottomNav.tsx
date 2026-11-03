import React from 'react';
import { Home, Compass, Map, Heart, User } from 'lucide-react';
import { useSalon } from '../../context/CustomerContext';
import { CustomerTab } from '@kumbhakaran/shared-types';

export const BottomNav: React.FC = () => {
  const { customerTab, setCustomerTab, setSelectedSalonForDetail, userProfile } = useSalon();

  const navItems: { id: CustomerTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'favourites', label: 'Favourites', icon: Heart, badgeCount: userProfile.savedSalons.length },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto sm:max-w-none">
      <div className="mx-auto px-4 pb-3 pt-1">
        <div className="bg-[#121217]/95 backdrop-blur-xl border border-zinc-800/90 rounded-2xl shadow-2xl p-1.5 flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = customerTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedSalonForDetail(null); // return to tab root
                  setCustomerTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-semibold bg-amber-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[10px] mt-1 transition-colors ${isActive ? 'text-amber-400 font-semibold' : 'text-zinc-400'}`}>
                  {item.label}
                </span>

                {/* Subtle active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
