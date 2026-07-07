import type { PrismaClient } from "@prisma/client";
import { DEFAULT_ADMIN_ROLES } from "./permissions";

let bootstrapped = false;

const DEFAULT_NAV_ITEMS = [
  { labelEn: "Services", labelFr: "Services", href: "/services", position: 0 },
  { labelEn: "Courses", labelFr: "Cours", href: "/courses", position: 1 },
  {
    labelEn: "Demo Lab",
    labelFr: "Espace démo",
    href: "/demo-lab",
    position: 2,
  },
  {
    labelEn: "AI Consultant",
    labelFr: "Agent IA",
    href: "/ai-consultant",
    position: 3,
  },
  { labelEn: "About", labelFr: "À propos", href: "/about", position: 4 },
  { labelEn: "Contact", labelFr: "Contact", href: "/contact", position: 5 },
  { labelEn: "Founder", labelFr: "Fondateur", href: "/founder", position: 6 },
  {
    labelEn: "Client Portal",
    labelFr: "Portail client",
    href: "/client-portal",
    position: 7,
  },
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
        permissions: role.permissions,
      },
      create: role,
    });
  }

  const navCount = await prisma.navMenuItem.count().catch(() => -1);
  if (navCount === 0) {
    await prisma.navMenuItem.createMany({ data: DEFAULT_NAV_ITEMS });
  }

  bootstrapped = true;
}
