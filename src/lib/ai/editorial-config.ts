import "server-only";

function envInt(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isEditorialAiEnabled() {
  return process.env.EDITORIAL_AI_ENABLED === "true";
}

export function isEditorialImageEnabled() {
  return isEditorialAiEnabled() && process.env.EDITORIAL_AI_IMAGE_ENABLED === "true";
}

export function getEditorialTextModel() {
  const configured = process.env.OPENAI_EDITORIAL_TEXT_MODEL?.trim();
  if (configured) return configured;
  const shared = process.env.OPENAI_MODEL?.trim();
  return shared || "";
}

export function getEditorialImageModel() {
  return process.env.OPENAI_EDITORIAL_IMAGE_MODEL?.trim() || "";
}

export function isEditorialTextModelConfigured() {
  return Boolean(getEditorialTextModel());
}

export function isEditorialImageModelConfigured() {
  return Boolean(getEditorialImageModel());
}

export const EDITORIAL_AI_CONFIG = {
  maxArticleGenerationsPerDay: envInt("EDITORIAL_AI_MAX_ARTICLE_GENERATIONS_PER_DAY", 10),
  maxImageGenerationsPerDay: envInt("EDITORIAL_AI_MAX_IMAGE_GENERATIONS_PER_DAY", 5),
  maxArticleWords: envInt("EDITORIAL_AI_MAX_ARTICLE_WORDS", 3000),
  timeoutMs: envInt("EDITORIAL_AI_TIMEOUT_MS", 120000),
  imageTimeoutMs: envInt("EDITORIAL_AI_IMAGE_TIMEOUT_MS", 180000),
  maxInputChars: envInt("EDITORIAL_AI_MAX_INPUT_CHARS", 12000),
} as const;