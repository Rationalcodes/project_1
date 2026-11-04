import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class UpdateSalonDto {
  @ApiPropertyOptional({ example: 'Blade & Timber Studio' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Craft fades & beard grooming' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: '+91 98450 12890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '42, 80 Feet Road' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Koramangala' })
  @IsOptional()
  @IsString()
  locality?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '560034' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 12.9344 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 77.6258 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '09:00 AM' })
  @IsOptional()
  @IsString()
  openingHoursOpen?: string;

  @ApiPropertyOptional({ example: '09:30 PM' })
  @IsOptional()
  @IsString()
  openingHoursClose?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  activeBarbers?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  avgServiceTimeMinutes?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'pending', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'pending', 'suspended'])
  status?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  @IsOptional()
  @IsString()
  posterImage?: string;

  @ApiPropertyOptional({ example: 'https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-and-comb-41544-large.mp4' })
  @IsOptional()
  @IsString()
  loopVideoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  locationImages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  workImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  mediaGallery?: any[];
}
