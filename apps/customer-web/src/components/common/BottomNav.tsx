import React from 'react';
import { Home, Compass, MapPin, Heart, User } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { CustomerTab } from '@kumbhakaran/shared-types';

export const BottomNav: React.FC = () => {
  const { customerTab, setCustomerTab, setSelectedSalonForDetail, genderFilter, comparisonList } = useCustomer();

  const isWomen = genderFilter === 'women';

  const navItems: {
    id: CustomerTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'favourites', label: 'Saved', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 pt-3 pb-safe max-w-full pointer-events-none transition-colors duration-300 md:hidden ${
        isWomen
          ? 'bg-gradient-to-t from-[#FFFBF9] via-[#FFFBF9]/95 to-transparent'
          : 'bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent'
      }`}
    >
      <div className="max-w-md mx-auto px-3 pb-2 pointer-events-auto">
        <div
          className={`backdrop-blur-xl border rounded-3xl p-1.5 flex items-center justify-around ring-1 ring-black/5 transition-all duration-300 ${
            isWomen
              ? 'bg-white/95 border-[#FCE7F3] shadow-[0_8px_24px_rgba(225,29,72,0.08)]'
              : 'bg-white/95 border-[#E8E2D8] shadow-[0_8px_24px_rgba(31,31,31,0.08)]'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = customerTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? isWomen
                      ? 'text-[#E11D48] font-black bg-rose-50/90'
                      : 'text-[#FF6422] font-black bg-orange-50'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? `scale-110 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}` : ''
                    }`}
                  />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span
                      className={`absolute -top-1 -right-2 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                        isWomen ? 'bg-[#E11D48]' : 'bg-[#FF6422]'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
                    isActive ? (isWomen ? 'text-[#E11D48] font-bold' : 'text-[#FF6422] font-bold') : 'text-stone-500'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span
                    className={`absolute -bottom-0.5 w-1.5 h-1.5 rounded-full ${
                      isWomen ? 'bg-[#E11D48]' : 'bg-[#FF6422]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
