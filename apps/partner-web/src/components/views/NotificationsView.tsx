import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Star,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import { usePartner } from '../../context/PartnerContext';

export const NotificationsView: React.FC = () => {
  const { activeSalon, setPartnerView } = usePartner();
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Verification Approved by SLOON HQ',
      body: 'Your salon profile and pinpoint location have been reviewed and verified by platform administrators. Your salon is actively recommended in discovery searches.',
      date: 'Today, 10:15 AM',
      category: 'verification',
      isUnread: true,
      actionLabel: 'View Public Profile',
      actionView: 'profile' as const,
      type: 'success',
    },
    {
      id: 'notif-2',
      title: 'Queue Freshness Recommendation',
      body: 'Maintaining a fresh waiting count gives customers confidence to walk in. We recommend verifying or adjusting your waiting line count every 30 minutes during rush hours.',
      date: 'Today, 09:30 AM',
      category: 'alerts',
      isUnread: true,
      actionLabel: 'Update Live Queue',
      actionView: 'live-queue' as const,
      type: 'warning',
    },
    {
      id: 'notif-3',
      title: 'New Customer Review Received',
      body: 'Priya S. rated your salon 5.0 stars: "Loved the hygiene, zero waiting after checking SLOON, and expert styling by the master barber."',
      date: 'Yesterday, 06:40 PM',
      category: 'reviews',
      isUnread: false,
      actionLabel: 'Inspect & Reply',
      actionView: 'reviews' as const,
      type: 'info',
    },
    {
      id: 'notif-4',
      title: '0% Cash Commission Invariant Active',
      body: 'Reminder: SLOON never charges a percentage on in-store cash or direct UPI payments. 100% of customer payments collected at your salon remain yours.',
      date: '5 Nov 2026',
      category: 'billing',
      isUnread: false,
      actionLabel: 'View Subscription Policy',
      actionView: 'billing' as const,
      type: 'info',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.isUnread;
    if (filter === 'alerts') return n.type === 'warning';
    return true;
  });

  return (
    <div className="space-y-5 text-stone-900 max-w-4xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-black font-serif tracking-tight text-stone-900">
            Notification Centre
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            System notices, customer feedback alerts, and operational reminders for {activeSalon?.name || 'your studio'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'unread' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Unread ({notifications.filter((n) => n.isUnread).length})
            </button>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DED5] hover:bg-stone-50 text-xs font-bold text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Notifications Structured List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white border border-[#E7DED5] rounded-3xl p-10 text-center space-y-2 shadow-2xs">
          <Bell className="w-8 h-8 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-800">No notifications to display</h3>
          <p className="text-xs text-stone-500">You are all caught up on operational notices.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs flex items-start gap-4 ${
                notif.isUnread ? 'border-orange-300 ring-1 ring-orange-400/20 bg-[#FFFDFB]' : 'border-[#E7DED5]'
              }`}
            >
              {/* Type Indicator Icon */}
              <div className="shrink-0 mt-0.5">
                {notif.type === 'success' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : notif.type === 'warning' ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#FFF5ED] border border-[#FED7CC] text-[#FF6422] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Notification Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-black text-stone-900 truncate font-serif">
                      {notif.title}
                    </h3>
                    {notif.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#FF6422] shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-stone-400 shrink-0 font-medium">
                    {notif.date}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {notif.body}
                </p>

                {/* Direct Action Link */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPartnerView(notif.actionView)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6422] hover:text-[#E05326] transition-colors cursor-pointer group"
                  >
                    <span>{notif.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
