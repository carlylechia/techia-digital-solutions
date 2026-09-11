import type {
  NEWSLETTER_INTERESTS,
  NEWSLETTER_LANGUAGES,
  NEWSLETTER_SOURCES,
} from "./constants";

export type NewsletterLanguage = (typeof NEWSLETTER_LANGUAGES)[number];
export type NewsletterInterest = (typeof NEWSLETTER_INTERESTS)[number];
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export type NewsletterSubscribeInput = {
  email: string;
  firstName?: string;
  language: NewsletterLanguage;
  interest: NewsletterInterest;
  source: NewsletterSource;
  businessName?: string;
  consentDate?: Date;
};

export type NewsletterSubscribeStatus =
  | "success"
  | "duplicate"
  | "invalid"
  | "error";

export type NewsletterSubscribeResult = {
  ok: boolean;
  status: NewsletterSubscribeStatus;
  message: string;
  email?: string;
  subscriberId?: string;
  resendContactId?: string;
  warnings?: string[];
};

export type NewsletterSyncResult = {
  resendContactId?: string;
  segmentId?: string;
  automationEvent?: string;
  skipped?: boolean;
  warnings: string[];
};

export type NewsletterSubscriberRecord = {
  id: string;
  email: string;
  firstName?: string | null;
  language: string;
  interest: string;
  source: string;
  businessName?: string | null;
  consentDate?: Date | null;
  subscribed: boolean;
  resendContactId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type NewsletterSubscriberData = {
  email: string;
  firstName?: string | null;
  language: NewsletterLanguage;
  interest: NewsletterInterest;
  source: NewsletterSource;
  businessName?: string | null;
  consentDate?: Date;
  subscribed?: boolean;
  resendContactId?: string | null;
};

export type NewsletterDbClient = {
  newsletterSubscriber: {
    findUnique(args: {
      where: { email: string };
    }): Promise<NewsletterSubscriberRecord | null>;
    create(args: {
      data: NewsletterSubscriberData;
    }): Promise<NewsletterSubscriberRecord>;
    update(args: {
      where: { email: string };
      data: Partial<NewsletterSubscriberData>;
    }): Promise<NewsletterSubscriberRecord>;
  };
};

export type NewsletterContactSync = (
  input: NewsletterSubscribeInput,
  options?: {
    existingContactId?: string | null;
    hadExistingSubscriber?: boolean;
  },
) => Promise<NewsletterSyncResult>;
