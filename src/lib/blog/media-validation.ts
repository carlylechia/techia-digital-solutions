import { BLOG_ALLOWED_IMAGE_MIME_TYPES } from "./constants";

export function detectImageMime(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(new TextDecoder().decode(bytes.slice(8, 12)).toLowerCase())) return "image/avif";
  return null;
}

export function isAllowedBlogImageMime(value: string | null): value is (typeof BLOG_ALLOWED_IMAGE_MIME_TYPES)[number] {
  return Boolean(value && BLOG_ALLOWED_IMAGE_MIME_TYPES.includes(value as (typeof BLOG_ALLOWED_IMAGE_MIME_TYPES)[number]));
}
