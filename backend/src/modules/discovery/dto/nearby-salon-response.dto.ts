import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbySalonItemDto {
  @ApiProperty({ example: 'salon-1' })
  id: string;

  @ApiProperty({ example: 'The Gentleman Studio' })
  name: string;

  @ApiPropertyOptional({ example: 'Precision cuts & authentic walk-in transparency' })
  tagline?: string;

  @ApiProperty({ example: 'Koramangala' })
  locality: string;

  @ApiProperty({ example: 'Bengaluru' })
  city: string;

  @ApiProperty({ example: 12.9344 })
  latitude: number;

  @ApiProperty({ example: 77.6258 })
  longitude: number;

  @ApiProperty({ example: 0.85, description: 'PostGIS spherical distance from customer in kilometers' })
  distanceKm: number;

  @ApiProperty({ example: 4.8 })
  rating: number;

  @ApiProperty({ example: 342 })
  reviewCount: number;

  @ApiProperty({ example: 3, description: 'Live physical walk-in queue counter' })
  currentQueue: number;

  @ApiProperty({ example: 18, description: 'Calculated wait turnaround in minutes' })
  estimatedWaitMinutes: number;

  @ApiProperty({ example: 150.0, description: 'Base haircut starting price in INR' })
  startingPrice: number;

  @ApiProperty({ example: true })
  isOpen: boolean;

  @ApiPropertyOptional({ enum: ['open', 'paused', 'closed'], example: 'open' })
  queueStatus?: 'open' | 'paused' | 'closed';

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  coverImage?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  posterImage?: string;

  @ApiPropertyOptional({ example: 'https://assets.mixkit.co/videos/preview/mixkit-barber.mp4' })
  loopVideoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  locationImages?: string[];

  @ApiPropertyOptional({ type: [String] })
  workImages?: string[];

  @ApiProperty({ example: '2026-11-03T12:00:00Z' })
  lastQueueUpdate: string;

  @ApiProperty({ example: 'Updated just now' })
  freshnessBadge: string;
}

export class NearbySalonsResponseDto {
  @ApiProperty({ example: 12 })
  totalFound: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 10 })
  radiusKm: number;

  @ApiProperty({ type: [NearbySalonItemDto] })
  salons: NearbySalonItemDto[];
}
