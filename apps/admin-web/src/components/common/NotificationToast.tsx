import React from 'react';
import { useSalon } from '../../context/AdminContext';
import { Bell, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notificationMessage, triggerNotification } = useSalon();

  if (!notificationMessage) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 max-w-sm w-full px-4">
      <div className="bg-zinc-900/95 border border-amber-500/40 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-200">{notificationMessage}</span>
        </div>
        <button
          onClick={() => triggerNotification('')}
          className="text-zinc-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
