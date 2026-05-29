export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  bytes: number;
  resource_type: string;
};

function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
  };
}

export function isCloudinaryConfigured() {
  const config = getCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

/**
 * Server-side signed upload to Cloudinary.
 *
 * @param forcePublic - When true, bypass any upload preset and use a fully-signed
 *   request with `access_mode: "public"`. Use this for sensitive files (e.g.
 *   proof-of-payment) where you need a guaranteed public `secure_url` regardless
 *   of how the preset is configured in the Cloudinary dashboard.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "portal-files",
  options: { forcePublic?: boolean } = {}
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.cloudName) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  if (!options.forcePublic && config.uploadPreset) {
    // Unsigned upload via preset — also append access_mode to override preset default
    formData.append("upload_preset", config.uploadPreset);
    formData.append("access_mode", "public");
  } else {
    // Signed upload — explicit public access_mode included in signature
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateSignature({ access_mode: "public", folder, timestamp }, config.apiSecret);
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("access_mode", "public");
    formData.append("signature", signature);
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
  const response = await fetch(url, { method: "POST", body: formData });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  return response.json() as Promise<CloudinaryUploadResult>;
}

async function generateSignature(params: Record<string, string | number>, apiSecret: string) {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const msgBuffer = new TextEncoder().encode(`${sortedParams}${apiSecret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-1 (used by Cloudinary's Admin/download API endpoints). */
async function generateSha1(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse a Cloudinary delivery URL into its components.
 * Handles: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{ver}/{public_id}.{format}
 */
export function parseCloudinaryUrl(url: string): {
  publicId: string;
  format: string;
  resourceType: string;
} | null {
  const match = url.match(/cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+)\.([^.]+)$/);
  if (!match) return null;
  return {
    resourceType: match[1], // "image", "video", "raw"
    publicId: match[2],     // "portal/client123/proofs/filename"
    format: match[3],       // "pdf", "jpg", "png" …
  };
}

/**
 * Generate a signed Cloudinary private-download URL.
 *
 * This URL bypasses access-mode and folder-level restrictions by using a
 * server-side signature (API key + secret).  The URL expires after `ttlSeconds`
 * (default 10 min) — plenty of time for a browser download to complete.
 */
export async function getCloudinaryPrivateDownloadUrl(
  publicId: string,
  format: string,
  resourceType = "image",
  ttlSeconds = 600,
): Promise<string | null> {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) return null;

  const timestamp = Math.round(Date.now() / 1000);
  const expiresAt = timestamp + ttlSeconds;

  // Cloudinary download API signature: all query params (except api_key + signature)
  // sorted alphabetically, concatenated as key=value&… then API secret appended.
  // Uses SHA-1 (the default for Cloudinary Admin API).
  const paramsForSig: Record<string, string | number> = {
    expires_at: expiresAt,
    format,
    public_id: publicId,
    timestamp,
    type: "upload",
  };

  const sigString = Object.entries(paramsForSig)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&") + config.apiSecret;

  const signature = await generateSha1(sigString);

  const params = new URLSearchParams({
    public_id: publicId,
    format,
    type: "upload",
    expires_at: String(expiresAt),
    timestamp: String(timestamp),
    api_key: config.apiKey,
    signature,
  });

  return `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/download?${params.toString()}`;
}

export async function deleteFromCloudinary(publicId: string) {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) return;

  const timestamp = Math.round(Date.now() / 1000);
  const signature = await generateSignature({ public_id: publicId, timestamp }, config.apiSecret);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`;
  await fetch(url, { method: "POST", body: formData });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileType: string): string {
  const type = fileType.toLowerCase();
  if (type.includes("pdf")) return "file-text";
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg") || type.includes("webp") || type.includes("svg")) return "image";
  if (type.includes("video") || type.includes("mp4") || type.includes("mov")) return "video";
  if (type.includes("audio")) return "music";
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("gz")) return "archive";
  if (type.includes("xls") || type.includes("csv") || type.includes("sheet")) return "table";
  if (type.includes("doc") || type.includes("word")) return "file-text";
  if (type.includes("ppt") || type.includes("presentation")) return "presentation";
  if (type.includes("figma") || type.includes("sketch")) return "pen-tool";
  return "file";
}
