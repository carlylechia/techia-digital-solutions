import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { assertSameOrigin, requireBlogUser, BlogAuthorizationError } from "@/lib/blog/auth";
import { getPrisma } from "@/lib/prisma";
import { updateBlogPost, BlogConflictError } from "@/lib/blog/service";
import { blogPostPayloadSchema } from "@/lib/blog/validation";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, key: string) {
  return formData.getAll(key).some((value) => value === "on" || value === "true" || value === "1");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireBlogUser();
    const rate = checkRateLimit(`blog-autosave:${actor.id}:${requestIp(request.headers)}`, 60, 60_000);
    if (!rate.ok) return NextResponse.json({ ok: false, error: "Too many save attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" } });
    const { id } = await context.params;
    const formData = await request.formData();
    const prisma = getPrisma();
    const existing = prisma ? await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } }) : null;
    const payload = blogPostPayloadSchema.parse({
      title: text(formData, "title"),
      slug: text(formData, "slug") || existing?.slug || "",
      excerpt: text(formData, "excerpt"),
      content: text(formData, "content"),
      locale: text(formData, "locale") || "en",
      categoryId: text(formData, "categoryId"),
      authorId: text(formData, "authorId"),
      translationSourcePostId: text(formData, "translationSourcePostId"),
      tagIds: formData.getAll("tagIds").filter((value): value is string => typeof value === "string"),
      relatedPostIds: text(formData, "relatedPostIds").split(",").map((item) => item.trim()).filter(Boolean),
      seoTitle: text(formData, "seoTitle"),
      seoDescription: text(formData, "seoDescription"),
      focusKeyword: text(formData, "focusKeyword"),
      canonicalUrl: text(formData, "canonicalUrl"),
      featuredImageUrl: text(formData, "featuredImageUrl"),
      featuredImagePublicId: text(formData, "featuredImagePublicId"),
      featuredImageAlt: text(formData, "featuredImageAlt"),
      ogImageUrl: text(formData, "ogImageUrl"),
      ogImagePublicId: text(formData, "ogImagePublicId"),
      ctaTitle: text(formData, "ctaTitle"),
      ctaDescription: text(formData, "ctaDescription"),
      ctaHref: text(formData, "ctaHref"),
      ctaLabel: text(formData, "ctaLabel"),
      featured: checked(formData, "featured"),
      allowIndex: checked(formData, "allowIndex"),
      nofollow: checked(formData, "nofollow"),
      version: Number(text(formData, "version")),
    });
    const post = await updateBlogPost({ actor, postId: id, payload });
    return NextResponse.json({ ok: true, id: post.id, slug: post.slug, version: post.version }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BlogAuthorizationError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof BlogConflictError) return NextResponse.json({ ok: false, error: error.message }, { status: 409, headers: { "Cache-Control": "no-store" } });
    if (error instanceof ZodError) return NextResponse.json({ ok: false, error: "Some article fields are invalid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    console.error("blog_autosave_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, error: "The draft could not be saved right now." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
