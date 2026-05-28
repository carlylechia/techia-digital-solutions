"use client";

import { DndContext, type DragEndEvent, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Archive, Calendar, ChevronDown, ChevronUp, Edit2, GripVertical, Plus, RotateCcw, Tag, Trash2, User, X } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  archiveTaskAction,
  createBoardColumnAction,
  deleteBoardColumnAction,
  deleteTaskAction,
  updateBoardColumnAction,
  updateTaskAction
} from "@/app/[locale]/admin/actions";
import type { AdminDashboardData } from "@/lib/admin/dashboard";
import type { Locale } from "@/content/site";
import { DatePicker } from "@/components/admin/date-picker";

type Board = AdminDashboardData["boards"][number];
type Task = Board["tasks"][number];
type Column = Board["columns"][number];
type AdminRef = { id: string; name: string | null; email: string };
type ClientRef = { id: string; name: string };
type ProjectRef = { id: string; title: string };

interface KanbanBoardProps {
  board: Board;
  locale: Locale;
  canManage: boolean;
  admins: AdminRef[];
  clients: ClientRef[];
  projects: ProjectRef[];
}

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const priorityLabels: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };

function priorityClass(priority: string) {
  if (priority === "URGENT") return "border-red-500/40 bg-red-500/10 text-red-300";
  if (priority === "HIGH") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  if (priority === "LOW") return "border-slate-500/30 bg-slate-500/10 text-muted";
  return "border-cyan-500/30 bg-cyan-500/10 text-accent";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ── Task expand / edit modal ─────────────────────────────────────────────────

function TaskModal({
  task,
  board,
  locale,
  canManage,
  admins,
  clients,
  projects,
  onClose
}: {
  task: Task;
  board: Board;
  locale: Locale;
  canManage: boolean;
  admins: AdminRef[];
  clients: ClientRef[];
  projects: ProjectRef[];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateTaskAction(formData);
        setEditing(false);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task.");
      }
    });
  }

  function handleDelete(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteTaskAction(formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task.");
      }
    });
  }

  function handleArchive(archived: boolean) {
    setError(null);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("id", task.id);
    fd.set("archived", String(archived));
    startTransition(async () => {
      try {
        await archiveTaskAction(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to archive task.");
      }
    });
  }

  const dueDateValue = task.dueDate ? task.dueDate.slice(0, 10) : "";
  const tagsValue = task.tags.join(", ");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={task.title}
    >
      <div className="my-6 w-full max-w-2xl rounded-xl border border-border bg-surface shadow-2xl sm:my-8">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold">
              <span className={`rounded-full border px-2 py-0.5 ${priorityClass(task.priority)}`}>{priorityLabels[task.priority]}</span>
              {task.client ? <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">{task.client.name}</span> : null}
              {task.project ? <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">{task.project.title}</span> : null}
            </div>
            <h2 className="mt-2 break-words text-xl font-semibold text-primary">{task.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-border p-1.5 text-muted hover:text-primary">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {!editing ? (
            <div className="grid gap-5">
              {task.description ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Description</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-primary">{task.description}</p>
                </div>
              ) : (
                <p className="text-sm italic text-muted">No description yet.</p>
              )}

              <div className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-2">
                {task.assignee ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <User className="size-3.5 shrink-0" />
                    <span>{task.assignee.name || task.assignee.email}</span>
                  </div>
                ) : null}
                {task.dueDate ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="size-3.5 shrink-0" />
                    <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  </div>
                ) : null}
                {task.tags.length > 0 ? (
                  <div className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
                    <Tag className="mt-0.5 size-3.5 shrink-0" />
                    <span className="break-words">{task.tags.join(", ")}</span>
                  </div>
                ) : null}
              </div>

              {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}

              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-primary hover:bg-accent/10"
                  >
                    <Edit2 className="size-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(true)}
                    disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    <Archive className="size-3.5" /> Archive
                  </button>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  ) : (
                    <form action={handleDelete} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={task.id} />
                      <span className="text-sm text-red-400">Confirm delete?</span>
                      <button type="submit" disabled={pending} className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 disabled:opacity-50">Yes, delete</button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted">Cancel</button>
                    </form>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <form action={handleUpdate} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={task.id} />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-title">Title</label>
                <input
                  id="modal-title"
                  name="title"
                  required
                  defaultValue={task.title}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-desc">Description</label>
                <textarea
                  id="modal-desc"
                  name="description"
                  rows={5}
                  defaultValue={task.description || ""}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-column">Column</label>
                  <select
                    id="modal-column"
                    name="columnId"
                    defaultValue={task.columnId}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    {board.columns.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-priority">Priority</label>
                  <select
                    id="modal-priority"
                    name="priority"
                    defaultValue={task.priority}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    {priorities.map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-due">Due date</label>
                  <DatePicker key={`modal-due-${task.id}-${dueDateValue || "empty"}`} id="modal-due" name="dueDate" defaultValue={dueDateValue} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-assignee">Assignee</label>
                  <select
                    id="modal-assignee"
                    name="assigneeId"
                    defaultValue={task.assignee?.id || ""}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    <option value="">Unassigned</option>
                    {admins.map((a) => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-client">Client</label>
                  <select
                    id="modal-client"
                    name="clientId"
                    defaultValue={task.client?.id || ""}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    <option value="">None</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-project">Project</label>
                  <select
                    id="modal-project"
                    name="projectId"
                    defaultValue={task.project?.id || ""}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    <option value="">None</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted" htmlFor="modal-tags">Tags</label>
                <input
                  id="modal-tags"
                  name="tags"
                  defaultValue={tagsValue}
                  placeholder="proposal, design, waiting"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}

              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent/90 disabled:opacity-50 max-sm:w-full">
                  {pending ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-primary max-sm:w-full">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Column manager ────────────────────────────────────────────────────────────

function ColumnManager({ board, locale }: { board: Board; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const addRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createBoardColumnAction(formData);
        addRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add column.");
      }
    });
  }

  function handleUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateBoardColumnAction(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update column.");
      }
    });
  }

  function handleDelete(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteBoardColumnAction(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete column.");
      }
    });
  }

  return (
    <div className="mb-3 rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted hover:text-primary"
      >
        <span>Manage columns ({board.columns.length})</span>
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {open ? (
        <div className="border-t border-border p-4">
          <div className="mb-4 grid gap-2">
            {board.columns.map((col) => (
              <div key={col.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: col.color || "var(--accent)" }} />
                <form action={handleUpdate} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={col.id} />
                  <input
                    name="title"
                    defaultValue={col.title}
                    required
                    className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-primary outline-none focus:border-accent"
                  />
                  <input
                    name="color"
                    type="color"
                    defaultValue={col.color || "#06b6d4"}
                    className="size-7 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
                  />
                  <button type="submit" disabled={pending} className="shrink-0 rounded border border-border bg-surface px-2 py-1 text-xs font-semibold text-muted hover:text-primary disabled:opacity-50">
                    Save
                  </button>
                </form>
                <form action={handleDelete}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={col.id} />
                  <button type="submit" disabled={pending} aria-label="Delete column" className="shrink-0 rounded border border-red-500/30 bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 disabled:opacity-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </form>
              </div>
            ))}
          </div>

          <form ref={addRef} action={handleAdd} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="boardId" value={board.id} />
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-semibold text-muted">New column name</label>
              <input
                name="title"
                required
                placeholder="e.g. QA Review"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Color</label>
              <input name="color" type="color" defaultValue="#06b6d4" className="size-9 cursor-pointer rounded-lg border border-border bg-background p-1" />
            </div>
            <button type="submit" disabled={pending} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-background disabled:opacity-50 max-sm:w-full max-sm:justify-center">
              <Plus className="size-3.5" /> Add
            </button>
          </form>

          {error ? <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function KanbanCard({ task, onExpand }: { task: Task; onExpand: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onExpand(task)}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-surface p-3 shadow-sm transition select-none",
        isDragging ? "z-20 opacity-70 ring-2 ring-accent" : "hover:border-accent/40 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted/40" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h4 className="break-words text-sm font-semibold leading-5 text-primary">{task.title}</h4>
          {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{task.description}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold">
        <span className={`rounded-full border px-2 py-0.5 ${priorityClass(task.priority)}`}>{priorityLabels[task.priority]}</span>
        {task.client ? <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">{task.client.name}</span> : null}
        {task.project ? <span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-accent/80">{task.project.title}</span> : null}
        {task.dueDate ? (
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ) : null}
        {task.assignee ? <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">{task.assignee.name || task.assignee.email}</span> : null}
      </div>
    </article>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onExpand }: { column: Column; tasks: Task[]; onExpand: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      ref={setNodeRef}
      className={cn("min-h-80 w-[min(18rem,85vw)] min-w-[16rem] rounded-lg border border-border bg-background p-3 transition sm:min-w-[18rem]", isOver && "border-accent bg-accent/5")}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.color || "var(--accent)" }} />
          <h3 className="break-words text-sm font-semibold text-primary">{column.title}</h3>
        </div>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted">{tasks.length}</span>
      </div>
      <div className="grid gap-3">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onExpand={onExpand} />
        ))}
        {!tasks.length ? <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">Drop work here</p> : null}
      </div>
    </section>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function AdminKanbanBoard({ board, locale, canManage, admins, clients, projects }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(board.tasks);
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeTasks = useMemo(() => tasks.filter((t) => !t.archived), [tasks]);
  const archivedTasks = useMemo(() => tasks.filter((t) => t.archived), [tasks]);

  const tasksByColumn = useMemo(() => {
    return Object.fromEntries(
      board.columns.map((column) => [
        column.id,
        activeTasks
          .filter((task) => task.columnId === column.id)
          .sort((left, right) => left.position - right.position || left.title.localeCompare(right.title))
      ])
    ) as Record<string, Task[]>;
  }, [board.columns, activeTasks]);

  async function onDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const columnId = event.over ? String(event.over.id) : "";
    const task = tasks.find((item) => item.id === taskId);
    const targetColumn = board.columns.find((column) => column.id === columnId);
    if (!task || !targetColumn || task.columnId === columnId) return;

    const previousTasks = tasks;
    const maxPosition = Math.max(0, ...tasks.filter((item) => item.columnId === columnId).map((item) => item.position));
    const nextTasks = tasks.map((item) => (item.id === taskId ? { ...item, columnId, position: maxPosition + 1000 } : item));
    setTasks(nextTasks);

    const orderedTaskIds = nextTasks
      .filter((item) => item.columnId === columnId)
      .sort((left, right) => left.position - right.position)
      .map((item) => item.id);

    const response = await fetch("/api/admin/kanban/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, columnId, orderedTaskIds })
    });

    if (!response.ok) setTasks(previousTasks);
  }

  return (
    <>
      {canManage ? <ColumnManager board={board} locale={locale} /> : null}

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
        <div className="-mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-4">
            {board.columns.map((column) => (
              <KanbanColumn key={column.id} column={column} tasks={tasksByColumn[column.id] || []} onExpand={setExpandedTask} />
            ))}
          </div>
        </div>
      </DndContext>

      {archivedTasks.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-background">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <Archive className="size-3.5" />
              Archived tasks ({archivedTasks.length})
            </span>
            {showArchived ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {showArchived && (
            <div className="border-t border-border p-4 grid gap-2">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3 opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-primary line-through">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] font-semibold">
                      <span className={`rounded-full border px-2 py-0.5 ${priorityClass(task.priority)}`}>{priorityLabels[task.priority]}</span>
                      {task.client && <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">{task.client.name}</span>}
                      {task.project && <span className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-accent/80">{task.project.title}</span>}
                      <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted">
                        {board.columns.find((c) => c.id === task.columnId)?.title ?? "Unknown column"}
                      </span>
                    </div>
                    {task.description && <p className="mt-1 line-clamp-2 break-words text-xs text-muted">{task.description}</p>}
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      title="Unarchive"
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("locale", locale);
                        fd.set("id", task.id);
                        fd.set("archived", "false");
                        archiveTaskAction(fd);
                      }}
                      className="shrink-0 rounded-lg border border-border bg-background p-1.5 text-muted hover:text-primary"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {expandedTask ? (
        <TaskModal
          task={expandedTask}
          board={board}
          locale={locale}
          canManage={canManage}
          admins={admins}
          clients={clients}
          projects={projects}
          onClose={() => setExpandedTask(null)}
        />
      ) : null}
    </>
  );
}
