import { getPublishedPosts } from "@/lib/blog/queries";
import { getBlogPostPath } from "@/lib/blog/slug";
import { siteConfig } from "@/content/site";

export const revalidate = 300;

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const { posts } = await getPublishedPosts({ locale: "en", page: 1 });
  const items = posts.map((post) => {
    const url = `${siteConfig.url}${getBlogPostPath("en", post.slug)}`;
    return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(post.excerpt)}</description><pubDate>${new Date(post.publishedAt || Date.now()).toUTCString()}</pubDate><dc:creator>${escapeXml(post.author?.displayName || siteConfig.name)}</dc:creator><category>${escapeXml(post.category?.name || "Insights")}</category></item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(siteConfig.name)} — Insights</title><link>${escapeXml(`${siteConfig.url}/blog`)}</link><description>Practical digital growth insights from teChia Digital Solutions.</description><language>en</language><atom:link href="${escapeXml(`${siteConfig.url}/blog/feed.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
}
