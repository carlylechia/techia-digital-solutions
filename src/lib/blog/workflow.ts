import type { BlogPostStatusValue, BlogWorkflowAction } from "./constants";

export type { BlogWorkflowAction } from "./constants";

const writerTransitions: Partial<Record<BlogPostStatusValue, BlogWorkflowAction[]>> = {
  DRAFT: ["SUBMIT"],
  CHANGES_REQUESTED: ["SUBMIT"],
};

const adminTransitions: Record<BlogPostStatusValue, BlogWorkflowAction[]> = {
  DRAFT: ["SUBMIT", "PUBLISH", "SCHEDULE", "RETURN_TO_DRAFT"],
  IN_REVIEW: ["REQUEST_CHANGES", "RETURN_TO_DRAFT", "APPROVE", "PUBLISH", "SCHEDULE"],
  CHANGES_REQUESTED: ["SUBMIT", "RETURN_TO_DRAFT", "PUBLISH", "SCHEDULE"],
  SCHEDULED: ["RETURN_TO_DRAFT", "PUBLISH"],
  PUBLISHED: ["ARCHIVE"],
  ARCHIVED: ["RESTORE"],
};

export function isBlogPostStatus(value: unknown): value is BlogPostStatusValue {
  return typeof value === "string" && [
    "DRAFT",
    "IN_REVIEW",
    "CHANGES_REQUESTED",
    "SCHEDULED",
    "PUBLISHED",
    "ARCHIVED",
  ].includes(value);
}

export function canWriterEditPost(status: BlogPostStatusValue) {
  return status === "DRAFT" || status === "CHANGES_REQUESTED";
}

export function canWriterTransition(status: BlogPostStatusValue, action: BlogWorkflowAction) {
  return writerTransitions[status]?.includes(action) ?? false;
}

export function canAdminTransition(status: BlogPostStatusValue, action: BlogWorkflowAction) {
  return adminTransitions[status].includes(action);
}

export function assertWorkflowTransition(input: {
  status: BlogPostStatusValue;
  action: BlogWorkflowAction;
  isAdmin: boolean;
  scheduledAt?: Date | null;
  now?: Date;
}) {
  const allowed = input.isAdmin
    ? canAdminTransition(input.status, input.action)
    : canWriterTransition(input.status, input.action);

  if (!allowed) {
    throw new Error("This editorial status transition is not allowed.");
  }

  if (input.action === "SCHEDULE") {
    const now = input.now ?? new Date();
    if (!input.scheduledAt || input.scheduledAt.getTime() <= now.getTime()) {
      throw new Error("Scheduled publication must use a future date and time.");
    }
  }

  if (input.action === "PUBLISH" && input.status === "SCHEDULED") {
    const now = input.now ?? new Date();
    if (input.scheduledAt && input.scheduledAt.getTime() > now.getTime()) {
      throw new Error("This article is not scheduled to publish yet.");
    }
  }

  return true;
}

export function statusForAction(action: BlogWorkflowAction): BlogPostStatusValue {
  const statuses: Record<BlogWorkflowAction, BlogPostStatusValue> = {
    SUBMIT: "IN_REVIEW",
    REQUEST_CHANGES: "CHANGES_REQUESTED",
    RETURN_TO_DRAFT: "DRAFT",
    APPROVE: "IN_REVIEW",
    PUBLISH: "PUBLISHED",
    SCHEDULE: "SCHEDULED",
    ARCHIVE: "ARCHIVED",
    RESTORE: "DRAFT",
  };
  return statuses[action];
}
