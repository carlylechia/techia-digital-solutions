export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "roles.manage",
  "admins.manage",
  "clients.manage",
  "projects.manage",
  "content.manage",
  "processes.manage",
  "requests.manage",
  "settings.manage",
  "audit.view"
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminRoleSeed = {
  name: string;
  label: string;
  description: string;
  level: number;
  permissions: AdminPermission[];
};

export const DEFAULT_ADMIN_ROLES: AdminRoleSeed[] = [
  {
    name: "super_admin",
    label: "Super Admin",
    description: "Full ownership of admins, roles, clients, content, processes, requests, settings, and audit history.",
    level: 100,
    permissions: [...ADMIN_PERMISSIONS]
  },
  {
    name: "admin",
    label: "Admin",
    description: "Runs the business workspace and can create/manage lower-level operational roles.",
    level: 70,
    permissions: ["dashboard.view", "admins.manage", "roles.manage", "clients.manage", "projects.manage", "content.manage", "processes.manage", "requests.manage", "audit.view"]
  },
  {
    name: "operations_manager",
    label: "Operations Manager",
    description: "Manages clients, projects, delivery boards, and inbound requests.",
    level: 55,
    permissions: ["dashboard.view", "clients.manage", "projects.manage", "processes.manage", "requests.manage"]
  },
  {
    name: "content_manager",
    label: "Content Manager",
    description: "Maintains page content and locale translations.",
    level: 45,
    permissions: ["dashboard.view", "content.manage"]
  },
  {
    name: "sales_manager",
    label: "Sales Manager",
    description: "Manages leads, client records, and project opportunities.",
    level: 45,
    permissions: ["dashboard.view", "clients.manage", "projects.manage", "requests.manage"]
  },
  {
    name: "viewer",
    label: "Viewer",
    description: "Read-only access for reporting and leadership visibility.",
    level: 10,
    permissions: ["dashboard.view", "audit.view"]
  }
];

export function normalizePermissions(permissions: string[] | null | undefined): AdminPermission[] {
  const allowed = new Set<string>(ADMIN_PERMISSIONS);
  return [...new Set((permissions || []).filter((permission) => allowed.has(permission)))] as AdminPermission[];
}

export function hasPermission(permissions: string[] | null | undefined, permission: AdminPermission) {
  return normalizePermissions(permissions).includes(permission);
}
