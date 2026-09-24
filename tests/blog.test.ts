import { describe, expect, it } from "vitest";
import { detectImageMime, isAllowedBlogImageMime } from "@/lib/blog/media-validation";
import { hasPermission, BLOG_EDITOR_PERMISSIONS, BLOG_WRITER_PERMISSIONS, DEFAULT_ADMIN_ROLES } from "@/lib/admin/permissions";
import { normalizeArticleHtml, sanitizeArticleHtml, htmlToPlainText, countArticleInternalLinks, calculateReadingTime } from "@/lib/blog/sanitize";
import { markdownToHtml, normalizeRichTextSource } from "@/lib/blog/rich-text";
import { getBlogPostPath, getBlogCategoryPath, getBlogAuthorPath, normalizeCtaHref, slugify } from "@/lib/blog/slug";
import { getSeoIssues } from "@/lib/blog/validation";
import { canEditBlogPost, canTransitionBlogPost } from "@/lib/blog/authorization";
import { assertWorkflowTransition, canWriterEditPost, canWriterTransition } from "@/lib/blog/workflow";
import { buildArticleMetadata, articleJsonLd } from "@/lib/blog/seo";

const post = {
  title: "A useful article",
  slug: "a-useful-article",
  excerpt: "A clear summary that helps a business choose a useful next step.",
  content: "<p>Read this practical guide.</p>",
  locale: "en" as const,
  seoTitle: "A useful article for growing businesses",
  seoDescription: "A practical guide for growing businesses that want clearer digital systems and a better customer journey.",
  canonicalUrl: null,
  featuredImageUrl: "https://res.cloudinary.com/demo/image/upload/example.jpg",
  featuredImageAlt: "A team reviewing a digital plan",
  ogImageUrl: null,
  publishedAt: new Date("2026-01-02T10:00:00.000Z"),
  updatedAt: new Date("2026-01-03T10:00:00.000Z"),
  allowIndex: true,
  nofollow: false,
  author: { displayName: "A. Writer", slug: "a-writer" },
  category: { name: "SEO", slug: "seo" },
  tags: [{ tag: { name: "Search" } }],
  translationGroup: { posts: [{ locale: "en" as const, slug: "a-useful-article" }, { locale: "fr" as const, slug: "un-article-utile" }] },
};

 describe("blog security and workflow", () => {
  it("allows writers to edit drafts and submit, but not publish", () => {
    expect(canWriterEditPost("DRAFT")).toBe(true);
    expect(canWriterEditPost("CHANGES_REQUESTED")).toBe(true);
    expect(canWriterEditPost("IN_REVIEW")).toBe(false);
    expect(canWriterTransition("DRAFT", "SUBMIT")).toBe(true);
    expect(canWriterTransition("DRAFT", "PUBLISH")).toBe(false);
    expect(() => assertWorkflowTransition({ status: "DRAFT", action: "PUBLISH", isAdmin: false })).toThrow();
    expect(() => assertWorkflowTransition({ status: "IN_REVIEW", action: "PUBLISH", isAdmin: true })).not.toThrow();
  });

  it("keeps the writer role separate from operational permissions", () => {
    const writer = DEFAULT_ADMIN_ROLES.find((role) => role.name === "writer");
    expect(writer?.permissions).toEqual(BLOG_WRITER_PERMISSIONS);
    expect(hasPermission(writer?.permissions || [], "clients.manage")).toBe(false);
    expect(hasPermission(writer?.permissions || [], "blog.posts.publish")).toBe(false);
    expect(hasPermission(writer?.permissions || [], "blog.posts.edit.own")).toBe(true);
  });

  it("defines a blog-only editor role with all-post editorial access", () => {
    const editor = DEFAULT_ADMIN_ROLES.find((role) => role.name === "editor");
    expect(editor?.permissions).toEqual(BLOG_EDITOR_PERMISSIONS);
    expect(editor?.label).toBe("Blog Editor");
    expect(hasPermission(editor?.permissions || [], "blog.posts.manage")).toBe(true);
    expect(hasPermission(editor?.permissions || [], "blog.posts.publish")).toBe(true);
    expect(hasPermission(editor?.permissions || [], "dashboard.view")).toBe(false);
    expect(hasPermission(editor?.permissions || [], "content.manage")).toBe(false);
    expect(hasPermission(editor?.permissions || [], "clients.manage")).toBe(false);
    expect(hasPermission(editor?.permissions || [], "blog.writers.manage")).toBe(false);
    expect(canEditBlogPost({ permissions: BLOG_EDITOR_PERMISSIONS, actorId: "editor-1", authorUserId: "writer-2", status: "PUBLISHED" })).toBe(true);
  });

  it("enforces ownership and role boundaries independently of the UI", () => {
    const writer = { permissions: BLOG_WRITER_PERMISSIONS, actorId: "writer-1" };
    expect(canEditBlogPost({ ...writer, authorUserId: "writer-1", status: "DRAFT" })).toBe(true);
    expect(canEditBlogPost({ ...writer, authorUserId: "writer-2", status: "DRAFT" })).toBe(false);
    expect(canEditBlogPost({ ...writer, authorUserId: "writer-1", status: "IN_REVIEW" })).toBe(false);
    expect(canTransitionBlogPost({ ...writer, authorUserId: "writer-1", status: "DRAFT", action: "SUBMIT" })).toBe(true);
    expect(canTransitionBlogPost({ ...writer, authorUserId: "writer-1", status: "DRAFT", action: "PUBLISH" })).toBe(false);
    expect(canEditBlogPost({ permissions: ["blog.posts.manage"], actorId: "admin-1", authorUserId: "writer-2", status: "PUBLISHED" })).toBe(true);
  });
  it("rejects spoofed or executable media signatures", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]).buffer;
    const script = new TextEncoder().encode("<script>alert(1)</script>").buffer;
    expect(detectImageMime(jpeg)).toBe("image/jpeg");
    expect(isAllowedBlogImageMime(detectImageMime(jpeg))).toBe(true);
    expect(detectImageMime(script)).toBeNull();
    expect(isAllowedBlogImageMime("image/svg+xml")).toBe(false);
  });

  it("removes executable and unsafe HTML while retaining semantic article markup", () => {
    const clean = sanitizeArticleHtml(`<h2 onclick="alert(1)">Heading</h2><p>Hello <strong>world</strong></p><script>alert(1)</script><a href="javascript:alert(1)" target="_blank">bad</a><a href="/services/seo">service</a><img src="data:image/svg+xml;base64,abc" onerror="alert(1)"><img src="https://res.cloudinary.com/demo/image/upload/a.jpg" alt="A chart">`);
    expect(clean).toContain("<h2>Heading</h2>");
    expect(clean).toContain("<strong>world</strong>");
    expect(clean).toContain('href="/services/seo"');
    expect(clean).toContain('src="https://res.cloudinary.com/demo/image/upload/a.jpg"');
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("data:image");
  });

  it("converts Markdown and normalizes imported HTML before display", () => {
    const markdown = "# Main heading\n\nA **useful** paragraph with a [service link](/services).\n\n- First point\n- Second point\n\n> A reader quote\n\n```ts\nconst ready = true;\n```";
    const html = normalizeArticleHtml(markdown);
    expect(html).toContain("<h2>Main heading</h2>");
    expect(html).toContain("<strong>useful</strong>");
    expect(html).toContain('href="/services"');
    expect(html).toContain("<ul><li>First point</li><li>Second point</li></ul>");
    expect(html).toContain("<blockquote>A reader quote</blockquote>");
    expect(html).toContain("<pre><code>const ready = true;</code></pre>");
    expect(markdownToHtml("| Name | Value |\n| --- | --- |\n| One | Two |")).toContain("<th scope=\"col\">Name</th>");
    expect(htmlToPlainText(markdown)).not.toContain("#");
    expect(countArticleInternalLinks(markdown)).toBe(1);
    expect(normalizeArticleHtml('<h1 style="color:red">Imported</h1><div><p>Body</p></div>')).toContain("<h2>Imported</h2>");
    expect(normalizeRichTextSource("<h1>Imported</h1>")).toContain("<h2>Imported</h2>");
  });

  it("keeps Markdown conversion deterministic and readable", () => {
    expect(markdownToHtml("## Section\n\nPlain text")).toBe("<h3>Section</h3><p>Plain text</p>");
    expect(sanitizeArticleHtml("<div><p>Nested <strong>safe</strong></p></div>")).toContain("<strong>safe</strong>");
  });

  it("calculates readable text and internal-link signals", () => {
    const html = `<p>${"word ".repeat(225)}</p><p><a href="/contact">Contact</a> <a href="https://example.com">External</a></p>`;
    expect(htmlToPlainText(html)).toContain("word");
    expect(calculateReadingTime(html)).toBeGreaterThanOrEqual(2);
    expect(countArticleInternalLinks(html)).toBe(1);
  });

  it("rejects content that sanitizes to no readable text", () => {
    const issues = getSeoIssues({ title: post.title, excerpt: post.excerpt, content: "<script>alert(1)</script>", featuredImageUrl: null, featuredImageAlt: null, hasAuthor: true, hasCategory: true, internalLinkCount: 1 });
    expect(issues.some((issue) => issue.field === "content" && issue.severity === "error")).toBe(true);
  });

  it("allows a complete article to publish with only optional recommendations", () => {
    const content = `<p>${Array.from({ length: 250 }, () => "word").join(" ")} <a href="/contact">Contact</a></p>`;
    const issues = getSeoIssues({ title: "A complete and useful article title", excerpt: post.excerpt, content, featuredImageUrl: "https://res.cloudinary.com/demo/image/upload/a.jpg", featuredImageAlt: "A useful chart", hasAuthor: true, hasCategory: true, internalLinkCount: 1 });
    expect(issues.some((issue) => issue.severity === "error")).toBe(false);
  });

  it("creates stable localized public paths and safe slugs", () => {
    expect(slugify("  Digital Transformation & AI  ")).toBe("digital-transformation-and-ai");
    expect(getBlogPostPath("fr", "article-safe")).toBe("/fr/blog/article-safe");
    expect(getBlogCategoryPath("en", "seo")).toBe("/en/blog/category/seo");
    expect(getBlogAuthorPath("fr", "jane-doe")).toBe("/fr/blog/author/jane-doe");
    expect(normalizeCtaHref("javascript:alert(1)")).toBeNull();
    expect(normalizeCtaHref("https://example.com/contact")).toBe("https://example.com/contact");
  });

  it("produces article metadata and structured data with language alternates", () => {
    const metadata = buildArticleMetadata("en", post);
    expect(metadata.alternates?.canonical).toBe("https://techiadigital.com/en/blog/a-useful-article");
    expect(metadata.alternates?.languages?.["fr-FR"]).toBe("https://techiadigital.com/fr/blog/un-article-utile");
    expect(metadata.openGraph && "type" in metadata.openGraph ? metadata.openGraph.type : undefined).toBe("article");
    const schema = articleJsonLd("en", post) as Record<string, unknown>;
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.author).toMatchObject({ "@type": "Person", name: "A. Writer" });
    expect(schema.datePublished).toBe("2026-01-02T10:00:00.000Z");
  });

  it("reports publication blockers without inventing content", () => {
    const issues = getSeoIssues({ title: post.title, excerpt: post.excerpt, content: "<p>Too short</p>", featuredImageUrl: null, featuredImageAlt: null, hasAuthor: false, hasCategory: false, internalLinkCount: 0 });
    expect(issues.some((issue) => issue.field === "authorId" && issue.severity === "error")).toBe(true);
    expect(issues.some((issue) => issue.field === "categoryId" && issue.severity === "error")).toBe(true);
    expect(issues.some((issue) => issue.field === "content" && issue.severity === "warning")).toBe(true);
    expect(issues.some((issue) => issue.field === "featuredImageUrl" && issue.severity === "warning")).toBe(true);
  });
});
