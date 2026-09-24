-- Add a blog-only editorial role without changing existing role assignments.
INSERT INTO "AdminRole" (
  "id",
  "name",
  "label",
  "description",
  "level",
  "permissions",
  "createdById",
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin_role_editor_default',
  'editor',
  'Blog Editor',
  'Reviews and manages all blog posts, taxonomy, media, and editorial audit history without access to business operations.',
  40,
  ARRAY[
    'blog.dashboard.view',
    'blog.posts.create',
    'blog.posts.manage',
    'blog.posts.publish',
    'blog.categories.manage',
    'blog.media.upload',
    'blog.media.manage',
    'blog.audit.view'
  ]::TEXT[],
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;
