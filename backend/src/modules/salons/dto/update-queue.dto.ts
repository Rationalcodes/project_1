import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateQueueDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Delta adjustment: +1 when a customer walks in, -1 when completed',
  })
  @IsOptional()
  @IsNumber()
  delta?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Direct manual override of the physical walk-in waiting count',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  manualValue?: number;
}
