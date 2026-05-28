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
 * Uses the unsigned upload preset for simpler setup or signed for security.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "portal-files"
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.cloudName) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  if (config.uploadPreset) {
    // Unsigned upload (simpler)
    formData.append("upload_preset", config.uploadPreset);
  } else {
    // Signed upload
    const timestamp = Math.round(Date.now() / 1000);
    const signature = await generateSignature({ folder, timestamp }, config.apiSecret);
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", String(timestamp));
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
