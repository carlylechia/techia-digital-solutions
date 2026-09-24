import { hasPermission, type AdminPermission } from "@/lib/admin/permissions";
import { canWriterEditPost, canWriterTransition, type BlogWorkflowAction } from "./workflow";

export function canEditBlogPost(input: { permissions: AdminPermission[]; actorId: string; authorUserId: string | null; status: "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" }) {
  if (hasPermission(input.permissions, "blog.posts.manage")) return true;
  return input.authorUserId === input.actorId && hasPermission(input.permissions, "blog.posts.edit.own") && canWriterEditPost(input.status);
}

export function canTransitionBlogPost(input: { permissions: AdminPermission[]; actorId: string; authorUserId: string | null; status: "DRAFT" | "IN_REVIEW" | "CHANGES_REQUESTED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"; action: BlogWorkflowAction }) {
  if (hasPermission(input.permissions, "blog.posts.manage")) return true;
  return input.authorUserId === input.actorId && hasPermission(input.permissions, "blog.posts.submit.own") && canWriterTransition(input.status, input.action);
}
