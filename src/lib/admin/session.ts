import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { hasPermission, normalizePermissions, type AdminPermission } from "./permissions";

export type AdminSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  roleLevel: number;
  permissions: string[];
};

export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) return null;
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    include: { roleRef: true },
  });
  if (!user || user.status !== "ACTIVE" || !user.roleRef) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.roleRef.name,
    roleLevel: user.roleRef.level,
    permissions: normalizePermissions(user.roleRef.permissions),
  };
}

export async function requireAdmin(permission?: AdminPermission) {
  const user = await getAdminSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (permission && !hasPermission(user.permissions, permission)) throw new Error("Forbidden");
  return user;
}

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      ip: input.ip || null
    }
  });
}
