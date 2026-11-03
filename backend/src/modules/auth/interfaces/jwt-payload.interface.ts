export interface SalonMembershipItem {
  salonId: string;
  role: 'PARTNER_OWNER' | 'PARTNER_STAFF';
  isActive: boolean;
  status?: string;
}

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  memberships: SalonMembershipItem[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  memberships: SalonMembershipItem[];
}
