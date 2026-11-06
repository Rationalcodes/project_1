import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min, Max, IsArray } from 'class-validator';

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

export class UpsertStaffDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Master Barber' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '5 Years' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: ['Haircut', 'Beard Styling'] })
  @IsOptional()
  @IsArray()
  specialties?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;
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

export class SubmitCrowdReportDto {
  @ApiProperty({ description: 'Customer GPS latitude for geofence verification', example: 28.5355 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Customer GPS longitude for geofence verification', example: 77.3910 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 3, description: 'Number of people currently waiting or in salon' })
  @IsNumber()
  @Min(0)
  peopleCount: number;

  @ApiProperty({ example: 20, description: 'Estimated wait time in minutes' })
  @IsNumber()
  @Min(0)
  estimatedWaitMinutes: number;

  @ApiPropertyOptional({ example: 2, description: 'Number of active barbers working' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  activeBarbers?: number;

  @ApiPropertyOptional({ description: 'Optional operational observation note' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Customer display name' })
  @IsOptional()
  @IsString()
  customerName?: string;
}
