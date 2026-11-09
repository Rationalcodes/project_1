import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with Google OAuth ID Token',
    description:
      'Verifies Google ID token, registers new users with default CUSTOMER role, loads active salon memberships, and issues a signed JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns access token, user profile, and salon memberships.',
  })
  @ApiResponse({
    status: 401,
    description: 'Google ID token verification failed or expired.',
  })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(dto.credential, dto.clientId);
  }

  @Post('admin-direct-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Direct Administrator Authentication (Whitelisted Admins Only)',
    description:
      'Issues signed administrative JWT token for whitelisted platform admins to access SLOON HQ without OAuth browser blockers.',
  })
  async adminDirectAuth(@Body('email') email?: string) {
    return this.authService.loginAsAdmin(email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user profile and salon memberships',
    description:
      'Returns verified user profile, global role (CUSTOMER or ADMIN), and active salon memberships.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile returned successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, expired, or revoked authentication token.',
  })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Invalidate current user session and revoke active tokens',
    description:
      'Updates user last_logout_at timestamp in the database to invalidate existing JWT tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully.',
  })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }

  @Get('device-profile/:deviceId')
  @ApiOperation({
    summary: 'Get customer device profile by device ID',
    description:
      'Retrieves mapped anonymous visitor profile (name, saved salons, preferences) for device continuity across sessions without sign-in.',
  })
  async getDeviceProfile(@Param('deviceId') deviceId: string) {
    return this.authService.getDeviceProfile(deviceId);
  }

  @Post('device-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save or update customer device profile',
    description:
      'Persists visitor name, saved salons, and preferences mapped to device ID for persistent recognition on next visit.',
  })
  async saveDeviceProfile(@Body() body: any) {
    return this.authService.saveDeviceProfile(body);
  }
}
