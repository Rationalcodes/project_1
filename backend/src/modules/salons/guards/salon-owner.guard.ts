import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SalonOwnerGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const salonId = request.params?.id || request.body?.salon_id || request.body?.salonId;

    // 1. Authenticate user from Bearer JWT
    let user: AuthenticatedUser = request.user;
    if (!user) {
      const authHeader = request.headers['authorization'];
      if (!authHeader || typeof authHeader !== 'string') {
        throw new UnauthorizedException('Authentication required: Missing Authorization header');
      }

      const [scheme, token] = authHeader.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !token) {
        throw new UnauthorizedException('Invalid Authorization header format. Expected "Bearer <token>"');
      }

      try {
        const payload: any = await this.jwtService.verifyAsync(token);
        user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role || 'CUSTOMER',
          memberships: payload.memberships || [],
        };
        request.user = user;
      } catch {
        throw new UnauthorizedException('Invalid or expired authentication token');
      }
    }

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required: Valid user session not found');
    }

    // 2. Global platform ADMIN can perform administrative overrides
    if (user.role === 'ADMIN') {
      return true;
    }

    // If endpoint doesn't target a specific salon, allow authenticated user through
    if (!salonId) {
      return true;
    }

    // 3. Verify salon ownership or active PARTNER_OWNER membership
    let salon: any = null;
    let isMemberOwner = false;

    try {
      salon = await this.prisma.salon.findUnique({
        where: { id: salonId },
        select: { id: true, ownerId: true, status: true, isVerified: true, email: true },
      });

      if (salon) {
        const memberRecord = await this.prisma.salonMember.findFirst({
          where: {
            salonId: salonId,
            userId: user.id,
            isActive: true,
          },
        });
        isMemberOwner = memberRecord?.role === 'PARTNER_OWNER';
      }
    } catch {
      throw new InternalServerErrorException('Salon authorization could not be verified.');
    }

    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' was not found`);
    }

    const userEmailNorm = (user.email || '').toLowerCase().trim();
    const salonEmailNorm = (salon.email || '').toLowerCase().trim();
    let isDirectOwner =
      salon.ownerId === user.id ||
      (Boolean(userEmailNorm) && Boolean(salonEmailNorm) && userEmailNorm === salonEmailNorm);

    // Auto-link ownerId if matched by email or missing
    if (isDirectOwner && user.id && (!salon.ownerId || salon.ownerId !== user.id)) {
      try {
        await this.prisma.salon.update({
          where: { id: salonId },
          data: { ownerId: user.id },
        });
        salon.ownerId = user.id;
      } catch {}
    }

    if (!isMemberOwner) {
      isMemberOwner = (user.memberships || []).some(
        (m) =>
          m.salonId === salonId &&
          m.role === 'PARTNER_OWNER' &&
          (m.isActive === true || m.status === 'ACTIVE'),
      );
    }

    // Check salonMember by user email if not matched by ID
    if (!isMemberOwner && !isDirectOwner && userEmailNorm) {
      try {
        const userRec = await this.prisma.user.findFirst({
          where: { email: { equals: userEmailNorm, mode: 'insensitive' as const } },
          select: { id: true },
        });
        if (userRec) {
          const mem = await this.prisma.salonMember.findFirst({
            where: { salonId, userId: userRec.id, isActive: true },
          });
          if (mem && mem.role === 'PARTNER_OWNER') {
            isMemberOwner = true;
          }
        }
      } catch {}
    }

    if (!isDirectOwner && !isMemberOwner) {
      throw new ForbiddenException(
        'Security Violation: You do not have owner authorization to modify or manage this salon',
      );
    }

    // 4. Enforce Admin Authorization Gate: Salons must be approved by an Admin before accessing platform operations
    if (salon.status === 'pending' || salon.isVerified === false) {
      throw new ForbiddenException(
        'Platform Access Locked: This salon is currently pending Administrator review and authorization. Operational platform features will unlock once approved by SLOON HQ.',
      );
    }

    request.verifiedSalon = salon;
    request.ownerId = user.id;
    return true;
  }
}
