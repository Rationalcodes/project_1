import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteSalonDto {
  @ApiProperty({
    description: 'Exact salon name entered by administrator to confirm deletion',
    example: 'Artisan Blades & Beard Co.',
  })
  @IsString()
  @IsNotEmpty()
  confirmSalonName: string;
}
