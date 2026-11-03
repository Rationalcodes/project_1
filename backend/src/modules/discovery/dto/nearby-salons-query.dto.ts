import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LazyFilterOption {
  ZERO_WAIT = 'zero_wait',
  SHORT_WAIT = 'short_wait',
  NEAREST_FIRST = 'nearest_first',
  TOP_RATED = 'top_rated',
  BUDGET_FRIENDLY = 'budget_friendly',
}

export class NearbySalonsQueryDto {
  @ApiProperty({
    example: 12.9352,
    description: 'Customer current latitude coordinate',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    example: 77.6245,
    description: 'Customer current longitude coordinate',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Search discovery radius in kilometers (default: 10 km, max: 50 km)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radius_km?: number = 10;

  @ApiPropertyOptional({
    enum: LazyFilterOption,
    description: 'Kumbhakaran Lazy Mode fast preset filter',
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'zero_wait',
    'short_wait',
    'nearest_first',
    'top_rated',
    'budget_friendly',
  ])
  lazy_filter?: string;

  @ApiPropertyOptional({
    example: 'Hair',
    description: 'Service category filter (Hair, Beard, Combos, Spa, Facial)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 4.5, description: 'Minimum customer rating filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({ example: 3, description: 'Maximum people waiting in queue' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_queue?: number;

  @ApiPropertyOptional({ example: 250, description: 'Maximum starting price filter in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({
    example: 'distance',
    enum: ['distance', 'rating', 'queue', 'price'],
    description: 'Sorting criteria (default: distance)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['distance', 'rating', 'queue', 'price'])
  sort_by?: 'distance' | 'rating' | 'queue' | 'price' = 'distance';

  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Results per page (default: 20, max: 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
