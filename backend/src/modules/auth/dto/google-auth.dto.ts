import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google OAuth ID Token (JWT) provided by the Google Identity Services frontend SDK',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @IsNotEmpty()
  credential!: string;

  @ApiProperty({
    description: 'Optional Google Client ID for audience verification',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientId?: string;
}
