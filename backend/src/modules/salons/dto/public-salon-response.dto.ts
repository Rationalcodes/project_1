import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class PublicServiceDto {
  @ApiProperty({ example: 'svc-101' })
  id: string;

  @ApiProperty({ example: 'Classic Taper Fade' })
  name: string;

  @ApiProperty({ example: 'Hair' })
  category: string;

  @ApiProperty({ example: 180.0 })
  price: number;

  @ApiProperty({ example: 20 })
  durationMinutes: number;

  @ApiPropertyOptional({ example: 'Includes hair wash and clay styling' })
  description?: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}

export class PublicReviewDto {
  @ApiProperty({ example: 'rev-201' })
  id: string;

  @ApiProperty({ example: 'Rahul S.', description: 'Reviewer display name' })
  customerName: string;

  @ApiPropertyOptional()
  customerAvatar?: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Zero waiting time, clean stations, master fade!' })
  comment: string;

  @ApiProperty({ example: true })
  verifiedVisit: boolean;

  @ApiProperty({ example: '2026-11-01T10:00:00Z' })
  createdAt: string;

  @ApiPropertyOptional()
  ownerReply?: string;
}

export class PublicSalonResponseDto {
  @ApiProperty({ example: 'salon-1' })
  id: string;

  @ApiProperty({ example: 'The Gentleman Studio' })
  name: string;

  @ApiPropertyOptional({ example: 'Precision cuts & authentic walk-in transparency' })
  tagline?: string;

  @ApiProperty({ example: '42, 80 Feet Road, 4th Block, Koramangala' })
  address: string;

  @ApiProperty({ example: 'Koramangala' })
  locality: string;

  @ApiProperty({ example: 'Bengaluru' })
  city: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  state?: string;

  @ApiProperty({ example: '560034' })
  pincode: string;

  @ApiProperty({ example: 12.9344 })
  latitude: number;

  @ApiProperty({ example: 77.6258 })
  longitude: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  coverImage?: string;

  @ApiPropertyOptional()
  posterImage?: string;

  @ApiPropertyOptional()
  loopVideoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  locationImages?: string[];

  @ApiPropertyOptional({ type: [String] })
  workImages?: string[];

  @ApiPropertyOptional()
  mediaGallery?: any[];

  @ApiProperty({ example: '09:00 AM – 09:30 PM (All Days)' })
  openingHoursFormatted: string;

  @ApiProperty({ example: 3, description: 'Current physical walk-in queue counter' })
  currentQueue: number;

  @ApiProperty({ example: 18, description: 'Calculated wait time in minutes' })
  estimatedWaitMinutes: number;

  @ApiProperty({ example: 3, description: 'Barbers on active duty' })
  activeBarbers: number;

  @ApiProperty({ example: 20 })
  avgServiceTimeMinutes: number;

  @ApiProperty({ example: 4.8 })
  rating: number;

  @ApiProperty({ example: 342 })
  reviewCount: number;

  @ApiProperty({ example: 150.0 })
  startingPrice: number;

  @ApiProperty({ example: true })
  isOpen: boolean;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: '2026-11-03T12:00:00Z' })
  lastQueueUpdate: string;

  @ApiProperty({ type: [PublicServiceDto] })
  services: PublicServiceDto[];

  @ApiProperty({ type: [PublicReviewDto] })
  reviews: PublicReviewDto[];

  @ApiPropertyOptional()
  openingHours?: {
    open: string;
    close: string;
    formatted: string;
  };

  @ApiPropertyOptional()
  coordinates?: {
    lat: number;
    lng: number;
  };

  @ApiPropertyOptional()
  staff?: any[];

  @ApiPropertyOptional()
  ratingBreakdown?: any;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  ownerName?: string;

  // Internal business fields explicitly excluded from public serialization
  @Exclude()
  ownerId?: string;

  @Exclude()
  todayRevenue?: number;

  @Exclude()
  monthlyRevenue?: number;

  @Exclude()
  todayCustomersServed?: number;
}
