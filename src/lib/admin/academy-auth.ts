import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  DEFAULT_ADMIN_ROLES,
  hasPermission,
  normalizePermissions,
} from "@/lib/admin/permissions";

export type AcademyApiAuth =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; status: 401 | 403 | 503; error: string };

/**
 * API-surface authorization for academy catalog mutations. Mirrors the editorial
 * media endpoint's defense in depth: the JWT is only used to find the admin
 * record — permissions are always re-read from PostgreSQL so a stale or revoked
 * session can never keep upload or catalog rights.
 */
export async function requireAcademyCatalogManagerApi(): Promise<AcademyApiAuth> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId || !session?.user?.email) {
    return { ok: false, status: 401, error: "Authentication is required." };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return { ok: false, status: 503, error: "Database is unavailable." };
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      roleRef: { select: { permissions: true } },
    },
  });
  if (!user || user.status !== "ACTIVE") {
    return { ok: false, status: 401, error: "Authentication is required." };
  }

  const permissions = normalizePermissions(
    user.roleRef?.permissions ||
      (user.role === "super_admin" ? DEFAULT_ADMIN_ROLES[0].permissions : []),
  );
  if (!hasPermission(permissions, "academy.catalog.manage")) {
    return {
      ok: false,
      status: 403,
      error: "You do not have permission to manage the academy catalog.",
    };
  }

  return { ok: true, user: { id: user.id, email: user.email } };
}
