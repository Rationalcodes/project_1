import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VerifySalonDto {
  @ApiProperty({
    description: 'Whether the salon registration is approved and verified',
    example: true,
  })
  @IsBoolean()
  isVerified: boolean;
}
