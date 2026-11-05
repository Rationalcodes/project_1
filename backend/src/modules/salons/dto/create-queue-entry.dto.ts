import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateQueueEntryDto {
  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Customer full name or walk-in nickname' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210', description: 'Contact phone number to call customer when their turn arrives' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Signature Haircut', description: 'Service requested by customer' })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({ example: 'srv_123', description: 'Optional Service ID' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ example: 'staff_1', description: 'Optional preferred staff member' })
  @IsOptional()
  @IsString()
  preferredStaffId?: string;

  @ApiPropertyOptional({ description: 'Special customer request or instructions' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'dev_1793838383', description: 'Device fingerprint ID for cross-visit recognition' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'usr_123', description: 'Authenticated Google customer user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}
