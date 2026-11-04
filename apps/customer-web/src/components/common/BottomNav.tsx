import React from 'react';
import { Home, Compass, MapPin, Heart, User } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';
import { CustomerTab } from '@kumbhakaran/shared-types';

export const BottomNav: React.FC = () => {
  const { customerTab, setCustomerTab, setSelectedSalonForDetail, userProfile } = useCustomer();

  const navItems: { id: CustomerTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'favourites', label: 'Saved', icon: Heart, badgeCount: userProfile.savedSalons.length },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pt-3 pb-safe max-w-full">
      <div className="max-w-md mx-auto px-2 xs:px-4 pb-2">
        <div className="bg-white/95 backdrop-blur-xl border border-[#E8E2D8] rounded-3xl shadow-[0_4px_20px_rgba(40,20,10,0.08)] p-1 xs:p-1.5 flex items-center justify-around ring-1 ring-black/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = customerTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab(item.id);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 xs:px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#FF6422] font-bold bg-orange-50'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 xs:w-5 xs:h-5 transition-transform ${isActive ? 'scale-110 text-[#FF6422]' : ''}`} />
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-[#FF6422] text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[9px] xs:text-[10px] mt-0.5 transition-colors ${isActive ? 'text-[#FF6422] font-bold' : 'text-stone-500'}`}>
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF6422]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
