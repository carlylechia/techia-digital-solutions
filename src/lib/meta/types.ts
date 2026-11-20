import { z } from "zod";

export const metaPublishPlatformSchema = z.enum(["FACEBOOK", "INSTAGRAM"]);
export type MetaPublishPlatform = z.infer<typeof metaPublishPlatformSchema>;

export const metaPublishInputSchema = z.object({
  postId: z.string().min(1).max(64),
  platform: metaPublishPlatformSchema,
  connectedAccountId: z.string().min(1).max(64),
  graphicId: z.string().min(1).max(64).optional().nullable(),
  idempotencyKey: z
    .string()
    .min(16)
    .max(128)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Idempotency keys may only contain letters, digits, hyphens, and underscores.",
    ),
  // Explicit human confirmation is mandatory. It is not a UI-only flag.
  confirm: z.literal(true),
});

export type MetaPublishInput = z.infer<typeof metaPublishInputSchema>;

export const metaAccountSelectionSchema = z.object({
  platform: z.enum(["FACEBOOK_PAGE", "INSTAGRAM"]),
  platformAccountId: z.string().min(1).max(64),
});

export const metaConnectAccountsInputSchema = z.object({
  connectionId: z.string().min(1).max(64),
  accounts: z.array(metaAccountSelectionSchema).min(1).max(20),
});

export const metaConnectionQuerySchema = z.object({
  connectionId: z.string().min(1).max(64).optional(),
});

export const metaHealthInputSchema = z.object({
  connectionId: z.string().min(1).max(64),
});

export const metaDisconnectAccountSchema = z.object({
  accountId: z.string().min(1).max(64),
});

export const metaDisconnectConnectionSchema = z.object({
  connectionId: z.string().min(1).max(64),
});

export const metaPublishingSettingsInputSchema = z.object({
  publishingEnabled: z.boolean(),
});

export const metaPublicationListQuerySchema = z.object({
  postId: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const metaResolvePublicationInputSchema = z.object({
  action: z.enum(["check", "confirm_published", "mark_failed"]),
  externalUrl: z.string().url().max(500).optional().or(z.literal("")),
});
