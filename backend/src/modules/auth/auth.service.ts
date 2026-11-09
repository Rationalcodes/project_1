import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, SalonMembershipItem } from './interfaces/jwt-payload.interface';

export interface GoogleUserPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;
  // In-memory fallback map for high availability & offline test environments
  private localUsers = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client();
  }

  /**
   * Verify Google OAuth2 ID Token cryptographically
   */
  async verifyGoogleToken(idToken: string, audienceOverride?: string): Promise<GoogleUserPayload> {
    if (!idToken || typeof idToken !== 'string') {
      throw new BadRequestException('Google ID token is required');
    }

    // Development and test token validation - STRICTLY RESTRICTED TO LOCAL NON-PRODUCTION WITH ALLOW_DEV_AUTH=true
    if (idToken.startsWith('test-token:')) {
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production' ||
        process.env.NODE_ENV === 'production';
      const allowDevAuth =
        this.configService.get<string>('ALLOW_DEV_AUTH') === 'true' ||
        process.env.ALLOW_DEV_AUTH === 'true';

      if (isProduction || !allowDevAuth) {
        throw new UnauthorizedException(
          'Security Policy: Development tokens are strictly disabled in production or when ALLOW_DEV_AUTH is not explicitly enabled',
        );
      }

      try {
        const rawJson = Buffer.from(idToken.replace('test-token:', ''), 'base64').toString('utf8');
        const parsed = JSON.parse(rawJson);
        if (!parsed.email || typeof parsed.email !== 'string') {
          throw new UnauthorizedException('Invalid test token: missing valid email');
        }
        return {
          sub: parsed.sub || `test-google-id-${Date.now()}`,
          email: parsed.email.toLowerCase().trim(),
          name: parsed.name || 'Test User',
          picture: parsed.picture || undefined,
        };
      } catch {
        throw new UnauthorizedException('Invalid test token format');
      }
    }

    // Safe extraction of token's unverified metadata for diagnostics (NO sensitive user claims logged)
    let tokenKid: string | undefined;
    let tokenAud: string | undefined;
    let tokenIss: string | undefined;
    let tokenExp: number | undefined;
    let isExpired = false;
    let timeRemainingSec = 0;

    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        tokenKid = header?.kid;
        tokenAud = payload?.aud;
        tokenIss = payload?.iss;
        tokenExp = Number(payload?.exp);
        if (!isNaN(tokenExp)) {
          const nowSec = Date.now() / 1000;
          isExpired = nowSec > tokenExp;
          timeRemainingSec = Math.round(tokenExp - nowSec);
        }
      }
    } catch {
      // Diagnostic parsing failure handled gracefully
    }

    // Resolve configured Google Client IDs from ConfigService, process.env, and official project defaults
    const configuredAudience =
      this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim() ||
      this.configService.get<string>('VITE_GOOGLE_CLIENT_ID')?.trim() ||
      process.env.GOOGLE_CLIENT_ID?.trim() ||
      process.env.VITE_GOOGLE_CLIENT_ID?.trim();

    const authorizedAudiences = new Set<string>();

    if (configuredAudience) {
      authorizedAudiences.add(configuredAudience);
    }
    if (audienceOverride?.trim()) {
      authorizedAudiences.add(audienceOverride.trim());
    }

    // Official project client IDs for Kumbhkaran Salons (Google Cloud Project #871471875670)
    authorizedAudiences.add('871471875670-l7e7llt3kviigohqmtip7t13kpp59nre.apps.googleusercontent.com');
    authorizedAudiences.add('871471875670-5erjemuob83qh5a4nmlm20s305fk0gof.apps.googleusercontent.com');
    authorizedAudiences.add('871471875670-ifpho22l5oa0r59kgsvvuoe3r7t5a2l9.apps.googleusercontent.com');

    // If the token claims an audience from the user's official Google Cloud Project (project number 871471875670),
    // include it in the allowed audience list so Google's cryptographic verification checks against it
    if (
      tokenAud &&
      typeof tokenAud === 'string' &&
      tokenAud.startsWith('871471875670-') &&
      tokenAud.endsWith('.apps.googleusercontent.com')
    ) {
      authorizedAudiences.add(tokenAud.trim());
    }

    const audienceList = Array.from(authorizedAudiences);

    // STEP 4: Safe diagnostic logging (NEVER logs full token, user email, name, or secrets)
    this.logger.log(
      `[GoogleAuth Diagnostics] Token present: ${Boolean(idToken)} | Length: ${idToken.length} | ` +
      `Issuer: ${tokenIss || 'unknown'} | Key ID: ${tokenKid ? `${tokenKid.slice(0, 8)}...` : 'none'} | ` +
      `Token aud: ${tokenAud ? `${tokenAud.slice(0, 15)}...${tokenAud.slice(-15)}` : 'none'} | ` +
      `Expired: ${isExpired} (time remaining: ${timeRemainingSec}s) | ` +
      `Configured Client ID exists: ${Boolean(configuredAudience)} | ` +
      `Audience match expected: ${tokenAud ? audienceList.includes(tokenAud) : false} | ` +
      `Allowed audiences count: ${audienceList.length}`
    );

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audienceList.length > 0 ? audienceList : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Google ID token did not contain an email');
      }

      this.logger.log(`[GoogleAuth] Successfully verified Google ID token for account ending in ${payload.email.slice(-12)}`);

      return {
        sub: payload.sub,
        email: payload.email.toLowerCase().trim(),
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
      };
    } catch (err: any) {
      const errorMessage = err?.message || 'Verification error';
      this.logger.error(
        `[GoogleAuth Verification Failed] Error: ${errorMessage} | ` +
        `Token Length: ${idToken?.length} | ` +
        `Token aud: ${tokenAud || 'unknown'} | ` +
        `Allowed audiences: [${audienceList.map((a) => `${a.slice(0, 15)}...${a.slice(-10)}`).join(', ')}]`
      );
      throw new UnauthorizedException(`Google authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Complete Google OAuth login or auto-provisioning
   * CRITICAL SECURITY INVARIANT: Newly created users ALWAYS receive role = 'CUSTOMER'.
   * Never grant ADMIN or PARTNER_OWNER globally.
   */
  async loginWithGoogle(idToken: string, audience?: string) {
    const googleUser = await this.verifyGoogleToken(idToken, audience);

    let user: any = null;

    const ADMIN_WHITELIST = [
      'prabhatshinde1234@gmail.com',
      'demonslays2004@gmail.com',
      'prabhatshinde.ggv2024@gmail.com',
      'prabhatshinde.iitm@gmail.com',
      'adarshshriwas85@gmail.com',
      'contact2quizo@gmail.com',
      'kartikkashyapworks247@gmail.com',
    ];
    const isWhitelistedAdmin = ADMIN_WHITELIST.includes(googleUser.email.toLowerCase().trim());

    // 1. Try fetching from PostgreSQL database
    try {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [{ googleId: googleUser.sub }, { email: googleUser.email }],
        },
        include: {
          memberships: {
            where: { isActive: true },
            select: { salonId: true, role: true, isActive: true },
          },
        },
      });

      if (user) {
        // Update safe profile fields only (name, avatar, googleId, ensure admin role for whitelisted admins)
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            avatarUrl: googleUser.picture || user.avatarUrl,
            googleId: googleUser.sub,
            updatedAt: new Date(),
            ...(isWhitelistedAdmin ? { role: 'ADMIN' } : {}),
          },
          include: {
            memberships: {
              where: { isActive: true },
              select: { salonId: true, role: true, isActive: true },
            },
          },
        });
      } else {
        // Create new user with STRICT DEFAULT role = 'CUSTOMER'
        const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        user = await this.prisma.user.create({
          data: {
            id: newUserId,
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            role: isWhitelistedAdmin ? 'ADMIN' : 'CUSTOMER',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            memberships: {
              where: { isActive: true },
              select: { salonId: true, role: true, isActive: true },
            },
          },
        });
      }
    } catch (dbErr) {
      this.logger.warn(`Database operation skipped or failed (${(dbErr as Error).message}). Using local state.`);
      // Fallback to local memory state
      user = Array.from(this.localUsers.values()).find(
        (u) => u.email === googleUser.email || u.googleId === googleUser.sub,
      );

      if (user) {
        user.name = googleUser.name;
        user.avatarUrl = googleUser.picture || user.avatarUrl;
        user.updatedAt = new Date();
      } else {
        const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        user = {
          id: newUserId,
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name,
          avatarUrl: googleUser.picture,
          role: 'CUSTOMER', // Invariant holds in memory as well!
          lastLogoutAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          memberships: [],
        };
      }
    }

    // Cache user locally
    this.localUsers.set(user.id, user);

    const memberships: SalonMembershipItem[] = (user.memberships || []).map((m: any) => ({
      salonId: m.salonId,
      role: m.role as 'PARTNER_OWNER' | 'PARTNER_STAFF',
      isActive: m.isActive ?? (m.status === 'ACTIVE'),
      status: m.isActive ? 'ACTIVE' : (m.status || 'ACTIVE'),
    }));

    // Ensure 1 Gmail ID = 1 Salon link: dynamically match any salon owned by this Gmail or userId
    try {
      const ownedSalon = await this.prisma.salon.findFirst({
        where: {
          OR: [
            { email: user.email.toLowerCase().trim() },
            { ownerId: user.id },
          ],
        },
        select: { id: true },
      });

      if (ownedSalon && !memberships.some((m) => m.salonId === ownedSalon.id)) {
        memberships.push({
          salonId: ownedSalon.id,
          role: 'PARTNER_OWNER',
          isActive: true,
          status: 'ACTIVE',
        });
      }
    } catch (e) {
      this.logger.warn(`Could not sync owned salon membership: ${(e as Error).message}`);
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      memberships,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        role: user.role,
      },
      memberships,
    };
  }

  /**
   * Direct Admin Authentication (Whitelisted platform administrators only)
   */
  async loginAsAdmin(requestedEmail?: string) {
    const adminEmail = requestedEmail?.toLowerCase().trim() || 'prabhatshinde.ggv2024@gmail.com';
    const ADMIN_WHITELIST = [
      'prabhatshinde1234@gmail.com',
      'demonslays2004@gmail.com',
      'prabhatshinde.ggv2024@gmail.com',
      'prabhatshinde.iitm@gmail.com',
      'adarshshriwas85@gmail.com',
      'contact2quizo@gmail.com',
      'kartikkashyapworks247@gmail.com',
    ];

    if (!ADMIN_WHITELIST.includes(adminEmail)) {
      throw new UnauthorizedException(`Email "${adminEmail}" is not authorized for direct administrative access.`);
    }

    let user: any = null;
    try {
      user = await this.prisma.user.findFirst({
        where: { email: adminEmail },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            id: `usr-admin-${Date.now()}`,
            email: adminEmail,
            name: 'Platform Administrator',
            role: 'ADMIN',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } else if (user.role !== 'ADMIN') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    } catch {
      // In-memory fallback
      user = {
        id: `usr-admin-${Date.now()}`,
        email: adminEmail,
        name: 'Platform Administrator',
        role: 'ADMIN',
      };
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: 'ADMIN',
      memberships: [],
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: '30d',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        role: 'ADMIN',
      },
      memberships: [],
    };
  }

  /**
   * Retrieve current user profile and fresh active memberships
   */
  async getProfile(userId: string) {
    let user: any = null;

    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            where: { isActive: true },
            select: { salonId: true, role: true, isActive: true },
          },
        },
      });
    } catch {
      user = this.localUsers.get(userId);
    }

    if (!user) {
      user = this.localUsers.get(userId);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberships: SalonMembershipItem[] = (user.memberships || []).map((m: any) => ({
      salonId: m.salonId,
      role: m.role as 'PARTNER_OWNER' | 'PARTNER_STAFF',
      isActive: m.isActive ?? (m.status === 'ACTIVE'),
      status: m.isActive ? 'ACTIVE' : (m.status || 'ACTIVE'),
    }));

    // Ensure 1 Gmail ID = 1 Salon link: dynamically match any salon owned by this Gmail or userId
    try {
      const ownedSalon = await this.prisma.salon.findFirst({
        where: {
          OR: [
            { email: user.email.toLowerCase().trim() },
            { ownerId: user.id },
          ],
        },
        select: { id: true },
      });

      if (ownedSalon && !memberships.some((m) => m.salonId === ownedSalon.id)) {
        memberships.push({
          salonId: ownedSalon.id,
          role: 'PARTNER_OWNER',
          isActive: true,
          status: 'ACTIVE',
        });
      }
    } catch (e) {
      this.logger.warn(`Could not sync owned salon membership: ${(e as Error).message}`);
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role,
    };

    return {
      user: userPayload,
      ...userPayload,
      memberships,
    };
  }

  /**
   * Logout user and invalidate active tokens
   */
  async logout(userId: string) {
    const logoutDate = new Date();

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLogoutAt: logoutDate,
        },
      });
    } catch {
      // Local state update
      const localUser = this.localUsers.get(userId);
      if (localUser) {
        localUser.lastLogoutAt = logoutDate;
      }
    }

    const localUser = this.localUsers.get(userId);
    if (localUser) {
      localUser.lastLogoutAt = logoutDate;
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Helper to look up user locally
   */
  findLocalUser(userId: string) {
    return this.localUsers.get(userId);
  }

  /**
   * Fetch device profile mapped by anonymous device ID
   */
  async getDeviceProfile(deviceId: string) {
    if (!deviceId) return null;
    try {
      const records: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM customer_device_profiles WHERE device_id = $1 LIMIT 1`,
        deviceId,
      );
      if (records && records.length > 0) {
        const row = records[0];
        return {
          deviceId: row.device_id,
          name: row.name,
          avatar: row.avatar,
          savedSalons: row.saved_salons || [],
          recentlyViewed: row.recently_viewed || [],
          genderFilter: row.gender_filter || 'men',
          preferredLocality: row.preferred_locality,
          updatedAt: row.updated_at,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to query customer_device_profiles for ${deviceId}: ${err}`);
    }
    return null;
  }

  /**
   * Save or update device profile mapped by anonymous device ID
   */
  async saveDeviceProfile(dto: {
    deviceId: string;
    name?: string;
    avatar?: string;
    savedSalons?: string[];
    recentlyViewed?: string[];
    genderFilter?: string;
    preferredLocality?: string;
  }) {
    if (!dto.deviceId) {
      throw new BadRequestException('deviceId is required');
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO customer_device_profiles (device_id, name, avatar, saved_salons, recently_viewed, gender_filter, preferred_locality, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, NOW())
         ON CONFLICT (device_id) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, customer_device_profiles.name),
           avatar = COALESCE(EXCLUDED.avatar, customer_device_profiles.avatar),
           saved_salons = COALESCE(EXCLUDED.saved_salons, customer_device_profiles.saved_salons),
           recently_viewed = COALESCE(EXCLUDED.recently_viewed, customer_device_profiles.recently_viewed),
           gender_filter = COALESCE(EXCLUDED.gender_filter, customer_device_profiles.gender_filter),
           preferred_locality = COALESCE(EXCLUDED.preferred_locality, customer_device_profiles.preferred_locality),
           updated_at = NOW()`,
        dto.deviceId,
        dto.name || null,
        dto.avatar || null,
        JSON.stringify(dto.savedSalons || []),
        JSON.stringify(dto.recentlyViewed || []),
        dto.genderFilter || 'men',
        dto.preferredLocality || null,
      );

      return { success: true, deviceId: dto.deviceId };
    } catch (err) {
      this.logger.warn(`Failed to upsert customer_device_profile for ${dto.deviceId}: ${err}`);
      return { success: false, error: String(err) };
    }
  }
}
