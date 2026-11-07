import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalonsService } from './salons.service';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active public home banners and promotional posters' })
  @ApiResponse({ status: 200, description: 'List of 4 home banners' })
  async getBanners() {
    return this.salonsService.getBanners();
  }
}
