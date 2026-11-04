import React from 'react';
import { useSalon } from '../../context/SalonContext';
import { Bell, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notificationMessage, triggerNotification } = useSalon();

  if (!notificationMessage) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 max-w-sm w-full px-4">
      <div className="bg-white/95 border border-[#E2DDD5] text-stone-900 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF6422] flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-stone-800">{notificationMessage}</span>
        </div>
        <button
          onClick={() => triggerNotification('')}
          className="text-stone-400 hover:text-stone-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
