import Image from "next/image";
import { sanitizeArticleHtml } from "@/lib/blog/sanitize";

export function ArticleBody({ html }: { html: string }) {
  const safeHtml = sanitizeArticleHtml(html);
  return (
    <div
      className="blog-prose prose prose-invert max-w-none text-base leading-8 text-muted sm:text-lg"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

export function ArticleImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <figure className="my-8 overflow-hidden rounded-[1.5rem] border border-border bg-surface-strong">
      <Image src={src} alt={alt} width={1200} height={675} priority={priority} className="h-auto w-full object-cover" />
      {alt ? <figcaption className="px-4 py-3 text-xs text-muted">{alt}</figcaption> : null}
    </figure>
  );
}
