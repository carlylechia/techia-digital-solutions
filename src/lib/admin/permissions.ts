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
  "audit.view",
  "blog.dashboard.view",
  "blog.posts.create",
  "blog.posts.edit.own",
  "blog.posts.submit.own",
  "blog.media.upload",
  "blog.profile.edit.own",
  "blog.posts.manage",
  "blog.posts.publish",
  "blog.writers.manage",
  "blog.categories.manage",
  "blog.media.manage",
  "blog.audit.view"
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminRoleSeed = {
  name: string;
  label: string;
  description: string;
  level: number;
  permissions: AdminPermission[];
};

export const BLOG_WRITER_PERMISSIONS: AdminPermission[] = [
  "blog.dashboard.view",
  "blog.posts.create",
  "blog.posts.edit.own",
  "blog.posts.submit.own",
  "blog.media.upload",
  "blog.profile.edit.own"
];

export const BLOG_EDITOR_PERMISSIONS: AdminPermission[] = [
  "blog.dashboard.view",
  "blog.posts.create",
  "blog.posts.manage",
  "blog.posts.publish",
  "blog.categories.manage",
  "blog.media.upload",
  "blog.media.manage",
  "blog.audit.view"
];

export const DEFAULT_ADMIN_ROLES: AdminRoleSeed[] = [
  {
    name: "super_admin",
    label: "Super Admin",
    description: "Full ownership of admins, roles, clients, content, editorial publishing, processes, requests, settings, and audit history.",
    level: 100,
    permissions: [...ADMIN_PERMISSIONS]
  },
  {
    name: "admin",
    label: "Admin",
    description: "Runs the business workspace and can manage editorial publishing and lower-level operational roles.",
    level: 70,
    permissions: [
      "dashboard.view",
      "admins.manage",
      "roles.manage",
      "clients.manage",
      "projects.manage",
      "content.manage",
      "processes.manage",
      "requests.manage",
      "audit.view",
      ...BLOG_WRITER_PERMISSIONS,
      "blog.posts.manage",
      "blog.posts.publish",
      "blog.writers.manage",
      "blog.categories.manage",
      "blog.media.manage",
      "blog.audit.view"
    ]
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
    description: "Manages public content, editorial review, publishing, categories, and media without access to writer accounts.",
    level: 45,
    permissions: [
      "dashboard.view",
      "content.manage",
      ...BLOG_WRITER_PERMISSIONS,
      "blog.posts.manage",
      "blog.posts.publish",
      "blog.categories.manage",
      "blog.media.manage",
      "blog.audit.view"
    ]
  },
  {
    name: "sales_manager",
    label: "Sales Manager",
    description: "Manages leads, client records, and project opportunities.",
    level: 45,
    permissions: ["dashboard.view", "clients.manage", "projects.manage", "requests.manage"]
  },
  {
    name: "editor",
    label: "Blog Editor",
    description: "Reviews and manages all blog posts, taxonomy, media, and editorial audit history without access to business operations.",
    level: 40,
    permissions: [...BLOG_EDITOR_PERMISSIONS]
  },
  {
    name: "writer",
    label: "Writer",
    description: "Creates and manages only their own drafts, media, author profile, and review submissions.",
    level: 20,
    permissions: BLOG_WRITER_PERMISSIONS
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
