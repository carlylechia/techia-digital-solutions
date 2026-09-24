-- Add the Blog item to the existing managed navigation without changing any
-- current navigation row. This is separate from schema DDL so the editorial
-- migration remains reversible independently of navigation data.
INSERT INTO "NavMenuItem" ("id", "labelEn", "labelFr", "href", "visible", "position", "openNewTab", "createdAt", "updatedAt")
SELECT 'blog_navigation_default', 'Blog', 'Blog', '/blog', true, 7, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "NavMenuItem" WHERE "href" = '/blog');
