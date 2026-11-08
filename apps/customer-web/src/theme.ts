/**
 * SLOON Design System Tokens & Dual-Experience Theme Engine
 * 
 * Supports:
 * - Men Experience: Warm Orange / Charcoal / Sand
 * - Women Experience: Rose / Ruby / Creamy Petal Blush
 */

import { Scissors, Package, Droplets, Smile, Palette, Sparkles, User, Sparkle, Heart } from 'lucide-react';
import React from 'react';

export type GenderExperience = 'men' | 'women';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
}

export interface ThemeTokens {
  experience: GenderExperience;
  // Brand colors
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryLight: string;
  // Background & Surfaces
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderHover: string;
  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Badges & Accents
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  // Gradients & Shadows
  canopyGradient: string;
  cardShadow: string;
  cardHoverShadow: string;
  activeIndicator: string;
  // Editorial Content
  heroTagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage: string;
  categories: CategoryItem[];
}

export const MEN_THEME: ThemeTokens = {
  experience: 'men',
  primary: '#FF6422',
  primaryHover: '#E05316',
  secondary: '#FF723A',
  secondaryLight: '#FFF4EE',
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F5EFE6',
  border: '#E8E2D8',
  borderHover: '#FED7AA',
  textPrimary: '#1F1F1F',
  textSecondary: '#6B625D',
  textMuted: '#9E948C',
  badgeBg: '#FFF4EE',
  badgeText: '#C2410C',
  badgeBorder: '#FED7AA',
  canopyGradient: 'bg-gradient-to-b from-[#FF723A] to-[#FF6422]',
  cardShadow: 'shadow-[0_4px_20px_rgba(31,31,31,0.04)]',
  cardHoverShadow: 'hover:shadow-[0_12px_28px_rgba(255,100,34,0.12)]',
  activeIndicator: 'bg-[#FF6422]',
  heroTagline: 'YOUR NEIGHBOURHOOD GROOMING NETWORK',
  heroHeadline: 'Fresh Look. No Unnecessary Waiting.',
  heroSubheadline: 'Discover verified barbershops and studios nearby. Check real physical waiting counts before heading out.',
  heroImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  categories: [
    {
      id: 'Hair',
      name: 'Haircut',
      description: 'Fade, trim, classic cuts',
      icon: Scissors,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Beard',
      name: 'Beard & Shave',
      description: 'Shape-up, hot towel shaving',
      icon: Scissors,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Combos',
      name: 'Grooming Combos',
      description: 'Hair + beard + wash packages',
      icon: Package,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Color',
      name: 'Hair Colour',
      description: 'Grey coverage, highlights, styling',
      icon: Palette,
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Facial',
      name: 'Facial & Cleanse',
      description: 'Detox, tan removal, grooming glow',
      icon: Smile,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Spa',
      name: 'Head Massage & Spa',
      description: 'Stress relief, deep conditioning',
      icon: Droplets,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
    },
  ],
};

export const WOMEN_THEME: ThemeTokens = {
  experience: 'women',
  primary: '#E11D48',
  primaryHover: '#BE123C',
  secondary: '#FFDFD6',
  secondaryLight: '#FFF1EE',
  bg: '#FFFBF9',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF0EA',
  border: '#FCE7F3',
  borderHover: '#FECDD3',
  textPrimary: '#3B1910',
  textSecondary: '#8A6A6A',
  textMuted: '#B89F9F',
  badgeBg: '#FFF1EE',
  badgeText: '#BE123C',
  badgeBorder: '#FECDD3',
  canopyGradient: 'bg-gradient-to-b from-[#FFDFD6] to-[#FFD0C4]',
  cardShadow: 'shadow-[0_4px_20px_rgba(225,29,72,0.04)]',
  cardHoverShadow: 'hover:shadow-[0_12px_28px_rgba(225,29,72,0.12)]',
  activeIndicator: 'bg-[#E11D48]',
  heroTagline: 'YOUR NEIGHBOURHOOD BEAUTY NETWORK',
  heroHeadline: 'Your Beauty, Your Way.',
  heroSubheadline: 'Discover trusted salons, explore verified services and check real-time studio availability with confidence.',
  heroImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
  categories: [
    {
      id: 'Hair',
      name: 'Hair Styling & Cut',
      description: 'Layers, blowdry, precision cut',
      icon: Scissors,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Color',
      name: 'Hair Colour & Balayage',
      description: 'Global highlights, root touchup',
      icon: Palette,
      image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Facial',
      name: 'Facial & Glow Care',
      description: 'Hydra facial, cleanups, brightening',
      icon: Smile,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Skin Care',
      name: 'Skin & Waxing',
      description: 'Rica, roll-on, full body waxing',
      icon: Sparkles,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Makeup',
      name: 'Makeup & Draping',
      description: 'Party, engagement, subtle glam',
      icon: Sparkle,
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Nails',
      name: 'Nails & Pedicure',
      description: 'Gel extensions, spa pedicure',
      icon: Heart,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Spa',
      name: 'Hair Spa & Massage',
      description: 'Kera-smooth, deep nourishment',
      icon: Droplets,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'Combos',
      name: 'Packages & Combos',
      description: 'Complete head-to-toe pampering',
      icon: Package,
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=400&q=80',
    },
  ],
};

export const getTheme = (experience: GenderExperience): ThemeTokens => {
  return experience === 'women' ? WOMEN_THEME : MEN_THEME;
};

/**
 * Standardized Live Queue thresholds & presentation metadata
 */
export interface QueuePresentation {
  count: number;
  label: string;
  detailLabel: string;
  statusType: 'zero' | 'low' | 'moderate' | 'busy' | 'paused' | 'closed';
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const getQueuePresentation = (
  waitingCount: number,
  isOpen: boolean = true,
  queueStatus: 'open' | 'paused' | 'closed' = 'open',
): QueuePresentation => {
  if (!isOpen || queueStatus === 'closed') {
    return {
      count: 0,
      label: 'Closed',
      detailLabel: 'Studio is closed for walk-ins',
      statusType: 'closed',
      dotColor: 'bg-stone-400',
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-600',
      badgeBorder: 'border-stone-200',
    };
  }
  if (queueStatus === 'paused') {
    return {
      count: waitingCount,
      label: 'Queue Paused',
      detailLabel: 'Current queue being served. Intake temporarily paused.',
      statusType: 'paused',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
    };
  }
  if (waitingCount <= 0) {
    return {
      count: 0,
      label: 'No Current Queue',
      detailLabel: 'Chairs available. Walk in now without waiting.',
      statusType: 'zero',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
    };
  }
  if (waitingCount <= 3) {
    return {
      count: waitingCount,
      label: 'Low Queue',
      detailLabel: `${waitingCount} ${waitingCount === 1 ? 'person' : 'people'} waiting. Fast turnaround.`,
      statusType: 'low',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
    };
  }
  if (waitingCount <= 7) {
    return {
      count: waitingCount,
      label: 'Moderate Queue',
      detailLabel: `${waitingCount} people currently waiting in studio.`,
      statusType: 'moderate',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
    };
  }
  return {
    count: waitingCount,
    label: 'Busy',
    detailLabel: `${waitingCount} people waiting in studio. Extended flow.`,
    statusType: 'busy',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
  };
};

export const getQueueFreshnessText = (lastQueueUpdate?: string | null) => {
  if (!lastQueueUpdate) {
    return { text: 'Queue count updated recently', isStale: false };
  }
  const diffMs = Date.now() - new Date(lastQueueUpdate).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 2) return { text: 'Updated just now', isStale: false };
  if (diffMins < 6) return { text: `Updated ${diffMins}m ago`, isStale: false };
  if (diffMins < 20) return { text: `Updated ${diffMins}m ago`, isStale: false };
  return { text: 'Queue information may be outdated', isStale: true };
};
