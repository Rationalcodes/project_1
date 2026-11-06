import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateQueueEntryDto {
  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Customer full name or walk-in nickname' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210', description: 'Contact phone number to call customer when their turn arrives' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Signature Haircut', description: 'Service requested by customer' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceName?: string;

  @ApiPropertyOptional({ example: 'srv_123', description: 'Optional Service ID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceId?: string;

  @ApiPropertyOptional({ example: 'staff_1', description: 'Optional preferred staff member' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  preferredStaffId?: string;

  @ApiPropertyOptional({ description: 'Special customer request or instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 'dev_1793838383', description: 'Device fingerprint ID for cross-visit recognition' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @ApiPropertyOptional({ example: 'usr_123', description: 'Authenticated Google customer user ID' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  userId?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  partySize?: number;

  @ApiPropertyOptional({ description: 'Signed salon QR token. Required for physical QR check-in.' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  checkInToken?: string;
}
