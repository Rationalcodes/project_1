import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedUser, SalonMembershipItem } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Authentication required: Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format. Expected "Bearer <token>"');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Malformed token payload');
    }

    // Verify user in database
    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            where: { status: 'ACTIVE' },
            select: { salonId: true, role: true, status: true },
          },
        },
      });
    } catch {
      // Check local memory cache if database query fails
      const cached = this.authService.findLocalUser(payload.sub);
      user = cached || {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'CUSTOMER',
        lastLogoutAt: null,
        memberships: payload.memberships || [],
      };
    }

    if (!user) {
      const cached = this.authService.findLocalUser(payload.sub);
      user = cached;
    }

    if (!user) {
      throw new UnauthorizedException('User associated with this token no longer exists');
    }

    // Server-side token invalidation check (e.g. after logout)
    const lastLogout = user.lastLogoutAt || this.authService.findLocalUser(payload.sub)?.lastLogoutAt;
    if (payload.iat && lastLogout) {
      const tokenIssuedAt = payload.iat * 1000;
      const loggedOutAt = new Date(lastLogout).getTime();
      if (tokenIssuedAt <= loggedOutAt) {
        throw new UnauthorizedException('Session has expired or was revoked. Please log in again.');
      }
    }

    const memberships: SalonMembershipItem[] = (user.memberships || []).map((m: any) => ({
      salonId: m.salonId,
      role: m.role as 'PARTNER_OWNER' | 'PARTNER_STAFF',
      status: m.status as 'ACTIVE' | 'INACTIVE' | 'INVITED',
    }));

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      memberships,
    };

    request.user = authenticatedUser;
    return true;
  }
}
