import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateSalonStatusDto {
  @ApiProperty({
    description: 'Operational status of the salon',
    enum: ['active', 'suspended', 'pending'],
    example: 'active',
  })
  @IsString()
  @IsIn(['active', 'suspended', 'pending'])
  status: string;
}
