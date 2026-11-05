import { Salon, CustomerProfile } from '@kumbhakaran/shared-types';

export const INITIAL_SALONS: Salon[] = [];

export const INITIAL_USER: CustomerProfile = {
  id: 'guest',
  name: '',
  phone: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  savedSalons: [],
  bookingHistory: [],
  recentlyViewed: [],
  preferences: {
    preferredServices: ['Hair'],
    preferredBarberGender: 'any',
    maxWaitToleranceMinutes: 20,
    notificationEnabled: true,
  },
};
