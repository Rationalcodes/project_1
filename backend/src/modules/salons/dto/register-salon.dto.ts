import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEmail,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceCreateItemDto {
  @ApiProperty({ example: 'Signature Haircut' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Hair' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 180 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Precision styling tailored to face shape' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RegisterSalonDto {
  @ApiProperty({ example: 'Blade & Timber Grooming Lounge', description: 'Name of the salon' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Precision cuts & authentic walk-in transparency' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ example: 'Vikram Malhotra', description: 'Name of salon owner' })
  @IsString()
  @MinLength(2)
  ownerName: string;

  @ApiPropertyOptional({ example: 'owner-usr-901', description: 'Owner account identifier' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ example: '+91 98450 12890', description: 'Salon contact phone number' })
  @IsString()
  @MinLength(8)
  phone: string;

  @ApiPropertyOptional({ example: 'contact@bladeandtimber.in' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '42, 80 Feet Road, 4th Block', description: 'Street address' })
  @IsString()
  @MinLength(3)
  address: string;

  @ApiProperty({ example: 'Koramangala', description: 'Locality / Area' })
  @IsString()
  @IsNotEmpty()
  locality: string;

  @ApiProperty({ example: 'Bengaluru', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '560034', description: 'Postal PIN code' })
  @IsString()
  @MinLength(4)
  pincode: string;

  @ApiProperty({
    example: 12.9344,
    description: 'Geographical latitude (-90 to +90). Verified for PostGIS Point.',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    example: 77.6258,
    description: 'Geographical longitude (-180 to +180). Verified for PostGIS Point.',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: '09:00 AM' })
  @IsOptional()
  @IsString()
  openingHoursOpen?: string;

  @ApiPropertyOptional({ example: '09:30 PM' })
  @IsOptional()
  @IsString()
  openingHoursClose?: string;

  @ApiPropertyOptional({ example: 3, description: 'Number of active barbers working simultaneously' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  activeBarbers?: number;

  @ApiPropertyOptional({ example: 20, description: 'Average minutes taken per customer service' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  avgServiceTimeMinutes?: number;

  @ApiPropertyOptional({ example: 150.0, description: 'Base starting price for haircuts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startingPrice?: number;

  @ApiPropertyOptional({ type: [ServiceCreateItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceCreateItemDto)
  services?: ServiceCreateItemDto[];
}
