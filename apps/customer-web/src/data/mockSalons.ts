import { Salon, CustomerProfile } from '@kumbhakaran/shared-types';

/**
 * Kumbhakaran Platform - Production Salon State
 * Hardcoded mock and demo salons ("The Gentleman Studio", "Urban Blade Barbershop",
 * "Scissors & Razor Lounge", "Desi Ustad Barber Club", "Krooz Unisex Studio",
 * "Royale Heritage Spa & Cuts") have been permanently removed.
 *
 * All salon listings are loaded strictly from the live PostgreSQL database.
 */
export const INITIAL_SALONS: Salon[] = [];

export const INITIAL_USER: CustomerProfile = {
  name: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  savedSalons: [],
  recentlyViewed: [],
  patiencePreference: 'all',
  preferredLocality: '',
  notifyOnShortQueue: true,
  queueAlertThreshold: 2,
};
