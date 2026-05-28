import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      role: string;
      roleLevel: number;
      permissions: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    role?: string;
    roleLevel?: number;
    permissions?: string[];
  }
}
