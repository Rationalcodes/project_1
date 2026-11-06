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
  Headers,
  Req,
  HttpException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  UpsertStaffDto,
  UpsertServiceDto,
  SubmitCrowdReportDto,
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
import {
  SmartQueueCheckInDto,
  SmartQueueConsentDto,
  SmartQueueDepartureResponseDto,
  SmartQueueLocationDto,
  SmartQueueSettingsDto,
} from './dto/smart-queue.dto';

@ApiTags('Salons')
@Controller('salons')
export class SalonsController {
  private readonly logger = new Logger(SalonsController.name);

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
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
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
      'Returns a privacy-safe public queue view without customer names, phone numbers, or coordinates.',
  })
  async getQueueEntries(@Param('id') id: string) {
    return this.salonsService.getQueueEntries(id);
  }

  @Get(':id/partner-queue-entries')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authorized partner queue roster and SmartQueue status indicators' })
  async getPartnerQueueEntries(@Param('id') id: string) {
    return this.salonsService.getPartnerQueueEntries(id);
  }

  @Get(':id/check-in-qr')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a signed physical check-in QR token for this salon' })
  async getSalonCheckInQr(@Param('id') id: string) {
    return this.salonsService.getSalonCheckInQr(id);
  }

  @Patch(':id/smart-queue-settings')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configure the salon SmartQueue assistance geofence radius' })
  async updateSmartQueueSettings(
    @Param('id') id: string,
    @Body() dto: SmartQueueSettingsDto,
  ) {
    return this.salonsService.updateSmartQueueSettings(id, dto);
  }

  @Get(':id/queue-entries/:entryId/customer-status')
  @ApiOperation({ summary: 'Get only the ticket associated with a valid customer access token' })
  async getCustomerQueueEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.getCustomerQueueEntry(id, entryId, accessToken);
  }

  @Post(':id/queue-entries/:entryId/check-in')
  @ApiOperation({ summary: 'Confirm physical arrival by scanning this salon’s signed QR code' })
  async confirmQueueEntryArrival(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: SmartQueueCheckInDto,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.confirmQueueEntryArrival(id, entryId, dto, accessToken);
  }

  @Patch(':id/queue-entries/:entryId/location-consent')
  @ApiOperation({ summary: 'Opt in or out of foreground-only location assistance for a queue ticket' })
  async updateQueueLocationConsent(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: SmartQueueConsentDto,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.updateQueueLocationConsent(id, entryId, dto, accessToken);
  }

  @Post(':id/queue-entries/:entryId/location-observation')
  @ApiOperation({ summary: 'Submit a consented, accuracy-checked foreground location observation' })
  async observeQueueEntryLocation(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: SmartQueueLocationDto,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.observeQueueEntryLocation(id, entryId, dto, accessToken);
  }

  @Post(':id/queue-entries/:entryId/departure-response')
  @ApiOperation({ summary: 'Let the customer confirm or dismiss a departure prompt' })
  async respondToQueueDeparture(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: SmartQueueDepartureResponseDto,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.respondToQueueDeparture(id, entryId, dto, accessToken);
  }

  @Post(':id/queue-entries/:entryId/customer-cancel')
  @ApiOperation({ summary: 'Allow a customer to cancel only their own unserved queue ticket' })
  async customerCancelQueueEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Headers('x-queue-access-token') accessToken?: string,
  ) {
    return this.salonsService.customerCancelQueueEntry(id, entryId, accessToken);
  }

  @Post(':id/queue-entries/:entryId/confirm-departure')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff confirms a customer has left before service and marks the ticket absent' })
  async confirmQueueDepartureByStaff(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salonsService.confirmQueueDepartureByStaff(id, entryId, user.id);
  }

  @Get(':id/queue-entries/:entryId')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get single queue ticket details and status by ID',
    description:
      'Returns complete queue entry details even if ticket is completed, in-service, or cancelled.',
  })
  async getQueueEntryById(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    return this.salonsService.getQueueEntryById(id, entryId);
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
    try {
      return await this.salonsService.addQueueEntry(
        id,
        dto,
        user?.role === 'CUSTOMER' ? user.id : undefined,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const prismaCode =
        error instanceof Prisma.PrismaClientKnownRequestError ? error.code : this.getDatabaseErrorCode(error);
      this.logger.error(JSON.stringify({
        event: 'queue.entry.request.failed',
        salonId: id,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        ...(prismaCode ? { databaseCode: prismaCode } : {}),
      }));

      if (prismaCode === 'P2002') {
        throw new ConflictException('A matching queue ticket already exists.');
      }
      if (prismaCode === 'P2003') {
        throw new BadRequestException('The selected service or staff member is invalid for this salon.');
      }
      if (prismaCode === 'P2025') {
        throw new NotFoundException('The salon or selected queue resource could not be found.');
      }
      if (
        ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2037'].includes(prismaCode || '') ||
        this.isDatabaseConnectionFailure(error)
      ) {
        throw new ServiceUnavailableException('The queue is temporarily unavailable. Please try again shortly.');
      }
      throw error;
    }
  }

  private getDatabaseErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null) return null;
    const candidate = 'code' in error ? error.code : 'errorCode' in error ? error.errorCode : null;
    return typeof candidate === 'string' && /^[A-Z0-9_]+$/.test(candidate) ? candidate : null;
  }

  private isDatabaseConnectionFailure(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return /EMAXCONNSESSION|max clients reached|too many connections|connection pool.*(?:timeout|closed)|timed out fetching a new connection|can't reach database server|server has closed the connection/i
      .test(error.message);
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
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset or clear all waiting customers in queue (Backwards-compatible)',
  })
  async clearQueueEntries(@Param('id') id: string) {
    return this.salonsService.clearQueueEntries(id);
  }

  // ==========================================================================
  // WHERE-IS-MY-TRAIN STYLE CROWDSOURCED LIVE LOCATION REPORTING
  // ==========================================================================

  @Post(':id/crowd-report')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Submit live crowdsourced salon status with GPS location verification (Where-Is-My-Train style)',
    description: 'Requires customer GPS coordinates to be within 3m of the salon. Updates estimated wait time and people count.',
  })
  @ApiResponse({ status: 201, description: 'Live crowd report verified and recorded' })
  @ApiResponse({ status: 403, description: 'Customer is not physically at the salon location' })
  async submitCrowdReport(
    @Param('id') id: string,
    @Body() dto: SubmitCrowdReportDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.salonsService.submitCrowdReport(id, dto, user?.id);
  }

  @Get(':id/crowd-report')
  @ApiOperation({
    summary: 'Get latest verified on-site crowd reports for a salon',
  })
  async getLatestCrowdReport(@Param('id') id: string) {
    return this.salonsService.getLatestCrowdReport(id);
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

  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new staff member to salon' })
  async createSalonStaff(
    @Param('id') id: string,
    @Body() dto: UpsertStaffDto,
  ) {
    return this.salonsService.upsertSalonStaff(id, dto);
  }

  @Patch(':id/staff/:staffId')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff member profile' })
  async updateSalonStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Body() dto: Partial<UpsertStaffDto>,
  ) {
    return this.salonsService.upsertSalonStaff(id, dto as any, staffId);
  }

  @Delete(':id/staff/:staffId')
  @UseGuards(JwtAuthGuard, SalonOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete or remove staff member from salon' })
  async deleteSalonStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
  ) {
    return this.salonsService.deleteSalonStaff(id, staffId);
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
