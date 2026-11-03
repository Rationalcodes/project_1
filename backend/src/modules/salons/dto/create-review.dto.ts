import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewCriteriaDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  haircutQuality?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  staffBehaviour?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanliness?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  pricing?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallExperience?: number;
}

export class CreateReviewDto {
  @ApiProperty({ example: 'Rahul S.', description: 'Reviewer name' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' })
  @IsOptional()
  @IsString()
  customerAvatar?: string;

  @ApiProperty({ example: 5, description: 'Overall rating between 1 and 5' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great haircut, zero waiting, clean salon!' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  verifiedVisit?: boolean;

  @ApiPropertyOptional({ type: () => ReviewCriteriaDto })
  @IsOptional()
  criteria?: ReviewCriteriaDto;
}
