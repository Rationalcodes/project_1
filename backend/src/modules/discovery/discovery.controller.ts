import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { NearbySalonsQueryDto } from './dto/nearby-salons-query.dto';
import { NearbySalonsResponseDto } from './dto/nearby-salon-response.dto';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('nearby')
  @ApiOperation({
    summary: 'Discover nearby salons using PostGIS geographical coordinates',
    description:
      'Performs PostGIS ST_DWithin radius search with distance calculation, Lazy Mode filters, and aggregate queue counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of verified nearby salons sorted by distance',
    type: NearbySalonsResponseDto,
  })
  async getNearbySalons(
    @Query() query: NearbySalonsQueryDto,
  ): Promise<NearbySalonsResponseDto> {
    return this.discoveryService.getNearbySalons(query);
  }
}
