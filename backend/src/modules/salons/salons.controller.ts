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
  @ApiOperation({
    summary: 'Add a customer to the live walk-in queue',
    description:
      'Adds a customer with their name, phone, and generates their queue ID / ticket number.',
  })
  async addQueueEntry(
    @Param('id') id: string,
    @Body() dto: CreateQueueEntryDto,
  ) {
    return this.salonsService.addQueueEntry(id, dto);
  }

  @Patch(':id/queue-entries/:entryId')
  @ApiOperation({
    summary: 'Update a customer queue entry status (e.g. in_service, completed, cancelled)',
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
    summary: 'Reset or clear all waiting customers in queue',
  })
  async clearQueueEntries(@Param('id') id: string) {
    return this.salonsService.clearQueueEntries(id);
  }
}
