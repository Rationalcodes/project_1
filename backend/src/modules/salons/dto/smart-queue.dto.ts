import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SmartQueueConsentDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class SmartQueueCheckInDto {
  @ApiProperty({ description: 'Signed token encoded in the salon QR code' })
  @IsString()
  qrToken: string;
}

export class SmartQueueLocationDto {
  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Device-reported horizontal accuracy in meters' })
  @IsNumber()
  @Min(0)
  @Max(10000)
  accuracyMeters: number;

  @ApiProperty()
  @IsISO8601()
  observedAt: string;
}

export class SmartQueueDepartureResponseDto {
  @ApiProperty({ enum: ['left', 'still_here', 'returning'] })
  @IsIn(['left', 'still_here', 'returning'])
  response: 'left' | 'still_here' | 'returning';
}

export class SmartQueueSettingsDto {
  @ApiPropertyOptional({ minimum: 50, maximum: 500 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  geofenceRadiusMeters?: number;
}
