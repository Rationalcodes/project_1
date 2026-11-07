import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SalonsService } from '../salons/salons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { DeleteSalonDto } from './dto/delete-salon.dto';
import { VerifySalonDto } from './dto/verify-salon.dto';
import { UpdateSalonStatusDto } from './dto/update-salon-status.dto';

@ApiTags('Admin / Salons')
@Controller('admin/salons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminSalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all registered salons with real database telemetry (Admin Only)',
    description:
      'Returns complete salon records including verification status, operational status, member counts, and service counts.',
  })
  @ApiResponse({ status: 200, description: 'List of all salons' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN role required' })
  async getAllSalons() {
    return this.salonsService.getAllSalonsForAdmin();
  }

  @Patch(':id/verify')
  @ApiOperation({
    summary: 'Approve or unverify a salon registration (Admin Only)',
    description:
      'Sets is_verified in the database. Approved salons immediately become discoverable to customers.',
  })
  @ApiParam({ name: 'id', description: 'Salon identifier' })
  @ApiResponse({ status: 200, description: 'Salon verification updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async verifySalon(
    @Param('id') id: string,
    @Body() dto: VerifySalonDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.salonsService.verifySalon(id, dto.isVerified, adminUser);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update salon operational status (active / suspended) (Admin Only)',
    description:
      'Suspended salons are immediately hidden from customer public discovery.',
  })
  @ApiParam({ name: 'id', description: 'Salon identifier' })
  @ApiResponse({ status: 200, description: 'Salon status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSalonStatusDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.salonsService.updateAdminSalonStatus(id, dto.status, adminUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete a salon and all associated records (Admin Only)',
    description:
      'Enforces ADMIN role and requires explicit confirmation of salon name. Atomically removes salon profile, services, staff, reviews, and memberships inside a database transaction. Logs an immutable audit event.',
  })
  @ApiParam({ name: 'id', description: 'Salon identifier to delete' })
  @ApiResponse({ status: 200, description: 'Salon and all associated records permanently deleted' })
  @ApiResponse({ status: 400, description: 'Confirmation salon name mismatch' })
  @ApiResponse({ status: 403, description: 'Forbidden: ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Salon not found' })
  async deleteSalon(
    @Param('id') id: string,
    @Body() dto: DeleteSalonDto,
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.salonsService.deleteSalon(id, dto.confirmSalonName, adminUser);
  }

  @Get('banners')
  @ApiOperation({ summary: 'List current home banners (Admin Only)' })
  @ApiResponse({ status: 200, description: 'List of home banners' })
  async getBanners() {
    return this.salonsService.getBanners();
  }

  @Post('banners')
  @ApiOperation({ summary: 'Save updated home banners and posters (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Banners updated successfully' })
  async updateBanners(
    @Body() body: { banners: any[] },
    @CurrentUser() adminUser: AuthenticatedUser,
  ) {
    return this.salonsService.saveBanners(body.banners || [], adminUser);
  }
}
