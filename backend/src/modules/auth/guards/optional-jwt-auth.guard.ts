import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedUser, SalonMembershipItem } from '../interfaces/jwt-payload.interface';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
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
      return true;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return true;
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      return true;
    }

    if (!payload?.sub) {
      return true;
    }

    try {
      let user: any = null;
      try {
        user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            memberships: {
              where: { isActive: true },
              select: { salonId: true, role: true, isActive: true },
            },
          },
        });
      } catch {
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
        user = this.authService.findLocalUser(payload.sub);
      }

      if (user) {
        // Token invalidation check
        const lastLogout = user.lastLogoutAt || this.authService.findLocalUser(payload.sub)?.lastLogoutAt;
        if (payload.iat && lastLogout) {
          const tokenIssuedAt = payload.iat * 1000;
          const loggedOutAt = new Date(lastLogout).getTime();
          if (tokenIssuedAt <= loggedOutAt) {
            return true;
          }
        }

        const memberships: SalonMembershipItem[] = (user.memberships || []).map((m: any) => ({
          salonId: m.salonId,
          role: m.role as 'PARTNER_OWNER' | 'PARTNER_STAFF',
          isActive: m.isActive ?? (m.status === 'ACTIVE'),
          status: m.isActive ? 'ACTIVE' : (m.status || 'ACTIVE'),
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
      }
    } catch {}

    return true;
  }
}
