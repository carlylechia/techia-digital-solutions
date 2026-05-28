import { Prisma } from "@prisma/client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isPrismaSchemaDriftError(
  error: unknown,
  identifiers: string[] = []
): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const meta =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? JSON.stringify(error.meta ?? {}).toLowerCase()
      : "";

  const looksLikeSchemaDrift =
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")) ||
    message.includes("does not exist in the current database") ||
    (message.includes("column") && message.includes("does not exist"));

  if (!looksLikeSchemaDrift) return false;
  if (identifiers.length === 0) return true;

  const haystack = `${message} ${meta}`;
  return identifiers.some((identifier) => haystack.includes(identifier.toLowerCase()));
}
