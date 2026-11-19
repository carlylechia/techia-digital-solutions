export const translationImageModes = ["reuse", "translate", "generate"] as const;

/**
 * How the French translation should source its featured image.
 *
 * - `reuse` keeps the English article's image untouched.
 * - `translate` asks the image model to translate the text inside the English
 *   image while keeping the rest of the composition.
 * - `generate` creates a completely new image from a French image prompt.
 */
export type TranslationImageMode = (typeof translationImageModes)[number];

export function isTranslationImageMode(value: unknown): value is TranslationImageMode {
  return typeof value === "string" && (translationImageModes as readonly string[]).includes(value);
}
