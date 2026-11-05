import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalonsService } from './salons.service';
import { RegisterSalonDto } from './dto/register-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import {
  StartServiceDto,
  CompleteServiceDto,
  ExtendServiceDto,
  ReassignStaffDto,
  CancelQueueEntryDto,
  UpdateQueueStatusDto,
  ClearQueueDto,
  UpdateStaffStatusDto,
  UpsertServiceDto,
} from './dto/queue-action.dto';
import { PublicSalonResponseDto, PublicReviewDto } from './dto/public-salon-response.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SalonOwnerGuard } from './guards/salon-owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { DiscoveryService } from '../discovery/discovery.service';
import { NearbySalonsQueryDto } from '../discovery/dto/nearby-salons-query.dto';
import { NearbySalonsResponseDto } from '../discovery/dto/nearby-salon-response.dto';

@ApiTags('Salons')
@Controller('salons')
export class SalonsController {
  constructor(
    private readonly salonsService: SalonsService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  @Post('register')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new salon with geographical PostGIS point',
    description:
      'Captures salon information, street address, and exact coordinates. Automatically associates authenticated user as PARTNER_OWNER in salon_members.',
  })
  @ApiResponse({
    status: 201,
    description: 'Salon registered successfully',
  })
  async registerSalon(
    @Body() dto: RegisterSalonDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.salonsService.registerSalon(dto, user?.id);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Discover nearby salons using PostGIS geographical coordinates',
    description:
      'Discovers salons within geographical radius using PostGIS ST_DWithin and ST_Distance calculations. Applies Lazy Mode filters, sorting, and aggregate queue counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of nearby salons sorted by distance',
    type: NearbySalonsResponseDto,
  })
  async getNearbySalons(
    @Query() query: NearbySalonsQueryDto,
  ): Promise<NearbySalonsResponseDto> {
    return this.discoveryService.getNearbySalons(query);
  }

  @Get('my-salon')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get existing salon owned by the authenticated partner or specified email',
  })
  async getMySalon(
    @CurrentUser() user?: AuthenticatedUser,
    @Query('email') emailQuery?: string,
  ) {
    const targetEmail = user?.email || emailQuery;
    const targetUserId = user?.id;
    const memberships = user?.memberships || [];
    return this.salonsService.getMySalon(targetUserId, targetEmail, memberships);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get public salon profile by ID',
    description:
      'Returns verified public salon information, services, pricing, and aggregate walk-in queue counter. Strictly excludes internal customer names and financial data.',
  })
  @ApiParam({ name: 'id', example: 'salon-1', description: 'Salon identifier' })
  @ApiResponse({
    status: 200,
    description: 'Public salon profile',
    type: PublicSalonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Salon not found or suspended' })
  async getPublicSalonById(
    @Param('id') id: string,
  ): Promise<PublicSalonResponseDto> {
    return this.salonsService.getPublicSalonById(id);
  }

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a verified review for a salon',
    description: 'Stores customer review, rating, and criteria in PostgreSQL and recalculates aggregate rating.',
  })
  @ApiParam({ name: 'id', example: 'salon-1', description: 'Salon identifier' })
  @ApiResponse({ status: 201, description: 'Review successfully created and persisted', type: PublicReviewDto })
  async addReview(
    @Param('id') salonId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<PublicReviewDto> {
    return this.salonsService.addReview(salonId, dto);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews for a salon' })
  @ApiParam({ name: 'id', example: 'salon-1', description: 'Salon identifier' })
  @ApiResponse({ status: 200, description: 'List of reviews for the salon' })
  async getReviews(@Param('id') salonId: string): Promise<PublicReviewDto[]> {
    return this.salonsService.getReviews(salonId);
  }

  @Post(':id/reviews/:reviewId/reply')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a customer review (Salon Owner Only)' })
  @ApiParam({ name: 'id', example: 'salon-1', description: 'Salon identifier' })
  @ApiParam({ name: 'reviewId', example: 'rev-123', description: 'Review identifier' })
  async replyToReview(
    @Param('id') salonId: string,
    @Param('reviewId') reviewId: string,
    @Body('comment') comment: string,
  ) {
    return this.salonsService.replyToReview(salonId, reviewId, comment);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update salon profile or location coordinates (Owner Only)',
    description:
      'Protected by JwtAuthGuard and SalonOwnerGuard. Prevents unauthorized salon modifications. Updates PostGIS geography point if coordinates change.',
  })
  @ApiParam({ name: 'id', example: 'salon-1' })
  @ApiResponse({ status: 200, description: 'Salon updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requester does not own this salon' })
  async updateSalon(
    @Param('id') id: string,
    @Body() dto: UpdateSalonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.updateSalon(id, dto, user.id);
  }

  @Patch(':id/queue')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update physical walk-in queue counter (Owner Only)',
    description:
      'Transactionally increments, decrements, or manually overrides the public walk-in waiting counter.',
  })
  @ApiParam({ name: 'id', example: 'salon-1' })
  @ApiResponse({ status: 200, description: 'Queue updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requester does not own this salon' })
  async updateQueue(
    @Param('id') id: string,
    @Body() dto: UpdateQueueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.updateQueue(id, dto, user.id);
  }

  @Get(':id/queue-overview')
  @ApiOperation({
    summary: 'Get live queue overview with staff availability & stats',
    description: 'Returns real-time queue overview, live timer calculations, and active staff states.',
  })
  async getQueueOverview(@Param('id') id: string) {
    return this.salonsService.getQueueOverview(id);
  }

  @Get(':id/queue-entries')
  @ApiOperation({
    summary: 'Get live walk-in waiting queue entries for a salon',
    description:
      'Returns list of customers waiting in queue with their ID, name, phone, ticket number, and wait time.',
  })
  async getQueueEntries(@Param('id') id: string) {
    return this.salonsService.getQueueEntries(id);
  }

  @Post(':id/queue-entries')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Add a customer to the live walk-in queue',
    description:
      'Adds a customer with their name, phone, and locks immutable service duration and price snapshots.',
  })
  async addQueueEntry(
    @Param('id') id: string,
    @Body() dto: CreateQueueEntryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.salonsService.addQueueEntry(id, dto, user?.id);
  }

  @Post(':id/queue-entries/:entryId/start')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start service for a customer with assigned staff member' })
  async startService(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: StartServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.startService(id, entryId, dto, user.id);
  }

  @Post(':id/queue-entries/:entryId/complete')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete service for a customer and save history' })
  async completeService(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: CompleteServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.completeService(id, entryId, dto, user.id);
  }

  @Post(':id/queue-entries/:entryId/call')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Call customer when chair is ready' })
  async callCustomer(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.callCustomer(id, entryId, user.id);
  }

  @Post(':id/queue-entries/:entryId/skip')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Skip customer who is temporarily absent' })
  async skipCustomer(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.skipCustomer(id, entryId, user.id);
  }

  @Post(':id/queue-entries/:entryId/recall')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recall skipped customer back into the queue' })
  async recallCustomer(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.recallCustomer(id, entryId, user.id);
  }

  @Post(':id/queue-entries/:entryId/cancel')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Cancel queue entry with optional reason' })
  async cancelQueueEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: CancelQueueEntryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.salonsService.cancelQueueEntry(id, entryId, dto, user?.id);
  }

  @Post(':id/queue-entries/:entryId/extend')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extend active in-service duration' })
  async extendService(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: ExtendServiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.extendService(id, entryId, dto, user.id);
  }

  @Post(':id/queue-entries/:entryId/reassign')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reassign customer to a different staff member' })
  async reassignStaff(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: ReassignStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.reassignStaff(id, entryId, dto, user.id);
  }

  @Patch(':id/queue-status')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change queue operational status (open / paused / closed)' })
  async updateQueueStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQueueStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.updateQueueStatus(id, dto, user.id);
  }

  @Post(':id/queue/clear')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear active queue while strictly preserving service history' })
  async clearQueue(
    @Param('id') id: string,
    @Body() dto: ClearQueueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.clearQueue(id, dto, user.id);
  }

  @Patch(':id/queue-entries/:entryId')
  @ApiOperation({
    summary: 'Update a customer queue entry status (Backwards-compatible)',
  })
  async updateQueueEntryStatus(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body('status') status: string,
  ) {
    return this.salonsService.updateQueueEntryStatus(id, entryId, status);
  }

  @Delete(':id/queue-entries')
  @ApiOperation({
    summary: 'Reset or clear all waiting customers in queue (Backwards-compatible)',
  })
  async clearQueueEntries(@Param('id') id: string) {
    return this.salonsService.clearQueueEntries(id);
  }

  // ==========================================================================
  // STAFF & SERVICE MANAGEMENT ENDPOINTS
  // ==========================================================================

  @Get(':id/staff')
  @ApiOperation({ summary: 'Get all staff members for a salon' })
  async getSalonStaff(@Param('id') id: string) {
    return this.salonsService.getSalonStaff(id);
  }

  @Patch(':id/staff/:staffId/status')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff member availability status (AVAILABLE / ON_BREAK / OFFLINE)' })
  async updateStaffStatus(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.updateStaffStatus(id, staffId, dto, user.id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get all configured services for a salon' })
  async getSalonServices(@Param('id') id: string) {
    return this.salonsService.getSalonServices(id);
  }

  @Post(':id/services')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new salon service with custom duration and price' })
  async createSalonService(
    @Param('id') id: string,
    @Body() dto: UpsertServiceDto,
  ) {
    return this.salonsService.upsertSalonService(id, dto);
  }

  @Patch(':id/services/:serviceId')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update salon service duration, price, or details' })
  async updateSalonService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpsertServiceDto,
  ) {
    return this.salonsService.upsertSalonService(id, dto, serviceId);
  }

  @Delete(':id/services/:serviceId')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a salon service' })
  async deleteSalonService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.salonsService.deleteSalonService(id, serviceId);
  }

  @Get(':id/service-history')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get historical service sessions' })
  async getServiceHistory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salonsService.getServiceHistory(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
