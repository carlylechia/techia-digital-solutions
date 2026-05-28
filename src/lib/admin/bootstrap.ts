import type { PrismaClient } from "@prisma/client";
import { DEFAULT_ADMIN_ROLES } from "./permissions";

let bootstrapped = false;

const DEFAULT_NAV_ITEMS = [
  { labelEn: "Services", labelFr: "Services", href: "/services", position: 0 },
  { labelEn: "Solutions", labelFr: "Solutions", href: "/solutions", position: 1 },
  { labelEn: "Industries", labelFr: "Secteurs", href: "/industries", position: 2 },
  { labelEn: "Portfolio", labelFr: "Réalisations", href: "/portfolio", position: 3 },
  { labelEn: "Demo Lab", labelFr: "Espace démo", href: "/demo-lab", position: 4 },
  { labelEn: "Pricing", labelFr: "Offres", href: "/pricing", position: 5 },
  { labelEn: "Blog", labelFr: "Blog", href: "/blog", position: 6 },
  { labelEn: "Contact", labelFr: "Contact", href: "/contact", position: 7 }
];

export async function ensureDefaultAdminRoles(prisma: PrismaClient) {
  if (bootstrapped) return;
  for (const role of DEFAULT_ADMIN_ROLES) {
    await prisma.adminRole.upsert({
      where: { name: role.name },
      update: {
        label: role.label,
        description: role.description,
        level: role.level,
        permissions: role.permissions
      },
      create: role
    });
  }

  const navCount = await prisma.navMenuItem.count().catch(() => -1);
  if (navCount === 0) {
    await prisma.navMenuItem.createMany({ data: DEFAULT_NAV_ITEMS });
  }

  bootstrapped = true;
}
