import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export type UserRole = 
  | 'ADMIN' 
  | 'OPERATOR' 
  | 'REGIONAL_MANAGER' 
  | 'CLIENT_NETWORK_HEAD' 
  | 'CLIENT_POINT_MANAGER' 
  | 'CLIENT_SPECIALIST' 
  | 'ENGINEER' 
  | 'CLIENT_MANAGER';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      phone?: string | null;
      region?: string | null;
      locationId?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    phone?: string | null;
    region?: string | null;
    locationId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: string | null;
    region?: string | null;
    locationId?: string | null;
  }
}


