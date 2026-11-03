import { Salon, CustomerProfile } from '../types';

export const INITIAL_SALONS: Salon[] = [
  {
    id: 'salon-1',
    name: 'The Gentleman Studio',
    tagline: 'Precision cuts, beard sculpting & timeless grooming',
    coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.8,
    reviewCount: 342,
    currentQueue: 3,
    avgServiceTimeMinutes: 18,
    activeBarbers: 3,
    distanceKm: 1.2,
    startingPrice: 150,
    isOpen: true,
    openingHours: {
      open: '08:30 AM',
      close: '09:30 PM',
      formatted: '8:30 AM – 9:30 PM (All Days)'
    },
    address: '42, 80 Feet Road, 4th Block, Koramangala',
    locality: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    coordinates: {
      lat: 12.9344,
      lng: 77.6258
    },
    phone: '+91 98450 12890',
    lastQueueUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    services: [
      { id: 's1', name: 'Signature Haircut', category: 'Hair', price: 150, durationMinutes: 25, isAvailable: true, description: 'Consultation, precision wash, scissor & clipper fade cut with hot towel finish.', popular: true },
      { id: 's2', name: 'Royal Beard Sculpt & Trim', category: 'Beard', price: 80, durationMinutes: 15, isAvailable: true, description: 'Straight razor edge lining, organic beard butter treatment, warm towel steam.', popular: true },
      { id: 's3', name: 'Haircut + Beard Styling Combo', category: 'Combos', price: 220, durationMinutes: 35, isAvailable: true, description: 'Complete gentleman makeover package with haircut, styling & beard contour.', popular: true },
      { id: 's4', name: 'Deep Conditioning Hair Spa', category: 'Spa', price: 400, durationMinutes: 40, isAvailable: true, description: 'Scalp detox, anti-dandruff massage, herbal steam and keratin replenishment.' },
      { id: 's5', name: 'Activated Charcoal Facial', category: 'Facial', price: 350, durationMinutes: 30, isAvailable: true, description: 'Pore cleansing, blackhead extraction, tan removal and cool mint hydration mask.' },
      { id: 's6', name: 'Natural Grey Camo / Hair Colour', category: 'Color', price: 500, durationMinutes: 35, isAvailable: true, description: 'Ammonia-free subtle blending for hair and beard.' }
    ],
    staff: [
      { id: 'st1', name: 'Arjun Verma', role: 'Master Barber & Stylist', experience: '8 Years', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', specialties: ['Taper Fade', 'Beard Art', 'Scissor Work'], status: 'active', rating: 4.9 },
      { id: 'st2', name: 'Sameer Sheikh', role: 'Senior Stylist', experience: '5 Years', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', specialties: ['Classic Pompadour', 'Head Massage'], status: 'active', rating: 4.8 },
      { id: 'st3', name: 'Karthik Raja', role: 'Skin & Grooming Specialist', experience: '6 Years', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', specialties: ['Charcoal Facial', 'Hot Towel Shave'], status: 'active', rating: 4.7 }
    ],
    ratingBreakdown: {
      haircutQuality: 4.9,
      staffBehaviour: 4.8,
      cleanliness: 4.9,
      pricing: 4.7,
      overallExperience: 4.8
    },
    reviews: [
      {
        id: 'r1',
        customerName: 'Rahul Menon',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: 'Yesterday',
        comment: 'Checked the Kumbhakaran app, saw 2 people waiting, walked straight in. Zero useless phone calls! Arjun did a killer skin fade.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 4, overallExperience: 5 },
        ownerReply: { comment: 'Thanks Rahul! Always glad to give you the sharpest look.', date: '1 day ago' }
      },
      {
        id: 'r2',
        customerName: 'Vikram Sethi',
        customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '3 days ago',
        comment: 'Great hygiene, super quick service. Real-time waiting counter was 100% accurate. Saved me 40 minutes.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 5, overallExperience: 5 }
      }
    ],
    featured: true,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 24,
    todayRevenue: 4850,
    monthlyRevenue: 138000
  },
  {
    id: 'salon-2',
    name: 'Urban Blade Barbershop',
    tagline: 'Modern street fades, textured crops & urban styling',
    coverImage: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593702295094-ada74bed40f0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517832606589-7157be614379?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewCount: 488,
    currentQueue: 1,
    avgServiceTimeMinutes: 20,
    activeBarbers: 4,
    distanceKm: 0.6,
    startingPrice: 180,
    isOpen: true,
    openingHours: {
      open: '09:00 AM',
      close: '10:00 PM',
      formatted: '9:00 AM – 10:00 PM (Mon-Sun)'
    },
    address: '15, 12th Main Road, Indiranagar',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    coordinates: {
      lat: 12.9719,
      lng: 77.6412
    },
    phone: '+91 97312 88410',
    lastQueueUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 mins ago
    services: [
      { id: 's21', name: 'Urban Fade & Texture', category: 'Hair', price: 180, durationMinutes: 25, isAvailable: true, description: 'Low, mid or high drop fade with texture powder styling.', popular: true },
      { id: 's22', name: 'Beard Line-Up & Razor Sharp', category: 'Beard', price: 90, durationMinutes: 15, isAvailable: true, description: 'Straight razor finish with sandalwood aftershave lotion.', popular: true },
      { id: 's23', name: 'D-Tan Face Glow Therapy', category: 'Facial', price: 320, durationMinutes: 25, isAvailable: true, description: 'Removes sun tan and dullness instantly with natural fruit acids.' },
      { id: 's24', name: 'Moroccan Oil Scalp Treatment', category: 'Spa', price: 450, durationMinutes: 35, isAvailable: true, description: 'Deep root nourishment with argan oil massage.' }
    ],
    staff: [
      { id: 'st21', name: 'David Lee', role: 'Fade Specialist', experience: '7 Years', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', specialties: ['Skin Fade', 'Mullet Modern', 'Line Art'], status: 'active', rating: 4.9 },
      { id: 'st22', name: 'Naveen Kumar', role: 'Stylist', experience: '4 Years', photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80', specialties: ['Textured Crop', 'Beard Trim'], status: 'active', rating: 4.8 }
    ],
    ratingBreakdown: {
      haircutQuality: 5.0,
      staffBehaviour: 4.9,
      cleanliness: 4.8,
      pricing: 4.6,
      overallExperience: 4.9
    },
    reviews: [
      {
        id: 'r21',
        customerName: 'Aditya Roy',
        customerAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: 'Today',
        comment: '1 person waiting! Walked in and was seated in 3 minutes. The live queue counter is pure magic for lazy folks like me.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 4, overallExperience: 5 }
      }
    ],
    featured: true,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 31,
    todayRevenue: 6400,
    monthlyRevenue: 172000
  },
  {
    id: 'salon-3',
    name: 'Scissors & Razor Lounge',
    tagline: 'High-end men grooming club with espresso bar & leather comfort',
    coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.7,
    reviewCount: 215,
    currentQueue: 0,
    avgServiceTimeMinutes: 22,
    activeBarbers: 3,
    distanceKm: 2.1,
    startingPrice: 200,
    isOpen: true,
    openingHours: {
      open: '10:00 AM',
      close: '09:00 PM',
      formatted: '10:00 AM – 9:00 PM (Tue-Sun)'
    },
    address: '88, 27th Main, Sector 1, HSR Layout',
    locality: 'HSR Layout',
    city: 'Bengaluru',
    pincode: '560102',
    coordinates: {
      lat: 12.9121,
      lng: 77.6446
    },
    phone: '+91 99160 55230',
    lastQueueUpdate: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
    services: [
      { id: 's31', name: 'Executive Haircut & Wash', category: 'Hair', price: 200, durationMinutes: 30, isAvailable: true, description: 'Includes consultation, premium tea/coffee, neck shave & cold towel.', popular: true },
      { id: 's32', name: 'Classic Turkish Beard Shave', category: 'Beard', price: 120, durationMinutes: 20, isAvailable: true, description: 'Triple hot foam lather, eucalyptus oil & close shave.', popular: true },
      { id: 's33', name: 'The Boss Grooming Package', category: 'Combos', price: 450, durationMinutes: 50, isAvailable: true, description: 'Haircut, beard sculpt, head massage and charcoal face pack.', popular: true }
    ],
    staff: [
      { id: 'st31', name: 'Farhan Akhtar', role: 'Chief Barber', experience: '9 Years', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', specialties: ['Scissor Mastery', 'Beard Shaping'], status: 'active', rating: 4.8 }
    ],
    ratingBreakdown: {
      haircutQuality: 4.8,
      staffBehaviour: 4.7,
      cleanliness: 5.0,
      pricing: 4.2,
      overallExperience: 4.7
    },
    reviews: [
      {
        id: 'r31',
        customerName: 'Kunal Kapoor',
        customerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '2 days ago',
        comment: '0 people in queue! Walked in during lunch break, done and dusted in 25 mins. Absolute game changer.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 4, overallExperience: 5 }
      }
    ],
    featured: false,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 18,
    todayRevenue: 4100,
    monthlyRevenue: 112000
  },
  {
    id: 'salon-4',
    name: 'Krooz Unisex Studio',
    tagline: 'Trendy styles for men & women, luxury treatments & colors',
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.6,
    reviewCount: 178,
    currentQueue: 5,
    avgServiceTimeMinutes: 25,
    activeBarbers: 2,
    distanceKm: 3.4,
    startingPrice: 250,
    isOpen: true,
    openingHours: {
      open: '09:30 AM',
      close: '09:30 PM',
      formatted: '9:30 AM – 9:30 PM (All Days)'
    },
    address: '204, Outer Ring Road, Bellandur',
    locality: 'Bellandur',
    city: 'Bengaluru',
    pincode: '560103',
    coordinates: {
      lat: 12.9260,
      lng: 77.6762
    },
    phone: '+91 98801 33419',
    lastQueueUpdate: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    services: [
      { id: 's41', name: 'Creative Haircut & Styling', category: 'Hair', price: 250, durationMinutes: 30, isAvailable: true, description: 'Tailored haircut designed according to bone structure and hair density.' },
      { id: 's42', name: 'L’Oréal Hair Spa Intensive', category: 'Spa', price: 650, durationMinutes: 45, isAvailable: true, description: 'Hydrating mask infusion with ultrasonic steam emission.' },
      { id: 's43', name: 'Beard Sculpt & Ozone Mist', category: 'Beard', price: 150, durationMinutes: 20, isAvailable: true, description: 'Sanitizing ozone mist followed by custom fade trimming.' }
    ],
    staff: [
      { id: 'st41', name: 'Riya Sen', role: 'Creative Director', experience: '10 Years', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', specialties: ['Creative Cut', 'Coloring'], status: 'active', rating: 4.7 }
    ],
    ratingBreakdown: {
      haircutQuality: 4.7,
      staffBehaviour: 4.6,
      cleanliness: 4.8,
      pricing: 4.3,
      overallExperience: 4.6
    },
    reviews: [
      {
        id: 'r41',
        customerName: 'Priya Nambiar',
        customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        rating: 4,
        date: 'Last week',
        comment: 'Nice place. Current queue showed 5 people, which took about 40 minutes, accurately reflecting wait time.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 4, cleanliness: 5, pricing: 4, overallExperience: 4 }
      }
    ],
    featured: false,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 14,
    todayRevenue: 3900,
    monthlyRevenue: 98000
  },
  {
    id: 'salon-5',
    name: 'Desi Ustad Barber Club',
    tagline: 'Authentic desi haircut, head champi & soothing beard shave',
    coverImage: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.7,
    reviewCount: 520,
    currentQueue: 2,
    avgServiceTimeMinutes: 15,
    activeBarbers: 3,
    distanceKm: 0.9,
    startingPrice: 100,
    isOpen: true,
    openingHours: {
      open: '08:00 AM',
      close: '10:00 PM',
      formatted: '8:00 AM – 10:00 PM (Daily)'
    },
    address: '14, 5th Cross, Tavarekere Main Road, BTM Layout',
    locality: 'BTM Layout',
    city: 'Bengaluru',
    pincode: '560029',
    coordinates: {
      lat: 12.9165,
      lng: 77.6101
    },
    phone: '+91 94481 22904',
    lastQueueUpdate: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins ago - STALE warning example!
    services: [
      { id: 's51', name: 'Desi Classic Haircut', category: 'Hair', price: 100, durationMinutes: 15, isAvailable: true, description: 'Fast, sharp, traditional scissor and trimmer haircut.', popular: true },
      { id: 's52', name: 'Navratna / Almond Oil Champi', category: 'Spa', price: 80, durationMinutes: 15, isAvailable: true, description: 'Legendary stress-buster head massage with authentic oils.', popular: true },
      { id: 's53', name: 'Alum & Cream Beard Shave', category: 'Beard', price: 60, durationMinutes: 10, isAvailable: true, description: 'Pure classic shave with hot water and alum block antiseptic finish.', popular: true }
    ],
    staff: [
      { id: 'st51', name: 'Ustad Irfan', role: 'Founder & Head Barber', experience: '15 Years', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', specialties: ['Head Champi', 'Fast Fades'], status: 'active', rating: 4.9 }
    ],
    ratingBreakdown: {
      haircutQuality: 4.7,
      staffBehaviour: 4.8,
      cleanliness: 4.4,
      pricing: 5.0,
      overallExperience: 4.7
    },
    reviews: [
      {
        id: 'r51',
        customerName: 'Manish Tiwari',
        customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '4 days ago',
        comment: 'Best value in Bengaluru! Haircut + oil massage in under 200 bucks. Queue was just 2 people.',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 4, pricing: 5, overallExperience: 5 }
      }
    ],
    featured: false,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 42,
    todayRevenue: 5200,
    monthlyRevenue: 145000
  },
  {
    id: 'salon-6',
    name: 'Royale Heritage Spa & Cuts',
    tagline: 'Ultra-luxurious salon & spa suite with private grooming stations',
    coverImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewCount: 310,
    currentQueue: 8,
    avgServiceTimeMinutes: 25,
    activeBarbers: 3,
    distanceKm: 4.2,
    startingPrice: 350,
    isOpen: true,
    openingHours: {
      open: '10:00 AM',
      close: '10:00 PM',
      formatted: '10:00 AM – 10:00 PM'
    },
    address: 'Level 2, Forum Mall, Hosur Road, Koramangala',
    locality: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560095',
    coordinates: {
      lat: 12.9360,
      lng: 77.6160
    },
    phone: '+91 99002 11984',
    lastQueueUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    services: [
      { id: 's61', name: 'Royal Bespoke Styling', category: 'Hair', price: 350, durationMinutes: 35, isAvailable: true, description: 'Elite styling with Kerastase products and private cabin treatment.' },
      { id: 's62', name: '24K Gold Dust Facial', category: 'Facial', price: 950, durationMinutes: 50, isAvailable: true, description: 'Anti-aging, skin tightening and gold leaf radiant glow treatment.' }
    ],
    staff: [
      { id: 'st61', name: 'Marcus D’Souza', role: 'Art Director', experience: '12 Years', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', specialties: ['Bespoke Haircut', 'Color Master'], status: 'active', rating: 4.9 }
    ],
    ratingBreakdown: {
      haircutQuality: 5.0,
      staffBehaviour: 4.9,
      cleanliness: 5.0,
      pricing: 4.0,
      overallExperience: 4.9
    },
    reviews: [
      {
        id: 'r61',
        customerName: 'Samarth Jain',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        rating: 5,
        date: '3 days ago',
        comment: 'High queue on weekend (8 waiting), but since Kumbhakaran showed the exact wait time (around 50 mins), I grabbed a coffee first and walked in just in time. Seamless!',
        verifiedVisit: true,
        criteria: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 4, overallExperience: 5 }
      }
    ],
    featured: false,
    isVerified: true,
    status: 'active',
    todayCustomersServed: 20,
    todayRevenue: 7800,
    monthlyRevenue: 210000
  }
];

export const INITIAL_USER: CustomerProfile = {
  name: 'Prabhakar',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  savedSalons: ['salon-1', 'salon-2'],
  recentlyViewed: ['salon-1', 'salon-3', 'salon-2'],
  patiencePreference: 'all',
  preferredLocality: 'Koramangala, Bengaluru',
  notifyOnShortQueue: true,
  queueAlertThreshold: 2
};
