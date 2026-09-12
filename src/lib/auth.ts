import { timingSafeEqual } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ensureDefaultAdminRoles } from "@/lib/admin/bootstrap";
import { DEFAULT_ADMIN_ROLES, normalizePermissions } from "@/lib/admin/permissions";
import { getPrisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

type AdminAuthUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  roleLevel: number;
  permissions: string[];
};

function toAuthUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  roleRef: { name: string; level: number; permissions: string[] } | null;
}): AdminAuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.roleRef?.name || user.role,
    roleLevel: user.roleRef?.level || (user.role === "super_admin" ? 100 : 70),
    permissions: normalizePermissions(user.roleRef?.permissions || (user.role === "super_admin" ? DEFAULT_ADMIN_ROLES[0].permissions : DEFAULT_ADMIN_ROLES[1].permissions))
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD_SEED;
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password || "";

        if (!email || !password) return null;

        const isBootstrapCredential =
          Boolean(adminEmail && adminPassword) &&
          constantTimeEqual(email, adminEmail || "") &&
          constantTimeEqual(password, adminPassword || "");

        const prisma = getPrisma();
        if (prisma) {
          await ensureDefaultAdminRoles(prisma);
          const existingUser = await prisma.adminUser.findUnique({
            where: { email },
            include: { roleRef: true }
          });

          if (existingUser?.status === "DISABLED") return null;

          if (existingUser?.passwordHash && (await verifyPassword(password, existingUser.passwordHash))) {
            await prisma.adminUser.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } });
            return toAuthUser(existingUser);
          }

          if (isBootstrapCredential) {
            const superRole = await prisma.adminRole.findUniqueOrThrow({ where: { name: "super_admin" } });
            const bootstrappedUser = await prisma.adminUser.upsert({
              where: { email },
              update: {
                name: existingUser?.name || "teChia Super Admin",
                passwordHash: await hashPassword(password),
                role: "super_admin",
                roleId: superRole.id,
                status: "ACTIVE",
                lastLoginAt: new Date()
              },
              create: {
                email,
                name: "teChia Super Admin",
                passwordHash: await hashPassword(password),
                role: "super_admin",
                roleId: superRole.id,
                status: "ACTIVE",
                lastLoginAt: new Date()
              },
              include: { roleRef: true }
            });
            return toAuthUser(bootstrappedUser);
          }

          return null;
        }

        if (!isBootstrapCredential) return null;
        return {
          id: "bootstrap-admin",
          name: "teChia Super Admin",
          email,
          role: "super_admin",
          roleLevel: 100,
          permissions: DEFAULT_ADMIN_ROLES[0].permissions
        };
      }
    })
  ],
  pages: { signIn: "/admin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const admin = user as typeof user & AdminAuthUser;
        token.adminId = admin.id;
        token.role = admin.role;
        token.roleLevel = admin.roleLevel;
        token.permissions = admin.permissions;
      } else if (!token.adminId && token.email) {
        // Stale token missing custom fields — repopulate from DB once
        const prisma = getPrisma();
        if (prisma) {
          const dbUser = await prisma.adminUser.findUnique({
            where: { email: String(token.email) },
            include: { roleRef: true }
          });
          if (dbUser && dbUser.status !== "DISABLED") {
            const refreshed = toAuthUser(dbUser);
            token.adminId = refreshed.id;
            token.role = refreshed.role;
            token.roleLevel = refreshed.roleLevel;
            token.permissions = refreshed.permissions;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.adminId) {
        session.user.id = String(token.adminId);
        session.user.name = session.user.name || "teChia Admin";
        session.user.role = String(token.role || "admin");
        session.user.roleLevel = Number(token.roleLevel || 50);
        session.user.permissions = Array.isArray(token.permissions) ? token.permissions.map(String) : [];
      } else if (session.user) {
        session.user.role = String(token.role || "admin");
        session.user.roleLevel = Number(token.roleLevel || 50);
        session.user.permissions = [];
      }
      return session;
    }
  }
};
