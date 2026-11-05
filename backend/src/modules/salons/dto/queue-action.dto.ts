import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator';

export class StartServiceDto {
  @ApiPropertyOptional({ description: 'ID of staff member taking this customer' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ description: 'Optional operational notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteServiceDto {
  @ApiPropertyOptional({ description: 'Notes on service completion' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Final price collected' })
  @IsOptional()
  @IsNumber()
  actualPrice?: number;
}

export class ExtendServiceDto {
  @ApiProperty({ example: 10, description: 'Additional minutes to extend active service' })
  @IsNumber()
  @Min(1)
  additionalMinutes: number;

  @ApiPropertyOptional({ description: 'Reason for extension' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ReassignStaffDto {
  @ApiProperty({ description: 'New staff member ID to assign' })
  @IsString()
  staffId: string;

  @ApiPropertyOptional({ description: 'Reason for staff reassignment' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelQueueEntryDto {
  @ApiPropertyOptional({ description: 'Cancellation or no-show reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateQueueStatusDto {
  @ApiProperty({ enum: ['open', 'paused', 'closed'], description: 'Salon queue operational status' })
  @IsIn(['open', 'paused', 'closed'])
  status: 'open' | 'paused' | 'closed';

  @ApiPropertyOptional({ description: 'Notice for customers when paused or closed' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ClearQueueDto {
  @ApiPropertyOptional({ enum: ['cancelled', 'not_served'], default: 'cancelled' })
  @IsOptional()
  @IsIn(['cancelled', 'not_served'])
  clearOption?: 'cancelled' | 'not_served';

  @ApiPropertyOptional({ description: 'Audit reason for clearing the queue' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateStaffStatusDto {
  @ApiProperty({ enum: ['AVAILABLE', 'ON_BREAK', 'OFFLINE'] })
  @IsIn(['AVAILABLE', 'ON_BREAK', 'OFFLINE'])
  availability: 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE';

  @ApiPropertyOptional({ description: 'Reason or note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpsertServiceDto {
  @ApiProperty({ example: 'Signature Haircut' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Hair', default: 'General' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsNumber()
  @Min(5)
  durationMinutes: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
