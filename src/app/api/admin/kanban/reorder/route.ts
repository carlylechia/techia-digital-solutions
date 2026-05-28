import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, readRequestJson } from "@/lib/api";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";
import { requireAdmin, writeAuditLog } from "@/lib/admin/session";
import { getPrisma } from "@/lib/prisma";

const reorderSchema = z.object({
  taskId: z.string().min(1),
  columnId: z.string().min(1),
  orderedTaskIds: z.array(z.string().min(1)).max(100).default([])
});

export async function POST(request: NextRequest) {
  const actor = await requireAdmin("processes.manage").catch(() => null);
  if (!actor) return apiError("server_error", 401, "en");

  const ip = requestIp(request.headers);
  const limit = checkRateLimit(`admin-kanban:${actor.id}:${ip}`, 90, 60_000);
  if (!limit.ok) return apiError("rate_limited", 429, "en", { headers: { "Retry-After": String(limit.retryAfter) } });

  const prisma = getPrisma();
  if (!prisma) return apiError("server_error", 503, "en");

  const raw = await readRequestJson(request, 16_000);
  const parsed = reorderSchema.safeParse(raw);
  if (!parsed.success) return apiError("invalid_payload", 400, "en");

  const task = await prisma.processTask.findUnique({ where: { id: parsed.data.taskId }, select: { id: true, boardId: true, projectId: true } });
  const column = await prisma.processColumn.findUnique({ where: { id: parsed.data.columnId }, select: { id: true, boardId: true, key: true } });
  if (!task || !column || task.boardId !== column.boardId) return apiError("invalid_payload", 400, "en");

  const scopedOrder = parsed.data.orderedTaskIds.filter((id) => id !== parsed.data.taskId);
  const nextOrder = [...scopedOrder, parsed.data.taskId];

  await prisma.$transaction([
    prisma.processTask.update({ where: { id: parsed.data.taskId }, data: { columnId: parsed.data.columnId } }),
    ...nextOrder.map((id, index) =>
      prisma.processTask.updateMany({
        where: { id, boardId: task.boardId },
        data: { position: (index + 1) * 1000 }
      })
    )
  ]);

  // Sync linked project's status when a delivery board task is moved
  if (task.projectId) {
    const colKeyToStatus: Record<string, string> = {
      intake: "PLANNED", scope: "PLANNED", build: "ACTIVE",
      review: "REVIEW", done: "DELIVERED"
    };
    const newStatus = colKeyToStatus[column.key];
    if (newStatus) {
      await prisma.clientProject.update({
        where: { id: task.projectId },
        data: { status: newStatus as import("@prisma/client").ProjectStatus }
      });
    }
  }

  await writeAuditLog({
    actorId: actor.id,
    action: "process_task.reordered",
    entityType: "ProcessTask",
    entityId: parsed.data.taskId,
    metadata: { columnId: parsed.data.columnId }
  });

  return apiOk();
}
