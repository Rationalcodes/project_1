import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalonsService } from './salons.service';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'Get active public home banners and promotional posters' })
  @ApiResponse({ status: 200, description: 'List of all active home banners' })
  async getBanners() {
    return this.salonsService.getBanners();
  }
}
